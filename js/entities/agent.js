// @flow

const {makeEntity} = require('./makeEntity');
const {
  subtract, add, makeVector, vectorTheta, round, rotate, floor,
} = require('../utils/vectors');
const {
  getAntSpriteAndOffset
} = require('../selectors/sprites');
const {renderAgent} = require('../render/renderAgent');

const config = {
  hp: 60,
  damage: 20,
  width: 2,
  height: 2,
  maxHold: 1,
  age: 0,

  // agent properties
  AGENT: true,
  pickupTypes: [
    'FOOD', 'DIRT', 'TOKEN',
    'DYNAMITE', 'COAL', 'IRON', 'STEEL',
  ],
  blockingTypes: [
    'FOOD', 'DIRT', 'AGENT',
    'STONE', 'DOODAD', 'WORM',
    'TOKEN', 'DYNAMITE',
    'COAL', 'IRON', 'STEEL',
  ],

  // action params
  MOVE: {
    duration: 45 * 4,
    spriteOrder: [1, 2],
    maxFrameOffset: 2,
    frameStep: 2,
  },
  MOVE_TURN: {
    duration: 41 * 5,
    spriteOrder: [1, 2],
    maxFrameOffset: 2,
    frameStep: 2,
  },
  PICKUP: {
    duration: 41 * 6,
    spriteOrder: [5, 6, 7],
  },
  PUTDOWN: {
    duration: 41 * 6,
    spriteOrder: [7, 6, 5],
  },
  TURN: {
    duration: 41 * 6,
    spriteOrder: [1, 2, 3, 4],
  },
  DIE: {
    duration: 41 * 2,
    spriteOrder: [8],
  },

  // task-specific params
  WANDER: {
    base: 1,
    forwardMovementBonus: 0,
    prevPositionPenalty: -100,
    ALERT: 500,
    COLONY: 10,
  },
  RETRIEVE: {
    base: 1,
    forwardMovementBonus: 100,
    prevPositionPenalty: -100,
    ALERT: 300,
    COLONY: -100,
  },
  RETURN: {
    base: 10,
    forwardMovementBonus: 500,
    prevPositionPenalty: -100,
    ALERT: 1000,
    COLONY: 1000,
  },
  MOVE_DIRT: {
    base: 1,
    forwardMovementBonus: 20,
    prevPositionPenalty: -100,
    ALERT: 100,
    DIRT_DROP: 200,
  },
  GO_TO_DIRT: {
    base: 1,
    forwardMovementBonus: 20,
    prevPositionPenalty: -100,
    ALERT: 100,
    MARKED_DIRT_PHER: 300,
  },
};

const make = (
  game: Game,
	position: Vector, playerID: PlayerID,
): Agent => {
	const agent = {
		...makeEntity(
      'AGENT', position,
      config.width, config.height,
    ),
    ...config,
		playerID,
    prevHP: config.hp,
    prevHPAge: 0,
    holding: null,
    holdingIDs: [], // treat holding like a stack
    task: 'WANDER',
    timeOnTask: 0,
    actions: [],
    lastHeldID: null,

    // this frame offset allows iterating through spritesheets across
    // multiple actions (rn only used by queen ant doing one full walk
    // cycle across two MOVE actions)
    frameOffset: 0,
    timeOnMove: 0, // for turning in place
	};

  return agent;
};

const render = (ctx, game: Game, agent: Agent): void => {
  renderAgent(ctx, game, agent, spriteRenderFn);
}

const spriteRenderFn = (ctx, game, ant) => {
  const sprite = getAntSpriteAndOffset(game, ant);
  if (sprite.img != null) {
    ctx.drawImage(
      sprite.img, sprite.x, sprite.y, sprite.width, sprite.height,
      0, 0, ant.width, ant.height,
    );
  }
}

module.exports = {
  make, render, config,
};
