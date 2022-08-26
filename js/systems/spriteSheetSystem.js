// @flow

const {config} = require('../config');

const initSpriteSheetSystem = (store) => {
  // TODO: don't load sprites if they're already loaded
  const {dispatch} = store;
  const state = store.getState();

  for (let sprite in config.imageFiles) {
    loadSprite(dispatch, state, sprite, config.imageFiles[sprite]);
  }
};

const loadSprite = (dispatch, state, name, src): void => {
  // if (
  //   state.game != null && state.game.sprites != null &&
  //   state.game.sprites[name] != null
  // ) return;
  const img = new Image();
  img.addEventListener('load', () => {
    // console.log("loaded " + src + " spritesheet");
    dispatch({
      type: 'SET_SPRITE_SHEET',
      name,
      img,
    });
  }, false);
  img.src = src;
}

module.exports = {initSpriteSheetSystem};
