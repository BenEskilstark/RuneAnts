// @flow

const levels = require('../levels/levels');
const {getProceduralLevel} = require('../utils/proceduralLevel');

/**
 * Levels can have their own upgrades, but these should be npc-specific
 * and will be applied without going through the applyUpgrade thunk
 *
 * additionalUpgrades are more like real game upgrades that apply
 * to the player and need to get applied to them
 */
function loadLevel(store, levelName, additionalUpgrades): void {
  const {dispatch} = store;
  let level = levels[levelName];
  if (levelName == 'proceduralLevel') {
    level = getProceduralLevel();
  }

  dispatch({type: 'SET_CURRENT_LEVEL_NAME', levelName});
  dispatch({type: 'SET_LEVEL', level});

  const game = store.getState().game;
  // for (const upgrade of additionalUpgrades) {
  //   applyUpgrade(dispatch, game, game.playerID, upgrade);
  // }

  // NOTE: has to be done in this order to properly use applyUpgrade
  // AND reload the level with upgrades applied
  dispatch({type: 'SET_PLAYERS_AND_SIZE'});
}

module.exports = {
  loadLevel,
};
