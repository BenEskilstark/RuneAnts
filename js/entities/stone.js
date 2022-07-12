// @flow

const {
  getTileSprite,
} = require('../selectors/sprites');
const {makeEntity} = require('./makeEntity');

const config = {
  TILED: true,
  NOT_ANIMATED: true,
  COLLECTABLE: true,
  hp: 20,
};

const make = (
  game: Game,
  position: Vector,
  subType: string,
	width: ?number,
	height: ?number,
): Stone => {
	return {
    ...makeEntity('STONE', position, width, height),
    ...config,
    subType: subType == null || subType == 1 ? 'STONE' : subType,
    dictIndexStr: '',
  };
};

const render = (ctx, game, stone): void => {
  const obj = getTileSprite(game, stone);
  if (obj == null || obj.img == null) return;
  ctx.drawImage(
    obj.img,
    obj.x, obj.y, obj.width, obj.height,
    stone.position.x, stone.position.y, stone.width, stone.height,
  );
};

module.exports = {
  make, render, config,
};
