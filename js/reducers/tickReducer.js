// @flow

const {
  fadeAllPheromones, computeAllPheromoneSteadyState,
  setPheromone, fillPheromone, clearPheromone,
  refreshPheromones,
} = require('../simulation/pheromones');
const {
  lookupInGrid, getEntityPositions,
  entityInsideGrid,
} = require('../utils/gridHelpers');
const {
  makeAction, isActionTypeQueued, getDuration,
  queueAction, stackAction, cancelAction,
} = require('../simulation/actionQueue.js');
const {
  removeEntity, addEntity, changeEntityType, moveEntity,
  addSegmentToEntity, changePheromoneEmitterQuantity,
} = require('../simulation/entityOperations');
const {render} = require('../render/render');
const {
  getPosBehind, getPositionsInFront, onScreen,
} = require('../selectors/misc');
const {oneOf} = require('../utils/stochastic');
const {collides, collidesWith} = require('../selectors/collisions');
const {
  add, equals, subtract, magnitude, scale,
  makeVector, vectorTheta, floor, round,
  abs, dist,
} = require('../utils/vectors');
const {
  clamp, closeTo, encodePosition, decodePosition,
} = require('../utils/helpers');
const {getInterpolatedIndex, getDictIndexStr} = require('../selectors/sprites');
const {
  entityStartCurrentAction,
} = require('../simulation/actionOperations');
const {agentDecideAction} = require('../simulation/agentOperations');
const {getFreeNeighborPositions, areNeighbors} = require('../selectors/neighbors');
const {
  getPheromoneAtPosition, getTemperature,
} = require('../selectors/pheromones');
const globalConfig = require('../config');
const {dealDamageToEntity} = require('../simulation/miscOperations');
const {Entities} = require('../entities/registry');
const {canAffordBuilding} = require('../selectors/buildings');

import type {
  Game, Entity, Action, Ant,
} from '../types';

let totalTime = 0;
const tickReducer = (game: Game, action: Action): GameState => {
  switch (action.type) {
    case 'START_TICK': {
      if (game != null && game.tickInterval != null) {
        return game;
      }

      game.prevTickTime = new Date().getTime();

      return {
        ...game,
        tickInterval: setInterval(
          // HACK: store is only available via window
          () => store.dispatch({type: 'TICK'}),
          globalConfig.config.msPerTick,
        ),
      };
    }
    case 'STOP_TICK': {
      clearInterval(game.tickInterval);
      game.tickInterval = null;

      return game;
    }
    case 'TICK': {
      return doTick(game);
    }
  }
  return game;
};

//////////////////////////////////////////////////////////////////////////
// Do Tick
//////////////////////////////////////////////////////////////////////////
const doTick = (game: Game): Game => {
  const curTickTime = new Date().getTime();

	game.time += 1;

  // initializations:
  if (game.time == 1) {
    game.prevTickTime = new Date().getTime();
    game.viewImage.allStale = true;
    computeAllPheromoneSteadyState(game);
    game.pheromoneWorker.postMessage({
      type: 'INIT',
      grid: game.grid,
      entities: game.entities,
      PHEROMONE_EMITTER: game.PHEROMONE_EMITTER || {},
      TURBINE: game.TURBINE || [],
    });

    game.ticker = {
      message: 'Drag to create pheromone trails',
      time: 3000,
      max: 3000,
    };

    game.score = 10;
  }

  // game/frame timing
  game.timeSinceLastTick = curTickTime - game.prevTickTime;
  game.timeSinceLastFoodSpawn += game.timeSinceLastTick;

  // these are the ECS "systems"
  keepControlledMoving(game);
  updateActors(game);
  updateAgents(game);
  updateAnts(game);
  updateBases(game);
  updateTiledSprites(game);
  updateViewPos(game, false /*don't clamp to world*/);
  updateTicker(game);
  updatePheromoneEmitters(game);
  updateExplosives(game);

  updatePheromones(game);
  render(game);

  // update timing frames
  game.totalGameTime += curTickTime - game.prevTickTime;
  game.prevTickTime = curTickTime;

  return game;
};


