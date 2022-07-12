// @flow

const {Entities} = require('../entities/registry');

const getModifiedCost = (game: Game, entityType: EntityType): Object => {
  const cost = {...Entities[entityType].config.cost};
  const numBuilding = game[entityType]
    .map(id => game.entities[id])
    .filter(e => e.playerID == game.playerID)
    .length;
  for (const resource in cost) {
    for (let i = 0; i < numBuilding; i++) {
      cost[resource] *= 2;
    }
  }
  return cost;
}

const canAffordBuilding = (base: Base, cost: Cost): Boolean => {
  const resources = base.resources;
  for (const resource in cost) {
    if (resources[resource] == null || resources[resource] < cost[resource]) {
      return false;
    }
  }
  return true;
};

module.exports = {
  canAffordBuilding,
  getModifiedCost,
};
