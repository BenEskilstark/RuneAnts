// @flow

const {makeEntity} = require('./makeEntity');
const globalConfig = require('../config');

const config = {
  hp: 150,
  width: 1,
  height: 1,
  PHEROMONE_EMITTER: true,
  pheromoneType: 'COLONY',

  blockingTypes: [
    'FOOD', 'DIRT', 'AGENT',
    'STONE', 'DOODAD', 'WORM',
    'TOKEN', 'DYNAMITE',
    'COAL', 'IRON', 'STEEL',
  ],

  // need this for panning to focus on it
  MOVE: {
    duration: 45 * 4,
  },
};

const make = (
  game: Game,
  position: Vector,
  playerID,
  quantity: ?number,
): Base => {
  return {
    ...makeEntity('BASE', position, config.width, config.height),
    ...config,
    playerID,
    quantity: quantity || globalConfig.pheromones[config.pheromoneType].quantity,
    actions: [],
  };
};

const render = (ctx, game, base): void => {
  const img = game.sprites.BASE;
  ctx.drawImage(img, base.position.x, base.position.y, base.width, base.height);
};

module.exports = {config, make, render};
