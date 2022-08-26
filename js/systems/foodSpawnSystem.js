// @flow

const {randomIn, normalIn} = require('../utils/stochastic');
const globalConfig = require('../config').config;
const {fillPheromone} = require('../simulation/pheromones');

const initFoodSpawnSystem = (store) => {
  const {dispatch} = store;
  let time = -1;
  return store.subscribe(() => {
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

      // maybe spawn a scorpion instead
      if (
        (game.numScorpionsSpawned == 0 && game.time > 6000) ||
        (game.time > 6000 && Math.random() < 0.02)
      ) {
        const size = 6;
        const pos = {
          x: randomIn(0, game.gridWidth - size),
          y: normalIn(0, game.gridHeight - size),
        };
        dispatch({type: 'SPAWN_SCORPION', pos});
      } else {
        const size = normalIn(3, 8);
        // spawn food closer to the center at first, then allow anywhere
        // to reduce variance
        const randFn = game.time < 4000 ? normalIn : randomIn
        const pos = {
          x: randomIn(0, game.gridWidth - size),
          y: randFn(0, game.gridHeight - size),
        };
        dispatch({type: 'SPAWN_FOOD', pos, size});
      }
    }

  });
};

module.exports = {initFoodSpawnSystem};
