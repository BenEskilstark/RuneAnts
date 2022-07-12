// @flow

const {
  weightedOneOf,
  normalIn,
  randomIn,
} = require('../utils/stochastic');
const globalConfig = require('../config');

const getProceduralLevel = (): Array<Action> => {
  const level = {
    numPlayers: 3, gridWidth: 100, gridHeight: 125, upgrades: [],
    actions: [],
  };
  const surfaceY = 50;

  // add the background:
  level.actions.push({
    type: "CREATE_ENTITIES",
    entityType: "BACKGROUND",
    rect: {position: {x: 0, y: 0}, width: level.gridWidth, height: surfaceY},
    // args: [level.gridWidth, surfaceY, 'SKYLINE'],
    args: [1, 1, 'SKYLINE'],
  });

  // add the sun:
  level.actions.push({
    type: "CREATE_ENTITIES",
    entityType: "SUN",
    rect: {position: {x: level.gridWidth - 1, y: 0}, width: 1, height: 1},
    args: [0],
  });

  // add the dirt:
  level.actions.push({
    type: "CREATE_ENTITIES",
    entityType: "DIRT",
    rect: {position: {x: 0, y: surfaceY}, width: level.gridWidth, height: level.gridHeight - surfaceY},
    args: [1, 1],
  });

  // add the pockets of resources:
  for (const resourceType in globalConfig.config.proceduralFrequencies) {
    const {
      numMin, numMax, sizeMin, sizeMax,
    } = globalConfig.config.proceduralFrequencies[resourceType];
    const numPockets = randomIn(numMin, numMax);
    for (let i = 0; i < numPockets; i++) {
      const isPheromone = globalConfig.pheromones[resourceType] != null;
      let width = randomIn(sizeMin, sizeMax);
      let height = randomIn(sizeMin, sizeMax);

      const x = randomIn(1, level.gridWidth - width - 1);
      const y = randomIn(surfaceY + 1, level.gridHeight - height - 1);

      // clear out the area for the pocket
      clearOutPocket(level, {position: {x, y}, width, height});

      // add the resource
      if (!isPheromone) {
        level.actions.push({
          type: "CREATE_ENTITIES",
          entityType: resourceType,
          rect: {position: {x, y}, width, height},
          args: [1, 1],
        });
      } else {
        level.actions.push({
          type: "FILL_PHEROMONE",
          pheromoneType: resourceType,
          playerID: 0,
          quantity: globalConfig.pheromones[resourceType].quantity,
          rect: {position: {x, y}, width, height},
          args: [1, 1],
        });
      }
    }
  }

  // add the base:
  const x =  level.gridWidth / 2 - 1;
  const y = surfaceY * 1.5;
  clearOutPocket(level, {position: {x: x - 4, y: y - 4}, width: 11, height: 11});
  level.actions.push({
    type: "CREATE_ENTITIES",
    entityType: "BASE",
    rect: {position: {x, y}, width: 1, height: 1},
    args:[1],
  });

  return level;
};

const clearOutPocket = (level, rect) => {
  const {position, width, height} = rect;
  const {x, y} = position;

  level.actions.push({
    type: "DELETE_ENTITIES",
    rect: {position: {x: x + 1, y: y + 1}, width: width - 2, height: height - 2},
  });
  // level.actions.push({
  //   type: "DELETE_ENTITIES",
  //   rect: {position: {x, y: y + 1}, width, height: height - 2},
  // });

  level.actions.push({
    type: "DELETE_ENTITIES",
    rect: {position: {x: x + 2, y}, width: width - 4, height},
  });
  level.actions.push({
    type: "DELETE_ENTITIES",
    rect: {position: {x, y: y + 2}, width, height: height - 4},
  });
}

module.exports = {getProceduralLevel};
