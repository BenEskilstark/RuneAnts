// @flow

const {
  getTileSprite,
} = require('../selectors/sprites');
const {makeEntity} = require('./makeEntity');

const config = {
  NOT_ANIMATED: true,
  TILED: true,
  COLLECTABLE: true,
  hp: 10,
};

const make = (
  game: Game,
  position: Vector,
	width: ?number,
	height: ?number,
): Dirt => {
	return {
    ...makeEntity('DIRT', position, width, height),
    ...config,
    marked: null,
    dictIndexStr: '',
  };
};

const render = (ctx, game, dirt): void => {
  const obj = getTileSprite(game, dirt);

  if (obj == null || obj.img == null) return;
  ctx.drawImage(
    obj.img,
    obj.x, obj.y, obj.width, obj.height,
    dirt.position.x, dirt.position.y, dirt.width, dirt.height,
  );

  if (dirt.marked != null) {
    ctx.fillStyle = 'rgba(0, 0, 250, 0.2)';
    ctx.fillRect(dirt.position.x, dirt.position.y, dirt.width, dirt.height);
  }
}

module.exports = {
  make, render, config,
};
