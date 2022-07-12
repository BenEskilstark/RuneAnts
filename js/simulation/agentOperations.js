// @flow

const {
  add, subtract, vectorTheta, makeVector, containsVector,
  dist, equals, magnitude, round,
} = require('../utils/vectors');
const {closeTo, thetaToDir, isDiagonalMove} = require('../utils/helpers');
const globalConfig = require('../config');
const {
  addEntity, removeEntity, moveEntity, pickupEntity, putdownEntity,
  rotateEntity, changeEntityType,
  addSegmentToEntity,
} = require('../simulation/entityOperations');
const {
  lookupInGrid, getPheromonesInCell, insideGrid,
  entityInsideGrid, getEntityPositions,
} = require('../utils/gridHelpers');
const {
  collides, collidesWith,
} = require('../selectors/collisions');
const {
  getPositionsInFront, getPositionsBehind, isFacing, canDoMove,
} = require('../selectors/misc');
const {
  getPheromoneAtPosition,
} = require('../selectors/pheromones');
const {
  getNeighborPositions, getNeighborEntities, areNeighbors,
  getFreeNeighborPositions, getNeighborEntitiesAndPosition,
} = require('../selectors/neighbors');
const {fillPheromone} = require('../simulation/pheromones');
const {oneOf, weightedOneOf} = require('../utils/stochastic');
const {
  makeAction, isActionTypeQueued,
  queueAction, stackAction, cancelAction,
} = require('../simulation/actionQueue');
const {Entities} = require('../entities/registry');

import type {
  Game, Task, Grid, Entity, EntityID, EntityType, Ant, Spider,
} from '../types';

const agentPickup = (
  game: Game, agent: Agent, entity: Entity, pickupPos: Vector,
): Game => {
  const {config} = Entities[agent.type];
  // if (!areNeighbors(game, agent, entity)) return game;
  if (!config.pickupTypes.includes(entity.type)) return game;

  // support picking up more than 1 thing
  if (agent.holdingIDs.length >= config.maxHold) return game;

  // update task need if agent not doing go_to_dirt picks up marked dirt
  // if (
  //   agent.task != 'GO_TO_DIRT' && entity.type == 'DIRT' && entity.marked == agent.playerID &&
  //   game.bases[agent.playerID].taskNeed['GO_TO_DIRT'] > 0
  // ) {
  //   game.bases[agent.playerID].taskNeed['GO_TO_DIRT'] -= 1;
  // }

  // do the actual pickup
  agent.holding = pickupEntity(game, entity, pickupPos);
  agent.holdingIDs.push(agent.holding.id);
  agent.lastHeldID = agent.holding.id;

  return game;
}

const agentPutdown = (game: Game, agent: Agent): Game => {
  if (agent.holding == null) {
    return game;
  }

  const putDownPositions = getPositionsInFront(game, agent);
  for (const putDownPos of putDownPositions) {

    const occupied = lookupInGrid(game.grid, putDownPos)
      .map(id => game.entities[id])
      .filter(e => !e.notBlockingPutdown)
    let shouldLoad = false
    let toLoad = null;
    if (occupied.length > 0) {
      if (!agent.LOADER) continue;
      toLoad = occupied[0];
      if (toLoad.holdingIDs.length >= toLoad.maxHold) continue;
      shouldLoad = true;
    }
    if (!insideGrid(game.grid, putDownPos)) continue;

    const heldEntity = agent.holding;
    putdownEntity(game, agent.holding, putDownPos);

    // suport transferring entity from agent (loader) to something else
    if (shouldLoad) {
      // see agentPickup above for this pasta
      toLoad.holding = pickupEntity(game, heldEntity, putDownPos);
      toLoad.holdingIDs.push(toLoad.holding.id);
    }

    // allow holding more than 1 thing
    agent.holdingIDs.pop();
    if (agent.holdingIDs.length == 0) {
      agent.holding = null;
    } else {
      agent.holding = game.entities[agent.holdingIDs[agent.holdingIDs.length - 1]];
    }
    break;
  }

  return game;
}