//////////////////////////////////////////////////////////////////////////
// Updating Agents
//////////////////////////////////////////////////////////////////////////

const updateActors = (game): void => {
  let fn = () => {}

  // see comment below
  const notNextActors = {};

  for (const id in game.ACTOR) {
    const actor = game.entities[id];
    if (
      actor == null ||
      actor.actions == null ||
      actor.actions.length == 0
    ) {
      continue;
    }

    if (actor.AGENT) {
      fn = agentDecideAction;
    }
    stepAction(game, actor, fn);

    if (actor.actions.length == 0) {
      notNextActors[id] = true;
    }
  }

  // the reason for deleting them like this instead of just
  // tracking which ones should make it to the next tick, is that
  // new entities can be added to the ACTOR queue inside of stepAction
  // (e.g. an explosive killing another explosive) and they need
  // to make it to the next time this function is called
  for (const id in notNextActors) {
    delete game.ACTOR[id];
  }
}

const updateAgents = (game): void => {
	for (const id of game.AGENT) {
    const agent = game.entities[id];
    if (agent == null) {
      console.log("no agent with id", id);
      continue;
    }
    agent.age += game.timeSinceLastTick;
    agent.timeOnTask += game.timeSinceLastTick;
    agent.prevHPAge += game.timeSinceLastTick;

    if (agent.actions.length == 0) {
      agentDecideAction(game, agent);
    }
	}
}

//////////////////////////////////////////////////////////////////////////
// Explosives, ballistics
//////////////////////////////////////////////////////////////////////////

const updateExplosives = (game): void => {
  if (
    game.collected > 0 && // game.explosiveReady = false &&
    game.collected % globalConfig.config.explosiveScoreMultiple == 0 &&
    !game.explosiveUses[game.collected]
  ) {
    game.explosiveReady = true;
    game.ticker = {
      message: 'Explosive Ready!',
      time: 10000,
      max: 10000,
    };
  }

  for (const id in game.EXPLOSIVE) {
    const explosive = game.entities[id];
    explosive.age += game.timeSinceLastTick;
    if (
      ((explosive.timer != null && explosive.age > explosive.timer)
        || explosive.timer == null)
      && explosive.position != null
      && !isActionTypeQueued(explosive, 'DIE')
    ) {
      queueAction(game, explosive, makeAction(game, explosive, 'DIE'));
    }
  }
};

//////////////////////////////////////////////////////////////////////////
// Move controlledEntity/View
//////////////////////////////////////////////////////////////////////////

/**
 * If the queen isn't moving but you're still holding the key down,
 * then just put a move action back on the action queue
 */
const keepControlledMoving = (game: Game): void => {
  const controlledEntity = game.controlledEntity;
  if (!controlledEntity) return;
  const moveDir = {x: 0, y: 0};
  if (game.hotKeys.keysDown.up) {
    moveDir.y += 1;
  }
  if (game.hotKeys.keysDown.down) {
    moveDir.y -= 1;
  }
  if (game.hotKeys.keysDown.left) {
    moveDir.x -= 1;
  }
  if (game.hotKeys.keysDown.right) {
    moveDir.x += 1;
  }
  if (!equals(moveDir, {x: 0, y: 0})) {
    controlledEntity.timeOnMove += 1;
  } else {
    controlledEntity.timeOnMove = 0;
  }

  if (
    !equals(moveDir, {x: 0, y: 0}) && !isActionTypeQueued(controlledEntity, 'MOVE', true)
    && !isActionTypeQueued(controlledEntity, 'MOVE_TURN', true)
    && !isActionTypeQueued(controlledEntity, 'TURN') // enables turning in place
    && !isActionTypeQueued(controlledEntity, 'DASH')
  ) {
    const nextPos = add(controlledEntity.position, moveDir);
    const nextTheta = vectorTheta(subtract(controlledEntity.position, nextPos));
    let entityAction = makeAction(
      game, controlledEntity, 'MOVE',
      {
        nextPos,
        frameOffset: controlledEntity.frameOffset,
      },
    );
    if (!closeTo(nextTheta, controlledEntity.theta)) {
      if (controlledEntity.timeOnMove > 1) {
        entityAction = makeAction(
          game, controlledEntity, 'MOVE_TURN',
          {
            nextPos,
            nextTheta,
            frameOffset: controlledEntity.frameOffset,
          },
        );
        controlledEntity.prevTheta = controlledEntity.theta;
      } else {
        entityAction = makeAction(
          game, controlledEntity, 'TURN', nextTheta,
        );
      }
    }
    controlledEntity.timeOnMove = 0;
    queueAction(game, controlledEntity, entityAction);
  }
}

