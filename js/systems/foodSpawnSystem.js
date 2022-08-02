// @flow

const {randomIn, normalIn} = require('../utils/stochastic');
const globalConfig = require('../config').config;
const {fillPheromone} = require('../simulation/pheromones');

const initFoodSpawnSystem = (store) => {
  const {dispatch} = store;
  let time = -1;
  store.subscribe(() => {
    const state = store.getState();
    const {game} = state;
    if (!game) return;
    if (game.time == time) return;
    time = game.time;

    // spawn new food when atleast foodSpawnInterval has passed and
    // there's less than minFood food on the map
    if (
      time > 1 &&
      game.timeSinceLastFoodSpawn > globalConfig.foodSpawnInterval &&
      game.FOOD.length < globalConfig.minFood
    ) {
      const size = normalIn(3, 9);
      const pos = {
        x: randomIn(0, game.gridWidth - size),
        y: randomIn(0, game.gridHeight - size),
      };
      dispatch({type: 'SPAWN_FOOD', pos, size});
    }

  });
};

module.exports = {initFoodSpawnSystem};
