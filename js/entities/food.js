// @flow

const {
  getTileSprite,
} = require('../selectors/sprites');
const {makeEntity} = require('./makeEntity');

const config = {
  TILED: true,
  hp: 120,
};

const make = (
  game: Game,
  position: Vector,
	width: ?number,
	height: ?number,
): Food => {
	return {
    ...makeEntity('FOOD', position, width, height),
    ...config,
    dictIndexStr: '',
  };
};

const render = (ctx, game, food): void => {
  const obj = getTileSprite(game, food);
  if (obj == null || obj.img == null) return;
  ctx.drawImage(
    obj.img,
    obj.x, obj.y, obj.width, obj.height,
    food.position.x, food.position.y, food.width, food.height,
  );

  if (game.showMarkedFood) {
    if (game.bases[game.playerID].foodMarkedForRetrieval[food.id]) {
      ctx.fillStyle = 'rgba(0, 0, 250, 0.2)';
      ctx.fillRect(food.position.x, food.position.y, food.width, food.height);
      ctx.fillStyle = 'red';
      ctx.font = '1px sans serif';
      ctx.fillText(
        parseInt(food.id), food.position.x, food.position.y + 1, 1,
      );
    }
  }
};

module.exports = {
  make, render, config,
};
