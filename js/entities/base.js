// @flow

const {makeEntity} = require('./makeEntity');
const {renderAgent} = require('../render/renderAgent');
const globalConfig = require('../config');

const config = {
  maxHP: 50,
  hp: 50,
  width: 1,
  height: 1,
  PHEROMONE_EMITTER: true,
  AGENT: true,
  pheromoneType: 'COLONY',
  isExplosionImmune: true,

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

const render = (ctx, game: Game, agent: Agent): void => {
  renderAgent(ctx, game, agent, spriteRenderFn);
}

const spriteRenderFn = (ctx, game, base) => {
  const img = game.sprites.BASE;
  ctx.drawImage(img, 0, 0, base.width, base.height);
};

module.exports = {config, make, render};
