// @flow

const {makeEntity} = require('./makeEntity');
const {getInterpolatedIndex} = require('../selectors/sprites');
const {getDuration} = require('../simulation/actionQueue');
const globalConfig = require('../config');

/**
 *  Explosives explode when they die. They can be killed by
 *  running out of hp or by having an age (in ms) greater than their timer
 *  time (set timer to null if you don't want it to do this).
 */

const config = {
  EXPLOSIVE: true,
  hp: 10,
  width: 1,
  height: 1,
  explosionRadius: 5,
  damage: 40,
  timer: 1,
  age: 0,

  DIE: {
    duration: 300,
    effectIndex: 250,
    spriteOrder: [0],
  },
};

const make = (
  game: Game,
  position: Vector,
  playerID,
  explosionRadiusType,
): Dynamite => {
  return {
    ...makeEntity('DYNAMITE', position, config.width, config.height),
    ...config,
    playerID,
    actions: [],
    explosionRadiusType: explosionRadiusType || 'CIRCULAR',
  };
};

const render = (ctx, game, dynamite): void => {
  const curAction = dynamite.actions[0];
  // ctx.strokeStyle = 'black';
  // ctx.fillStyle = 'red';
  // ctx.fillRect(0, 0, dynamite.width, dynamite.height);
  // ctx.strokeRect(0, 0, dynamite.width, dynamite.height);

  // explosion itself
  if (curAction != null && curAction.type == 'DIE') {
    ctx.save();
    ctx.translate(dynamite.position.x, dynamite.position.y);
    const duration = getDuration(game, dynamite, curAction.type);
    const index = getInterpolatedIndex(game, dynamite);
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = 'orange';
    ctx.beginPath();
    const radius = index/duration * dynamite.explosionRadius;
    ctx.arc(
      dynamite.width / 2,
      dynamite.height / 2,
      radius, 0, Math.PI * 2,
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

};

module.exports = {config, make, render};
