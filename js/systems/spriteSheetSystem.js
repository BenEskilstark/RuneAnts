// @flow

const initSpriteSheetSystem = (store) => {
  // TODO: don't load sprites if they're already loaded
  const {dispatch} = store;
  const state = store.getState();


  loadSprite(dispatch, state, 'FOOD', './img/FOOD.png');
  loadSprite(dispatch, state, 'DIRT', './img/DIRT.png');
  loadSprite(dispatch, state, 'IRON', './img/IRON.png');
  loadSprite(dispatch, state, 'STEEL', './img/STEEL.png');
  loadSprite(dispatch, state, 'COAL', './img/COAL.png');
  loadSprite(dispatch, state, 'HOT_COAL', './img/HOT_COAL.png');
  loadSprite(dispatch, state, 'STONE', './img/STONE.png');
  loadSprite(dispatch, state, 'SULPHUR', './img/SULPHUR.png');
  loadSprite(dispatch, state, 'ICE', './img/ICE.png');

  loadSprite(dispatch, state, 'MISSILE', './img/Missile2.png');
  loadSprite(dispatch, state, 'NUKE_MISSILE', './img/NukeMissile1.png');
  loadSprite(dispatch, state, 'BUNKER_BUSTER', './img/BunkerBuster1.png');
  loadSprite(dispatch, state, 'BASIC_TURRET', './img/Basic_turret1.png');
  loadSprite(dispatch, state, 'FAST_TURRET', './img/Fast_turret1.png');
  loadSprite(dispatch, state, 'LASER_TURRET', './img/Laser_turret.png');
  loadSprite(dispatch, state, 'BASE', './img/Base1.png');

  loadSprite(dispatch, state, 'PHEROMONE', './img/Pheromones.png');

  loadSprite(dispatch, state, 'ALERT', './img/Exclamation1.png');
  loadSprite(dispatch, state, 'WANDER', './img/Ellipsis1.png');
  loadSprite(dispatch, state, 'QUESTION', './img/Question1.png');
  loadSprite(dispatch, state, 'MALE', './img/Male1.png');
  loadSprite(dispatch, state, 'FEMALE', './img/Female1.png');

  loadSprite(dispatch, state, 'ANT', './img/Ant2.png');
  loadSprite(dispatch, state, 'RED_ANT', './img/Ant3.png');
  loadSprite(dispatch, state, 'WORM', './img/Worm1.png');

  loadSprite(dispatch, state, 'FLOOR_TILE', './img/FloorTile1.png');
  loadSprite(dispatch, state, 'SKYLINE', './img/Skyline1.png');
};

const loadSprite = (dispatch, state, name, src): void => {
  // if (
  //   state.game != null && state.game.sprites != null &&
  //   state.game.sprites[name] != null
  // ) return;
  const img = new Image();
  img.addEventListener('load', () => {
  //  console.log("loaded " + src + " spritesheet");
    dispatch({
      type: 'SET_SPRITE_SHEET',
      name,
      img,
    });
  }, false);
  img.src = src;
}

module.exports = {initSpriteSheetSystem};
