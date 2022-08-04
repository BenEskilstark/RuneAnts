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
  // if (agent.holdingIDs.length >= config.maxHold) return game;

  // update task need if agent not doing go_to_dirt picks up marked dirt
  // if (
  //   agent.task != 'GO_TO_DIRT' && entity.type == 'DIRT' && entity.marked == agent.playerID &&
  //   game.bases[agent.playerID].taskNeed['GO_TO_DIRT'] > 0
  // ) {
  //   game.bases[agent.playerID].taskNeed['GO_TO_DIRT'] -= 1;
  // }

  // if it's food:
  //   - set ant's foodPherQuantity property to 2x distance to food
  //   - put food pheromone around pickup location
  if (entity.type == 'FOOD') {
    const ant = agent;
    let distToColony =
      globalConfig.pheromones.COLONY.quantity
      - getPheromoneAtPosition(game, ant.position, 'COLONY', ant.playerID);
    if (distToColony == globalConfig.pheromones.COLONY.quantity) {
      distToColony = 50;
    }
    // NOTE: set to 0 unless this food actually neighbors other food, see below
    ant.foodPherQuantity = 0;

    getNeighborEntities(game, entity)
      .filter(e => e.type == 'FOOD')
      .forEach(f => ant.foodPherQuantity = distToColony * 2.1);

    fillPheromone(game, ant.position, 'FOOD', ant.playerID, ant.foodPherQuantity);
    fillPheromone(game, entity.position, 'FOOD', ant.playerID, ant.foodPherQuantity);
    getFreeNeighborPositions(game, entity, globalConfig.pheromones.FOOD.blockingTypes)
      .forEach(pos => fillPheromone(game, pos, 'FOOD', ant.playerID, ant.foodPherQuantity));

  }

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
    blockers = [...Entities[agent.type].config.blockingTypes];
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
      if (pherType == 'FOOD') continue; // food is special, see below
      neighborScores[i] +=
        (pher[pherType] - basePher[pherType]) * taskConfig[pherType]
    }

    // don't use regular food difference for retrieval or return
    if (agent.task == 'RETRIEVE') {
      // if diff between food pheromones is due to dispersal, then just follow it normally
      if (Math.abs(basePher.FOOD - pher.FOOD) >= 4) {
        neighborScores[i] +=
          (pher.FOOD - basePher.FOOD) * taskConfig.FOOD;
      } else {
        // otherwise, agent to go to smaller neighbor since food pher decreases in
        // strength as you go away from the colony
        neighborScores[i] +=
          -1 * (pher.FOOD - basePher.FOOD) * taskConfig.FOOD;
      }
    } else if (agent.task == 'RETURN' && agent.holding != null && agent.holding.type == 'FOOD') {
      // if returning with food, prefer to follow pre-existing food trail if it exists
      neighborScores[i] +=
        (pher.FOOD * taskConfig.FOOD) * (pher.COLONY - basePher.COLONY);
    } else {
      neighborScores[i] +=
        (pher.FOOD - basePher.FOOD) * taskConfig.FOOD;
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

  // switch to RETURN if holding food
  const holdingFood = agent.holding != null && agent.holding.type == 'FOOD';
  if (holdingFood) {
    agentSwitchTask(game, agent, 'RETURN');
    return agent.task;
  }

  // switch to WANDER if returning without food
  if (!holdingFood && agent.task == 'RETURN') {
    agentSwitchTask(game, agent, 'WANDER');
    return agent.task;
  }

  const pherAtCell = getPheromonesInCell(game.grid, nextPos, agent.playerID);

  // switch to DEFEND if on ALERT pheromone
  if (pherAtCell['ALERT'] > 0) {
    agentSwitchTask(game, agent, 'DEFEND');
    return agent.task;
  }

  // switch to RETRIEVE if on FOOD pheromone
  if (pherAtCell['FOOD'] > 0 && !holdingFood && pherAtCell['FOLLOW'] == 0) {
    agentSwitchTask(game, agent, 'RETRIEVE');
    return agent.task;
  }

  // switch to WANDER if retrieving without pheromone
  if (pherAtCell['FOOD'] == 0 && agent.task == 'RETRIEVE') {
    agentSwitchTask(game, agent, 'WANDER');
    return agent.task;
  }

  // switch to WANDER if on FOLLOW pheromone
  if (pherAtCell['FOLLOW'] > 0 && agent.task == 'RETRIEVE' && !holdingFood) {
    agentSwitchTask(game, agent, 'WANDER');
    return agent.task;
  }

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
  // FIGHT
  if (ant.holding == null) {
    const targets = getNeighborEntities(game, ant, true)
      .filter(e => {
        if (e.position == null) return false;
        if (isDiagonalMove(ant.position, e.position) && e.type == 'ANT') return false;
        return (
          // (game.config.critterTypes.includes(e.type)) ||
          ((e.type == 'ANT' || e.type == 'BASE') && e.playerID != ant.playerID)
        );
      });

    if (targets.length > 0) {
      // always prefer to grapple if possible
      let filteredTargets = targets.filter(t => {
        return t.type == 'ANT';
        // if (ant.caste != 'MINIMA') return true;
        // return t.caste == 'MINIMA';
      });
      let target = filteredTargets.length > 0 ? oneOf(filteredTargets) : oneOf(targets);
      let actionType = 'BITE';
      if (
        ant.type == 'ANT' && target.type == 'ANT'
        // (target.caste == 'MINIMA' && ant.caste == 'MINIMA')
        // || (target.caste == 'TERMITE_WORKER' && ant.caste == 'MINIMA')
        // || (target.caste == 'MEDIA' && ant.caste == 'MEDIA')
      ) {
        actionType = 'GRAPPLE';
      }
      queueAction(game, ant, makeAction(game, ant, actionType, target));
      return;
    }
  }

  // PICK UP FOOD
  const neighboringFood = getNeighborPositions(game, ant, true /* external */)
    .map(pos => {
      return lookupInGrid(game.grid, pos)
        .filter(id => game.entities[id].type == 'FOOD')[0];
    })
    .filter(id => id != null)
    .map(id => game.entities[id])
  if (!ant.holding && neighboringFood.length > 0) {
    const pickup = oneOf(neighboringFood);
    const position = pickup.position;
    queueAction(game, ant, makeAction(game, ant, 'PICKUP', {pickup, position}));
    return;
  }

  // MOVE
  agentDecideMove(game, ant);
};


module.exports = {
  agentDecideAction,
  agentPickup,
  agentPutdown,
  agentDecideMove,
  agentSwitchTask,
};
