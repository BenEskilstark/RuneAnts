// @flow

const initSpriteSheetSystem = (store) => {
  // TODO: don't load sprites if they're already loaded
  const {dispatch} = store;
  const state = store.getState();


  loadSprite(dispatch, state, 'FOOD', './img/FOOD.png');
  loadSprite(dispatch, state, 'DIRT', './img/DIRT.png');
  loadSprite(dispatch, state, 'STONE', './img/STONE.png');

  loadSprite(dispatch, state, 'BASE', './img/Base1.png');

  loadSprite(dispatch, state, 'PHEROMONE', './img/Pheromones.png');

  loadSprite(dispatch, state, 'ANT', './img/Ant2.png');
  loadSprite(dispatch, state, 'RED_ANT', './img/Ant3.png');
  loadSprite(dispatch, state, 'SCORPION', './img/Scorpion1.png');
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
