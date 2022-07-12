// @flow

const {add, equals} = require('../utils/vectors');
const {lookupInGrid} = require('../utils/gridHelpers');
const {Entities} = require('../entities/registry');
const {getPheromoneAtPosition} = require('../selectors/pheromones');
const {getNeighborPositions} = require('../selectors/neighbors');
const {isDiagonalMove} = require('../utils/helpers');
const {
  canAffordBuilding, getModifiedCost,
} = require('../selectors/buildings');



// const canCollect = (game, gridPos): boolean => {
//   // don't interact with the same position twice
//   if (game.prevInteractPosition != null && equals(game.prevInteractPosition, gridPos)) {
//     return false;
//   }
//
//   // only can collect entities that are connected to the colony
//   if (!isNeighboringColonyPher(game, gridPos)) {
//     return false;
//   }
//
//   const entities = lookupInGrid(game.grid, gridPos)
//     .map(id => game.entities[id])
//     .filter(e => e.COLLECTABLE && e.type != 'AGENT'); // && e.task == null)
//
//   return entities.length > 0;
// };

const isNeighboringColonyPher = (game, position) => {
  const neighbors = getNeighborPositions(game, {position});
  for (const neighbor of neighbors) {
    if (isDiagonalMove(neighbor, position)) continue;

    const pher = getPheromoneAtPosition(game, neighbor, 'COLONY', game.playerID);
    if (pher > 0) {
      return true;
    }
  }
  return false;
}

const isAboveSomething = (game, position) => {
  let yOffset = 1;
  if (game.placeType != null && Entities[game.placeType] != null) {
    yOffset = Entities[game.placeType].config.height || 1;
  }
  return lookupInGrid(game.grid, add(position, {x: 0, y: yOffset}))
    .map(id => game.entities[id])
    .filter(e => e != null && e.type != 'BACKGROUND' && !e.BALLISTIC)
    .length > 0;
}

module.exports = {
  isNeighboringColonyPher,
  isAboveSomething,
};
