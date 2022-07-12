// @flow

const {
  getTileSprite,
} = require('../selectors/sprites');
const {makeEntity} = require('./makeEntity');

const config = {
  TILED: true,
  MELTABLE: true,
  COLLECTABLE: true,
  PHEROMONE_EMITTER: true,
  pheromoneType: 'MOLTEN_STEEL',
  hp: 240,
  meltTemp: 140, // temperature at which you catch on fire
  heatQuantity: 240, // amount of steel  produced when melted
};

const make = (
  game: Game,
  position: Vector,
	width: ?number,
	height: ?number,
  hp: ?number,
): Steel => {
	return {
    ...makeEntity('STEEL', position, width || 1, height || 1),
    ...config,
    dictIndexStr: '',
    hp: hp || config.hp,
    playerID: 0, // gaia
    quantity: 0, // amount of pheromone emitted
  };
};

const render = (ctx, game, steel): void => {
  const obj = getTileSprite(game, steel);
  if (obj == null || obj.img == null) return;
  ctx.drawImage(
    obj.img,
    obj.x, obj.y, obj.width, obj.height,
    steel.position.x, steel.position.y, steel.width, steel.height,
  );
}

module.exports = {
  make, render, config,
};