const updateViewPos = (
  game: Game,clampToGrid: boolean,
): void => {
  let nextViewPos = {...game.viewPos};
  const focusedEntity = game.focusedEntity;
  if (focusedEntity) {
    const moveDir = subtract(focusedEntity.position, focusedEntity.prevPosition);
    const action = focusedEntity.actions[0];
    if (
      action != null &&
      (action.type == 'MOVE' || action.type == 'DASH' || action.type == 'MOVE_TURN')
    ) {
      const index = getInterpolatedIndex(game, focusedEntity);
      const duration = getDuration(game, focusedEntity, action.type);
      nextViewPos = add(
        nextViewPos,
        scale(moveDir, Math.min(1, game.timeSinceLastTick/duration)),
      );
    } else if (action == null) {
      const idealPos = {
        x: focusedEntity.position.x - game.viewWidth / 2,
        y: focusedEntity.position.y - game.viewHeight /2,
      };
      const diff = subtract(idealPos, nextViewPos);
      // NOTE: this allows smooth panning to correct view position
      const duration = getDuration(game, focusedEntity, 'MOVE');
      nextViewPos = add(nextViewPos, scale(diff, 16/duration));
    }
  }

  // rumble screen from foot
  // const foot = game.entities[game.FOOT[0]];
  // if (foot != null && foot.actions[0] != null && foot.actions[0].type == 'STOMP') {
  //   const duration = getDuration(game, foot, 'STOMP');
  //   const actionIndex = duration - foot.actions[0].duration;
  //   if (game.config.FOOT.rumbleTicks > actionIndex) {
  //     const magnitude = 4 * actionIndex / duration - 3;
  //     nextViewPos = {
  //       x: magnitude * Math.random() + queen.position.x - game.viewWidth / 2,
  //       y: magnitude * Math.random() + queen.position.y - game.viewHeight / 2,
  //     };
  //   } else if (!onScreen(game, foot) && actionIndex == gme.config.FOOT.rumbleTicks) {
  //     // if the foot doesn't stomp on screen, reset the view immediately after rumbling
  //     // else it looks jarring to shift the screen without the foot also moving
  //     if (focusedEntity != null) {
  //       nextViewPos = {
  //         x: focusedEntity.position.x - game.viewWidth / 2,
  //         y: focusedEntity.position.y - game.viewHeight /2,
  //       };
  //     }
  //   }
  // }

  nextViewPos = {
    x: Math.round(nextViewPos.x * 100) / 100,
    y: Math.round(nextViewPos.y * 100) / 100,
  };

  if (!clampToGrid) {
    if (!equals(game.viewPos, nextViewPos)) {
      game.viewPos = nextViewPos;
    }
  } else {
    game.viewPos = {
      x: clamp(nextViewPos.x, 0, game.gridWidth - game.viewWidth),
      y: clamp(nextViewPos.y, 0, game.gridHeight - game.viewHeight),
    };
  }
}

//////////////////////////////////////////////////////////////////////////
// Pheromones
//////////////////////////////////////////////////////////////////////////

const updatePheromoneEmitters = (game: Game): void => {
  for (const id in game.PHEROMONE_EMITTER) {
    const emitter = game.entities[id];
    if (emitter.quantity == 0) continue;
    if (emitter.refreshRate == null) continue;

    if ((game.time + emitter.id) % emitter.refreshRate == 0) {
      changePheromoneEmitterQuantity(game, emitter, emitter.quantity);
    }
  }
};