const agentSwitchTask = (game: Game, agent: Agent, task: Task): Game => {
  if (agent.task == task) return game; // don't switch to task you're already doing
  // TODO: handling "improper" task transitions like this is not scaleable
  if (agent.task == 'GO_TO_DIRT' && task != 'MOVE_DIRT') {
    game.bases[agent.playerID].taskNeed['GO_TO_DIRT'] += 1;
  }

  agent.task = task;
  if (game.bases[agent.playerID].taskNeed[task] != null) {
    game.bases[agent.playerID].taskNeed[task] -= 1;
  }
  agent.timeOnTask = 0;
  return game;
}

// -----------------------------------------------------------------------
// Agent Decision
// -----------------------------------------------------------------------

const agentDecideMove = (game: Game, agent: Agent): Game => {
  const config = agent;
  let blockers = config.blockingTypes;
  if (!blockers) {
    console.error("no blockers", agent);
    blockers = [...Entities.AGENT.config.blockingTypes];
  }

  let freeNeighbors = getFreeNeighborPositions(game, agent, blockers)
    .filter(pos => canDoMove(game, agent, pos).result);
  if (agent.segmented) {
    freeNeighbors = freeNeighbors.filter(p => !isDiagonalMove(agent.position, p));
  }
  if (freeNeighbors.length == 0) {
    agent.prevPosition = {...agent.position};
    return game;
  }

  let taskConfig = config[agent.task];
  for (const pherType in globalConfig.pheromones) {
    if (taskConfig[pherType] == null) {
      taskConfig[pherType] = 0;
    }
  }
  const playerID = agent.playerID;
  const baseScore = taskConfig.base;

  const basePher = getPheromonesInCell(game.grid, agent.position, playerID);
  const pheromoneNeighbors = freeNeighbors
    .map(pos => getPheromonesInCell(game.grid, pos, playerID));
  let neighborScores = freeNeighbors.map(n => baseScore);
  for (let i = 0; i < freeNeighbors.length; i++) {
    const pos = freeNeighbors[i];

    // weight this square across each pheromone value
    const pher = pheromoneNeighbors[i];
    for (const pherType in pher) {
      neighborScores[i] +=
        (pher[pherType] - basePher[pherType]) * taskConfig[pherType]
    }

    // penalize moving to previous position
    if (equals(pos, agent.prevPosition)) {
      neighborScores[i] += taskConfig.prevPositionPenalty;
    }

    // boost continuing to move straight
    if (magnitude(subtract(pos, agent.prevPosition)) == 2) {
      neighborScores[i] += taskConfig.forwardMovementBonus;
    }

    // normalize score
    neighborScores[i] = Math.max(baseScore, neighborScores[i]);
    neighborScores[i] = Math.ceil(neighborScores[i]);
  }

  // don't let every neighbor have 0 score
  let allZero = true;
  for (let j = 0; j < neighborScores.length; j++) {
    if (neighborScores[j] != 0) {
      allZero = false;
    }
  }
  if (allZero) {
    neighborScores = neighborScores.map(s => 1);
  }
  const nextPos = weightedOneOf(freeNeighbors, neighborScores);
  if (nextPos == null) {
    console.log('nextPos was null', nextPos);
    console.log(neighborScores, allZero);
  }
  if (game.showAgentDecision) {
    agent.decisions = [];
    for (let i = 0; i < freeNeighbors.length; i++) {
      agent.decisions.push({
        position: freeNeighbors[i],
        score: neighborScores[i],
        chosen: equals(freeNeighbors[i], nextPos),
      });
    }
  }

  agentDecideTask(game, agent, nextPos);

  queueAction(game, agent, makeAction(game, agent, 'MOVE', {nextPos}));
  return game;
}


const agentDecideTask = (game, agent, nextPos): void => {
  if (agent.COLLECTABLE) return; // collectables already have their task set

  // switch to retrieve if holding food
  const holdingFood = agent.holding != null && agent.holding.type == 'FOOD';
  if (holdingFood && agent.task != 'RETURN') {
    agent.task = 'RETURN';
    return agent.task;
  }

  // switch to wander if retrieving without food
  if (!holdingFood && agent.task == 'RETURN') {
    agent.task = 'WANDER';
    return agent.task;
  }

  const pherAtCell = getPheromonesInCell(game.grid, nextPos, agent.playerID);

  // TODO: switch to RETRIEVE if on FOOD pheromone

  // TODO: switch to DEFEND if on ALERT pheromone

  return agent.task;
}

