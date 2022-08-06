// @flow

const Agent = require('./agent.js');
const {add, subtract, equals, makeVector, vectorTheta} = require('../utils/vectors');
const {renderAgent} = require('../render/renderAgent');
const {getScorpionSprite} = require('../selectors/sprites');

const config = {
  ...Agent.config,

  hp: 300,
  maxHP: 300,
  damage: 10,
  width: 6,
  height: 6,
  isCritter: true,


  // action overrides
  MOVE: {
    duration: 41 * 10,
    spriteOrder: [0, 1, 2, 3],
  },
  DIE: {
    duration: 41 * 2,
    spriteOrder: [6],
  },
  TURN: {
    duration: 41 * 15,
    spriteOrder: [0, 1, 2, 3],
  },
  MOVE_TURN: {
    duration: 41 * 22,
    spriteOrder: [0, 1, 1, 2, 3, 3],
  },
  BITE: {
    duration: 41 * 12,
    spriteOrder: [4, 5],
  },
  STUN: {
    duration: 41 * 12,
    spriteOrder: [0],
  },
  WHIRLWIND: {
    duration: 41 * 15,
    effectIndex: 41 * 5,
    spriteOrder: [4, 5, 4, 5, 4, 5, 4, 5],
  },

  // task-specific overrides
  WANDER: {
    base: 1,
    forwardMovementBonus: 0,
    ALERT: 500,
    COLONY: 0,
  },
}

const make = (game: Game, position: Vector, playerID) => {
  return {
    ...Agent.make(game, position, playerID),
    ...config,
    type: 'SCORPION',
    prevHP: config.hp,
    prevHPAge: 0,
    actions: [],
    attackIndex: 0, // for attacking with whirlwind
  };
};

const render = (ctx, game, entity): void => {
  renderAgent(ctx, game, entity, spriteRenderFn);
};

const spriteRenderFn = (ctx, game, scorpion) => {
  const sprite = getScorpionSprite(game, scorpion);
  if (sprite.img != null) {
    ctx.drawImage(
      sprite.img, sprite.x, sprite.y, sprite.width, sprite.height,
      0, 0, scorpion.width, scorpion.height,
    );
  }
}

module.exports = {
  make, render, config,
};
