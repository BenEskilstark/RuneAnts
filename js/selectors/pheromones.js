// @flow

const {
  add, multiply, subtract, equals, floor, containsVector,
} = require('../utils/vectors');
const {isDiagonalMove} = require('../utils/helpers');
const {getNeighborPositions} = require('../selectors/neighbors');
const {
  lookupInGrid, getEntityPositions, insideGrid,
} = require('../utils/gridHelpers');
const globalConfig = require('../config');

const getPheromoneAtPosition = (
  game: Game, position: Vector, type: PheromoneType, playerID: PlayerID,
): number => {
  const {grid} = game;
  if (!insideGrid(grid, position)) return 0;
  const {x, y} = position;
  try {
    return grid[x][y][playerID][type] || 0;
  } catch (ex) {
    return 0;
  }
};

const getTemperature = (game: Game, position: Vector): number => {
  return (
    getPheromoneAtPosition(game, position, 'HEAT', 0) -
    getPheromoneAtPosition(game, position, 'COLD', 0)
  );
};

/**
 * When a position is opened up, get candidate {pos, quantity} based on the
 * pheromone value of the greatest neighbor OR
 * if this position is itself generating pheromones (because it's in a
 * token radius) then just return that value
 */
const getQuantityForStalePos = (
  game: game, position: Vector,
  pheromoneType: PheromoneType, playerID: PlayerID,
): {position: Vector, quantity: number} => {
  const relevantEmitters = lookupInGrid(game.grid, position)
    .map(id => game.entities[id])
    .filter(e => e.pheromoneType == pheromoneType);
  if (relevantEmitters.length > 0) {
    const entity = relevantEmitters[0];
    if (entity.quantity > 0) {
      return {
        position,
        quantity: entity.quantity,
      };
    }
  }

  const neighborPositions = getNeighborPositions(game, {position}, false /* internal */);
  const decayAmount = globalConfig.pheromones[pheromoneType].decayAmount;
  let quantity = 0;
  for (const pos of neighborPositions) {
    if (isDiagonalMove(position, pos)) continue;
    let candidateAmount =
      getPheromoneAtPosition(game, pos, pheromoneType, playerID) - decayAmount;
    if (candidateAmount > quantity) {
      quantity = candidateAmount;
    }
  }
  return {position, quantity}
};


/**
 * If the given entity is a pheromone source, return it/any positions associated with
 * it that are also pheromone sources
 */
const getEntityPheromoneSources = (
  game: Game, entity: Entity,
): Array<{
  position: Vector,
  quantity: number,
  playerID: PlayerID,
  pheromoneType: PheromoneType,
}> => {

  let pheromoneType = null;
  let playerID = null;
  let quantity = 0;

  if (entity.PHEROMONE_EMITTER) {
    return [{
      id: entity.id,
      playerID: entity.playerID || 0,
      pheromoneType: entity.pheromoneType,
      position: entity.position,
      quantity: entity.quantity,
    }];
  }
  return [];
}

/**
 *  Function used at the game start to populate the initial set of pheromones
 *  across all entities emitting pheromones of the given type and playerID
 */
const getSourcesOfPheromoneType = (
  game: Game, pheromoneType: PheromoneType, playerID: PlayerID,
): Array<Entity> => {
  let sources = [];
  for (const entityID in game.PHEROMONE_EMITTER) {
    const entity = game.entities[entityID];
    if (entity.pheromoneType != pheromoneType) continue;
    if (entity.playerID != playerID) continue;
    if (entity.quantity <= 0) continue;
    sources.push(entity);
  }
  return sources;
};

const isPositionBlockingPheromone = (
  game: Game, pheromoneType: PheromoneType, position: Vector,
): boolean => {
  const config = globalConfig.pheromones[pheromoneType];
  const occupied = lookupInGrid(game.grid, position)
    .map(id => game.entities[id])
    .filter(e => e != null && config.blockingTypes.includes(e.type))
    .length > 0;

  if (occupied) return true;
  if (config.blockingPheromones.length == 0) return false;

  for (const blockingPher of config.blockingPheromones) {
    if (getPheromoneAtPosition(game, position, blockingPher, 0) > 0) {
      return true;
    }
  }
  return false;
};

module.exports = {
  getPheromoneAtPosition,
  getTemperature,
  getSourcesOfPheromoneType,
  getEntityPheromoneSources,
  getQuantityForStalePos,
  isPositionBlockingPheromone,
};
