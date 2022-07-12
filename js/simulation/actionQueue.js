// @flow

const {closeTo, isDiagonalTheta, thetaToDir} = require('../utils/helpers');
const {
  getPheromoneAtPosition,
} = require('../selectors/pheromones');
const {floor, ceil} = require('../utils/vectors');

import type {Game, Entity, EntityAction} from '../types';

// -----------------------------------------------------------------------
// Queueing Actions
// -----------------------------------------------------------------------

const cancelAction = (game: Game, entity: Entity): void => {
  if (entity.actions.length == 0) return;

  const curAction = entity.actions[0];
  switch (curAction.type) {
    case 'MOVE':
      entity.prevPosition = {...entity.position};
      break;
    case 'TURN':
      entity.prevTheta = entity.theta;
      break;
    case 'MOVE_TURN':
      entity.prevPosition = {...entity.position};
      entity.prevTheta = entity.theta;
      break;
  }

  entity.actions.shift();
};

// stacked actions come before other queued actions
const stackAction = (game: Game, entity: Entity, action: EntityAction): void => {
  if (!entity.actions) {
    entity.actions = [];
  }
  if (!game.ACTOR[entity.id]) {
    game.ACTOR[entity.id] = true;
  }
  if (entity.actions.length == 0) {
    entity.actions.push(action);
    return;
  }

  const curAction = entity.actions[0];
  // HACK: this nonsense is because if the ant was previously pointing diagonally,
  // and then points at a 90degree angle, the duration needs to change from 1.4x
  // to just 1x, but the entity's action won't ever update unless we pre-send
  // that theta and update the action here as soon as we stack it
  let theta = action.type == 'TURN'
    ? action.payload : entity.theta;
  theta = action.type == 'MOVE_TURN' ? action.payload.nextTheta : theta;
  curAction.duration = getDuration(game, {...entity, theta}, curAction.type);
  curAction.effectDone = false;

  entity.actions.unshift(action);
}

const queueAction = (game: Game, entity: Entity, action: EntityAction): void => {
  // const curAction = entity.actions[0];
  // if (curAction != null) {
  //   // HACK: this nonsense is because if the ant was previously pointing diagonally,
  //   // and then points at a 90degree angle, the duration needs to change from 1.4x
  //   // to just 1x, but the entity's action won't ever update unless we pre-send
  //   // that theta and update the action here as soon as we stack it
  //   let theta = action.type == 'TURN'
  //     ? action.payload : entity.theta;
  //   theta = action.type == 'MOVE_TURN' ? action.payload.nextTheta : theta;
  //   action.duration = getDuration(game, {...entity, theta}, curAction.type);
  // }

  if (!entity.actions) {
    entity.actions = [];
  }
  if (!game.ACTOR[entity.id]) {
    game.ACTOR[entity.id] = true;
  }
  entity.actions.push(action);

};

// -----------------------------------------------------------------------
// Making Actions
// -----------------------------------------------------------------------

const makeAction = (
  game: Game, entity: Entity, actionType: string, payload: mixed
): EntityAction => {
  let duration = getDuration(game, entity, actionType);
  // HACK: for making entities take twice as long to turn
  // NOTE: also requires change in getDuration below
  // if (actionType == 'TURN') {
  //   const thetaDiff = Math.abs(entity.theta - payload) % (2*Math.PI);
  //   if (closeTo(thetaDiff, Math.PI)) {
  //     duration *= 2;
  //   }
  // }

  const config = entity;
  let effectIndex = 0;
  if (config[actionType] != null) {
    effectIndex = config[actionType].effectIndex || 0;
  }

  const action = {
    type: actionType,
    duration,
    payload,
    effectIndex,
    effectDone: false,
  };
  return action;
}

// -----------------------------------------------------------------------
// Getters
// -----------------------------------------------------------------------

const isActionTypeQueued = (entity: Entity, actionType: string, almostDone: boolean): boolean => {
  if (entity.actions == null) {
    return false;
  }
  for (const action of entity.actions) {
    if (action.type == actionType) {
      if (almostDone && action.duration <= 16) {
        continue;
      }
      return true;
    }
  }
  return false;
}

const getDuration = (game: Game, entity: Entity, actionType: string): boolean => {
  const config = entity;
  if (!config[actionType]) return 1;
  let duration = config[actionType].duration;

  if (
    // (actionType == 'MOVE' || actionType == 'MOVE_TURN') &&
    actionType == 'MOVE' &&
    isDiagonalTheta(entity.theta)
  ) {
    duration = Math.round(duration * 1.4); // sqrt(2)
  }
  if (!entity || !entity.position) return duration;

  // slowed down by water
  const inWater =
    getPheromoneAtPosition(game, floor(entity.position), 'WATER', game.playerID) > 0 ||
    getPheromoneAtPosition(game, floor(entity.prevPosition), 'WATER', game.playerID) > 0;
  if ((actionType == 'MOVE' || actionType == 'MOVE_TURN') && inWater) {
    duration *= 2.5;
  }

  // HACK: for making critters take twice as long to turn
  // NOTE: also requires change in makeAction above
  // if (actionType == 'TURN') {
  //   let curAction = entity.actions[0];
  //   if (curAction == null) return duration;
  //   // if this is true, then we're in the current turn action already
  //   if (curAction.payload == entity.theta) {
  //     const thetaDiff = Math.abs(entity.prevTheta - entity.theta) % (2*Math.PI);
  //     if (closeTo(thetaDiff, Math.PI)) {
  //       duration *= 2;
  //     }
  //   }
  // }

  return duration;
}

const getFrame = (game: Game, entity: Entity, index: number): number => {
  const config = entity;
  if (entity.actions.length == 0) return 0;
  const actionType = entity.actions[0].type;

  // compute hacky frameOffset
  let frameOffset = 0;
  if (
    entity.actions[0].payload != null && entity.actions[0].payload.frameOffset > 0 &&
    (actionType == 'MOVE' || actionType == 'MOVE_TURN')
    // HACK: when bite target is queen, frameOffset can be > 0
  ) {
    frameOffset = entity.actions[0].payload.frameOffset;
  }

  // compute caste-specific overrides
  let spriteOrder = 1;
  if (config[actionType] != null) {
    spriteOrder = config[actionType].spriteOrder;
  } else {
    console.error("no config for action", entity, actionType);
  }
  const duration = getDuration(game, entity, actionType);

  const progress = index / duration;
  const spriteIndex = Math.floor(progress * spriteOrder.length);
  return spriteOrder[spriteIndex] + frameOffset;
};

module.exports = {
  cancelAction,
  stackAction,
  queueAction,
  isActionTypeQueued,
  getDuration,
  makeAction,
  getFrame,
};