// ----------------------------------------------------------------------
// Deciding actions
// ----------------------------------------------------------------------

const agentDecideAction = (game: Game, agent: Agent): void => {
  if (game.controlledEntity != null && game.controlledEntity.id == agent.id) {
    return; // action decided by player
  }

  switch (agent.type) {
    case 'ANT':
      antDecideAction(game, agent);
      break;
    case 'AGENT':
    case 'WORM':  {
      // MOVE
      agentDecideMove(game, agent);
      break;
    }
  }

};

const antDecideAction = (game, ant) => {
  // DROP OFF FOOD

  // FIGHT

  // PICK UP FOOD

  // MOVE
  agentDecideMove(game, agent);
};

const antDecideAction = (game: Game, ant: Ant): void => {
  const config = getEntityConfig(game, ant);

  // trapjawing ants don't do anything
  if (ant.position == null) return;

  // allow queen to feed
  if (ant.holding != null) {
    // FEED
    const neighboringLarva = getNeighborPositions(game, ant, true /* external */)
      .map(pos => {
        return lookupInGrid(game.grid, pos)
          .filter(id => game.entities[id].type == 'LARVA')[0];
      })
      .filter(id => id != null)
      .map(id => game.entities[id])
      .filter(l => l.foodNeed > 0);
    if (ant.holding.type == 'FOOD' && neighboringLarva.length > 0) {
      queueAction(game, ant, makeAction(game, ant, 'FEED'));
      return;
    }
  }

  // don't do anything else if this ant is the player's queen
  if (
    ant.caste == 'QUEEN' && game.players[ant.playerID].type == 'HUMAN' && !ant.autopilot
  ) {
    const token = game.TOKEN
      .map(id => game.entities[id])
      .filter(t => t.pheromoneType == 'QUEEN_FOLLOW' && t.playerID == game.playerID)[0];
    // queen moves "automatically" if the token exists, ie uses this function
    if (token != null) {
      antDecideMove(game, ant);
    }
    return;
  }

  // if this is a honeypot ant, the affix to dirt or stone
  // AND if affixed, then lay food every once in a while
  if (ant.caste == 'HONEY_POT') {
    if (!ant.affixed) { // see if you should affix
      if (canLayFood(game, ant)) {
        const positions = getPositionsInFront(game, ant);
        for (const pos of positions) {
          const occupied = lookupInGrid(game.grid, pos)
            .filter(id => ant.id != id)
            .map(id => game.entities[id])
            .filter(e => e.type == 'DIRT' || e.type == 'STONE')
            .length > 0;
          const inGrid = insideGrid(game.grid, pos);
          if (occupied && inGrid && thetaToDir(ant.theta, true) != null) {
            ant.affixed = true;
            return; // affixed honeypots don't move
          }
        }
      }
    } else {
      // laying food
      if (ant.foodLayingCooldown < 0) {
        ant.foodLayingCooldown = config.foodLayingCooldown

        const positions = getPositionsBehind(game, ant);
        for (const pos of positions) {
          const occupied = lookupInGrid(game.grid, pos)
            .filter(id => ant.id != id)
            .length > 0;
          const inGrid = insideGrid(game.grid, pos);
          if (!occupied && inGrid && thetaToDir(ant.theta, true) != null) {
            addEntity(game, makeFood(game, pos));
          }
        }
      } else {
        ant.foodLayingCooldown -= game.timeSinceLastTick;
      }
      return; // affixed honeypots don't move
    }
  }

  // FIGHT
  if (
    ant.holding == null &&
    // getPheromoneAtPosition(game, ant.position, 'PATROL_DEFEND_PHER', ant.playerID) == 0 &&
    // ^^ handle only based on task, not pheromone
    config.damage > 0
  ) {
    const domPher =
      getPheromoneAtPosition(game, ant.position, 'DOMESTICATE', ant.playerID) > 0;
    const rallyPher =
      getPheromoneAtPosition(game, ant.position, 'PATROL_DEFEND_PHER', ant.playerID) > 0;
    const targets = getNeighborEntities(game, ant, true)
      .filter(e => {
        if (e.position == null) return false;
        if (
          isDiagonalMove(ant.position, e.position) && e.type == 'ANT'
          && e.caste == 'MINIMA'
        ) return false;
        return (
          (game.config.critterTypes.includes(e.type) && !domPher) ||
          (e.type == 'ANT' && e.playerID != ant.playerID) ||
          (e.type == 'TERMITE' && e.playerID != ant.playerID) ||
          // (e.type == 'FOOT' && e.state == 'stomping') ||
          // ants alerted by the queen will attack anything with hp
          (e.playerID != ant.playerID && e.hp > 0 && e.type != 'FOOT' &&
            getPheromoneAtPosition(game, ant.position, 'QUEEN_ALERT', ant.playerID) > 0
            && ant.task == 'DEFEND')
        );
      });

    if (targets.length > 0 && ant.task != 'PATROL_DEFEND' && !rallyPher) {
      // always prefer to grapple if possible
      let filteredTargets = targets.filter(t => {
        if (ant.caste != 'MINIMA') return true;
        return t.caste == 'MINIMA';
      });
      let shouldFight = true;
      let target = filteredTargets.length > 0 ? oneOf(filteredTargets) : oneOf(targets);
      let actionType = 'BITE';
      if (
        (target.caste == 'MINIMA' && ant.caste == 'MINIMA')
        || (target.caste == 'TERMITE_WORKER' && ant.caste == 'MINIMA')
        // || (target.caste == 'MEDIA' && ant.caste == 'MEDIA')
      ) {
        // special case for queen with break up grapple ability
        if (
          getPheromoneAtPosition(game, ant.position, 'QUEEN_DISPERSE', ant.playerID) > 0 ||
          getPheromoneAtPosition(game, ant.position, 'QUEEN_DISPERSE', target.playerID) > 0
        ) {
          if (ant.playerID == game.playerID && game.config[playerID].queenBreaksUpGrapple) {
            actionType = 'BITE';
          } else {
            shouldFight = false;
          }
        } else {
          actionType = 'GRAPPLE';
        }
      }
      if (shouldFight) {
        // special case for CPU queens w/whirlwind or dash ability
        if (
          ant.caste == 'QUEEN' &&
          game.config[ant.playerID].queenAbilities.includes('JUMP') &&
          Math.random() < 0.2
        ) {
          actionType = 'DASH';
          target = {nextPos: {...target.position}};
        }
        if (
          ant.caste == 'QUEEN' &&
          game.config[ant.playerID].queenAbilities.includes('WHIRLWIND') &&
          Math.random() < 0.2
        ) {
          actionType = 'WHIRLWIND';
        }
        queueAction(game, ant, makeAction(game, ant, actionType, target));
        return;
      }
    }
  }

  // PICKUP
  if (ant.holdingIDs.length < config.maxHold) {
    // cpu queen
    if (ant.caste == 'QUEEN') {
      antDecideMove(game, ant);
      return;
    }

    antPickupNeighbor(game, ant);

    // EXAMINE
    if (
      ant.caste == 'MINIMA' && ant.actions.length == 0 && ant.task == 'WANDER' &&
      getPheromoneAtPosition(game, ant.position, 'QUEEN_PHER', ant.playerID) == 0
    ) {
      const posRight = round(add(ant.position, makeVector(ant.theta - Math.PI / 2, 1)));
      let examiningRight = false;
      if (insideGrid(game.grid, posRight)) {
        const rightOccupied = lookupInGrid(game.grid, posRight)
          .map(id => game.entities[id])
          .filter(e => getEntityConfig(game, ant).blockingTypes.includes(e.type))
          .length > 0;
        if (rightOccupied && Math.random() < 0.33) {
          queueAction(game, ant, makeAction(game, ant, 'EXAMINE', 'right'));
          examiningRight = true;
        }
      }

      const posLeft = round(add(ant.position, makeVector(ant.theta + Math.PI / 2, 1)));
      if (insideGrid(posLeft)) {
        const leftOccupied = lookupInGrid(game.grid, posLeft)
          .map(id => game.entities[id])
          .filter(e => getEntityConfig(game, ant).blockingTypes.includes(e.type))
          .length > 0;
        if (!examiningRight && leftOccupied && Math.random() < 0.33) {
          queueAction(game, ant, makeAction(game, ant, 'EXAMINE', 'left'));
        }
      }
    }
  }

  // PUTDOWN
  const holdingFood = ant.holding != null && ant.holding.type == 'FOOD';
  const holdingDirt = ant.holding != null && ant.holding.type == 'DIRT';
  const holdingEgg = ant.holding != null && ant.holding.type == 'EGG';
  const holdingLarva = ant.holding != null && ant.holding.type == 'LARVA';
  const holdingPupa = ant.holding != null && ant.holding.type == 'PUPA';

  if (ant.holding != null) {
    const possiblePutdownPositions = getNeighborPositions(game, ant, true /*external*/);
    for (const putdownPos of possiblePutdownPositions) {
      const putdownLoc = {position: putdownPos, playerID: ant.playerID};
      const occupied = lookupInGrid(game.grid, putdownPos)
        .map(id => game.entities[id])
        .filter(e => {
          return e.type.slice(0, 4) != 'DEAD' && e.type != 'BACKGROUND'
            && e.type != 'SPIDER_WEB' && e.type != 'ANT';
        })
        .length > 0;
      const nextTheta = vectorTheta(subtract(ant.position, putdownPos));

      // if Returning and near colony token, put down
      const fQ = game.config[ant.playerID].COLONY.quantity;
      if (
        (ant.task == 'RETURN') &&
        (
          inTokenRadius(game, putdownLoc, 'COLONY') ||
          getPheromoneAtPosition(game, putdownLoc.position, 'COLONY', ant.playerID) == fQ
        ) &&
        !occupied
      ) {
        if (!isFacing(ant, putdownPos)) {
          queueAction(game, ant, makeAction(game, ant, 'TURN', nextTheta));
        }
        queueAction(game, ant, makeAction(game, ant, 'PUTDOWN', {position: putdownPos}));
        return;
      }
      // if holding dirt and near putdown token, put it down
      if (
        (holdingDirt || ant.task == 'MOVE_DIRT')
        && (
          inTokenRadius(game, putdownLoc, 'DIRT_DROP') ||
          getPheromoneAtPosition(game, putdownPos, 'DIRT_DROP', ant.playerID) ==
            game.config[ant.playerID]['DIRT_DROP'].quantity
        )
        && !occupied
      ) {
        if (!isFacing(ant, putdownPos)) {
          queueAction(game, ant, makeAction(game, ant, 'TURN', nextTheta));
        }
        queueAction(game, ant, makeAction(game, ant, 'PUTDOWN', {position: putdownPos}));
        return;
      }
      // if holding egg and near putdown token, put it down
      if (
        (holdingEgg || ant.task == 'MOVE_EGG')
        && inTokenRadius(game, putdownLoc, 'EGG')
        && !occupied
      ) {
        if (!isFacing(ant, putdownPos)) {
          queueAction(game, ant, makeAction(game, ant, 'TURN', nextTheta));
        }
        queueAction(game, ant, makeAction(game, ant, 'PUTDOWN', {position: putdownPos}));
        return;
      }
      // if holding larva and near putdown token, put it down
      if (
        (holdingLarva || ant.task == 'MOVE_LARVA')
        && inTokenRadius(game, putdownLoc, 'MOVE_LARVA_PHER')
        && !occupied
      ) {
        if (!isFacing(ant, putdownPos)) {
          queueAction(game, ant, makeAction(game, ant, 'TURN', nextTheta));
        }
        queueAction(game, ant, makeAction(game, ant, 'PUTDOWN', {position: putdownPos}));
        return;
      }
      // if holding pupa and near putdown token, put it down
      if (
        (holdingPupa || ant.task == 'MOVE_PUPA')
        && inTokenRadius(game, putdownLoc, 'PUPA')
        && !occupied
      ) {
        if (!isFacing(ant, putdownPos)) {
          queueAction(game, ant, makeAction(game, ant, 'TURN', nextTheta));
        }
        queueAction(game, ant, makeAction(game, ant, 'PUTDOWN', {position: putdownPos}));
        return;
      }
    }
  }

  // MOVE
  antDecideMove(game, ant);
};







