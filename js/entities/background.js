// @flow

const {getBackgroundSprite} = require('../selectors/sprites');
const {makeEntity} = require('./makeEntity');

const config = {
  notOccupying: true, // when creating entities w/marquee, they can go on top of this
  // notBlockingPutdown: true, // when putting down entities, they can go on top of this
  NOT_ANIMATED: true,
  // onlyMakeOne: true, // when marquee-ing to create, only make one of these
                     // with size = marquee
};

const make = (
  game: Game,
  position: Vector,
	width: ?number,
	height: ?number,
  name: string,
): Background => {
	return {
    ...makeEntity('BACKGROUND', position, width, height),
    ...config,
    name,
  };
};

const render = (ctx, game, bg): void => {
  let obj = getBackgroundSprite(game, bg);
  if (obj == null || obj.img == null) return;
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.drawImage(
    obj.img,
    obj.x, obj.y, obj.width, obj.height,
    bg.position.x, bg.position.y,
    bg.width, bg.height,
  );
  ctx.restore();
};

module.exports = {
  make, render, config,
};