const updatePheromones = (game: Game): void => {

  if (game.time % globalConfig.config.dispersingPheromoneUpdateRate == 0) {
    game.pheromoneWorker.postMessage({
      type: 'DISPERSE_PHEROMONES',
      timeStamp: new Date().getTime(),
    });
  }

  // recompute steady-state-based pheromones using the worker
  if (game.reverseFloodFillSources.length > 0) {
    game.pheromoneWorker.postMessage({
      type: 'REVERSE_FLOOD_FILL',
      reverseFloodFillSources: game.reverseFloodFillSources,
    });
    game.reverseFloodFillSources = [];
  }
  if (game.floodFillSources.length > 0) {
    game.pheromoneWorker.postMessage({
      type: 'FLOOD_FILL',
      floodFillSources: game.floodFillSources,
    });
    game.floodFillSources = [];
  }
};

//////////////////////////////////////////////////////////////////////////
// Doing Actions
//////////////////////////////////////////////////////////////////////////

const stepAction = (
  game: Game, entity: Entity, decisionFunction: mixed,
): void => {
  if (entity.actions == null || entity.actions.length == 0) return;

  let curAction = entity.actions[0];
  const totalDuration = getDuration(game, entity, curAction.type);
  if (
    totalDuration - curAction.duration >= curAction.effectIndex &&
    !curAction.effectDone
  ) {
    entityStartCurrentAction(game, entity);
    curAction = entity.actions[0];
  } else if (curAction.duration <= 0) {
    const prevAction = entity.actions.shift();
    entity.prevActionType = prevAction.type;
    curAction = entity.actions[0];
    if (curAction == null) {
      decisionFunction(game, entity);
      curAction = entity.actions[0];
    }
    if (curAction != null && curAction.effectIndex == 0) {
      entityStartCurrentAction(game, entity);
    }
  }
  if (curAction != null) {
    curAction.duration = Math.max(0, curAction.duration - game.timeSinceLastTick);
  }
}

//////////////////////////////////////////////////////////////////////////
// Misc.
//////////////////////////////////////////////////////////////////////////

const updateAnts = (game): void => {
  if (game.time % 10 == 0) {
    // heal ants if they aren't surrounded
    for (const id of game.ANT) {
      const ant = game.entities[id];
      // with certain probability, let damage from two attackers go through
      if (ant.hp - Math.floor(ant.hp) < 0.4 && Math.random() < 0.2) {
        ant.hp = Math.floor(ant.hp);
        continue;
      }
      ant.hp = Math.ceil(ant.hp);
    }
  }
};

// check for ants on top of the base with food,
// if there is, then delete the food and spawn an ant
const updateBases = (game): void => {
  for (const id of game.BASE) {
    const base = game.entities[id];
    const yourAnts = game.ANT
      .map(id => game.entities[id])
      .filter(ant => ant.playerID == base.playerID);
    for (const ant of yourAnts) {
      if (
        ant.holding != null && ant.holding.type == 'FOOD' &&
        equals(ant.position, base.position)
      ) {
        removeEntity(game, ant.holding);
        ant.holding = null;
        ant.holdingIDs = [];

        if (base.playerID == game.playerID) {
          game.collected += 1;
          game.score += 1;
        }

        addEntity(game, Entities.ANT.make(game, base.position, base.playerID));
      }
    }
  }
}


const updateTiledSprites = (game): void => {
  for (const id of game.staleTiles) {
    const entity = game.entities[id];
    entity.dictIndexStr = getDictIndexStr(game, entity);
  }
  game.staleTiles = [];
}

const updateTicker = (game): void => {
  if (game.ticker != null) {
    game.ticker.time -= game.timeSinceLastTick;
    if (game.ticker.time <= 0) {
      game.ticker = null;
    }
  }

  if (game.miniTicker != null) {
    game.miniTicker.time -= game.timeSinceLastTick;
    if (game.miniTicker.time <= 0) {
      game.miniTicker = null;
    }
  }
};

module.exports = {tickReducer};