const entityFight = (game: Game, entity: Entity, target: ?Entity): void => {
  if (!areNeighbors(game, entity, target)) return;
  if (target.type.slice(0, 4) === 'DEAD') return;
  if (target.position == null) return;

  let isFacingAtAll = false;
  getEntityPositions(game, target)
    .forEach(pos => {
      getPositionsInFront(game, entity).forEach(fp => {
        if (equals(pos, fp)) {
          isFacingAtAll = true;
        }
      })
    });
  if (!isFacingAtAll) {
    let nextTheta = vectorTheta(subtract(entity.position, target.position));
    getEntityPositions(game, target)
      .forEach(pos => {
        getNeighborPositions(game, entity).forEach(fp => {
          if (equals(pos, fp)) {
            nextTheta = vectorTheta(subtract(entity.position, fp));
          }
        })
      });
    // HACK: isFacing doesn't quite working for some diagonal directions,
    // so if you're already facing the direction you should be, then just let
    // the attack go through
    if (!closeTo(entity.theta, nextTheta)) {
      stackAction(game, entity, makeAction(game, entity, 'TURN', nextTheta));
      critterStartCurrentAction(game, entity);
      return;
    }
  }

  let damage = entity.damage;
  if (entity.actions.length > 0 && entity.actions[0].type == 'GRAPPLE') {
    damage = 0.34;
  }
  // armored queen takes half damage from the front
  if (target.caste == 'QUEEN' && game.config[target.playerID].queenArmored) {
    let inFront = false;
    const posInFront = getPositionsInFront(game, target);
    for (const p of getEntityPositions(game, entity)) {
      for (const i of posInFront) {
        if (equals(p, i)) {
          inFront = true;
        }
      }
    }
    if (inFront) {
      damage /= 2;
    }
  }

  // dash deals double damage
  if (entity.prevActionType == 'DASH') {
    damage *= 4;
  }

  dealDamageToEntity(game, target, damage);

  // Spiked larva
  if (
    target.hp <= 0 && target.type == 'LARVA' &&
    game.config[target.playerID].spikedLarva
  ) {
    dealDamageToEntity(game, entity, game.config[target.playerID].spikedLarva);
  }

  // Centipedes grow when they kill things
  if (entity.type == 'CENTIPEDE' && target.hp <= 0) {
    const lastSegmentPos = entity.segments[entity.segments.length - 1];
    addSegmentToEntity(
      game, entity,
      add(lastSegmentPos, Math.random() < 0.5 ? {x: 1, y: 0} : {x: 0, y: 1}),
    );
  }

  // Roly Polies roll up when attacked
  if (target.type == 'ROLY_POLY') {
    target.rolled = true;
  }

  // ALERT pheromone
  if (
    (entity.type == 'ANT' || entity.type == 'TERMITE') &&
    (entity.timeOnTask < 700 || entity.task != 'DEFEND') && target.type != 'VINE'
  ) {
    getEntityPositions(game, entity)
      .forEach(pos => fillPheromone(game, pos, 'ALERT', entity.playerID));
  }

  // Trapjaw ants
  if (
    game.config[entity.playerID]?.trapjaw &&
    entity.caste == 'MINIMA' &&
    target.caste != 'MINIMA' &&
    target.caste != 'SUB_MINIMA' &&
    target.caste != 'TERMITE_WORKER'
  ) {
    addTrapjaw(game, target, entity);
  }

  // Queen can stun
  if (entity.caste == 'QUEEN' && game.config[entity.playerID].queenStun) {
    queueAction(game, target, makeAction(game, target, 'STUN'));
  }

  // attacked ants holding stuff put it down
  if (target.holding != null) {
    queueAction(game, target, makeAction(game, target, 'PUTDOWN'));
  }
};

module.exports = {
  agentDecideAction,
  agentPickup,
  agentPutdown,
  agentDecideMove,
  agentSwitchTask,
};
