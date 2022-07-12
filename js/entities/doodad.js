// @flow

const {makeEntity} = require('./makeEntity');

const config = {
  notOccupying: true, // when creating entities w/marquee, they can go on top of this
  onlyMakeOne: true, // when marquee-ing to create, only make one of these
                     // with size = marquee
};

const make = (
  game: Game,
  position: Vector,
	width: number,
	height: number,
  sprite: string,
): Doodad => {
	return {
    ...makeEntity('DOODAD', position, width, height),
    ...config,
    sprite,
    theta: Math.PI / 2,
  };
};

const render = (ctx, game, doodad): void => {
  const sprite = game.sprites[doodad.sprite];
  if (sprite != null) {
    ctx.drawImage(
      sprite,
      doodad.position.x, doodad.position.y,
      doodad.width, doodad.height,
    );
  }
};

module.exports = {
  make, render, config,
};
