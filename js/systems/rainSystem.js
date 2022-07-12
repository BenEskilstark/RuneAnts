// @flow

const {randomIn, normalIn} = require('../utils/stochastic');
const globalConfig = require('../config');
const {fillPheromone} = require('../simulation/pheromones');

const initRainSystem = (store) => {
  const {dispatch} = store;
  let time = -1;
  store.subscribe(() => {
    const state = store.getState();
    const {game} = state;
    if (!game) return;
    if (game.time == time) return;
    time = game.time;

    // rain for 20 seconds whenever water quantity drops below 300
    if (
      time > 1 &&
      game.timeSinceLastRain > 1000 * 60 * 4 &&
      game.allWaterQuantity < 300
    ) {
      dispatch({type: 'SET_IS_RAINING', rainTicks: 24 * 15});
    }

    if (game.rainTicks > 0) {
      const numRainDrops = Math.random() < 0.1 ? 1 : 0;
      const rainQuantity = globalConfig.pheromones.WATER.quantity;
      for (let i = 0; i < numRainDrops; i++) {
        const rainPos = {
          x: randomIn(10, game.gridWidth - 10),
          y: randomIn(5, game.gridHeight / 5),
        }
        store.dispatch({
          type: 'FILL_PHEROMONE',
          gridPos: rainPos,
          pheromoneType: 'WATER',
          playerID: game.gaiaID,
          quantity: rainQuantity,
        });
      }
    }
  });
};

module.exports = {initRainSystem};
