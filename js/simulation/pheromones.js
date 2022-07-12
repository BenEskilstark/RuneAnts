// @flow

const {
  add, multiply, subtract, equals, floor, containsVector
} = require('../utils/vectors');
const {isDiagonalMove} = require('../utils/helpers');
const {getNeighborPositions} = require('../selectors/neighbors');
const {
  lookupInGrid, getEntityPositions, insideGrid,
} = require('../utils/gridHelpers');
const {
  getPheromoneAtPosition,
  getSourcesOfPheromoneType,
  getQuantityForStalePos,
} = require('../selectors/pheromones');
const globalConfig = require('../config');


/**
 * use queue to continuously find neighbors and set their pheromone
 * value to decayAmount less, if that is greater than its current value
 */
const floodFillPheromone = (
  game: Game, pheromoneType: PheromoneType, playerID: PlayerID,
  posQueue: Array<{position: Vector, quantity: number}>,
): void => {
  const config = globalConfig.pheromones[pheromoneType];

  while (posQueue.length > 0) {
    const {position, quantity} = posQueue.shift();
    const isOccupied = lookupInGrid(game.grid, position)
      .map(id => game.entities[id])
      .filter(e => config.blockingTypes.includes(e.type))
      .length > 0;

    if (
      (!isOccupied  || config.canInhabitBlocker) &&
      getPheromoneAtPosition(game, position, pheromoneType, playerID) < quantity
    ) {
      setPheromone(game, position, pheromoneType, quantity, playerID);
      const neighborPositions = getNeighborPositions(game, {position}, false /* internal */);
      const decayAmount = config.decayAmount;
      const amount = Math.max(0, quantity - decayAmount);

      for (const neighbor of neighborPositions) {
        if (isDiagonalMove(position, neighbor)) continue;
        const neighborAmount = getPheromoneAtPosition(game, neighbor, pheromoneType, playerID);
        const occupied = lookupInGrid(game.grid, neighbor)
          .map(id => game.entities[id])
          .filter(e => config.blockingTypes.includes(e.type))
          .length > 0;
        if (amount > 0 && amount > neighborAmount && !occupied) {
          posQueue.push({position: neighbor, quantity: amount});
        }
      }
    }

    // dispersing pheromones decay separately
    if (config.isDispersing) {
      if (
        getPheromoneAtPosition(game, position, pheromoneType, playerID) > 0
        && game.dispersingPheromonePositions.find(s => {
          return (equals(s.position, position) && playerID == s.playerID
            && s.pheromoneType == pheromoneType);
        }) == null
      ) {
        game.dispersingPheromonePositions.push({
          position, playerID, pheromoneType,
        });
      }
    }

  }
};

/**
 * When a pheromoneBlocking entity is added into the grid, then it could close off
 * a path, requiring recalculation. So do:
 * Reverse flood fill where you start at the neighbors of the newly occupied position,
 * then 0 those positions out if they are bigger than all their neighbors,
 * then add THEIR non-zero neighbors to the queue and continue,
 * finally, re-do the flood fill on all the 0-ed out spaces in reverse order
 */
const reverseFloodFillPheromone = (
  game: Game, pheromoneType: PheromoneType, playerID: PlayerID,
  posQueue: Array<Vector>,
): void => {
  const config = globalConfig.pheromones[pheromoneType];

  const floodFillQueue = [];
  if (pheromoneType == 'FOOD') {console.trace("hrmm");}
  while (posQueue.length > 0) {
    const position = posQueue.shift();
    const amount = getPheromoneAtPosition(game, position, pheromoneType, playerID);
    const neighborAmount = getBiggestNeighborVal(game, position, pheromoneType, playerID);
    const maxAmount = config.quantity;
    const decayAmount = config.decayAmount;
    let shouldFloodFill = true;
    if (neighborAmount <= amount) {
      shouldFloodFill = false;
      setPheromone(game, position, pheromoneType, 0, playerID);
      const neighborPositions = getNeighborPositions(game, {position}, false /* internal */);
      for (const neighbor of neighborPositions) {
        if (isDiagonalMove(position, neighbor)) continue;
        const neighborAmount = getPheromoneAtPosition(game, neighbor, pheromoneType, playerID);
        if (neighborAmount > 0 && neighborAmount < maxAmount) {
          posQueue.push(neighbor);
        } else if (neighborAmount == maxAmount) {
          // neighboring a pheromone source, so flood fill from here,
          // simpler than the block below this that computes neighbor positions for flood fill
          floodFillQueue.push({position, quantity: maxAmount - decayAmount});
        }
      }
    }
    if (shouldFloodFill) {
      // if you aren't bigger than your biggest neighbor, then your value
      // is actually fine. So then add this position to the floodFillQueue
      // since it's right on the edge of the area that needs to be re-filled in
      const neighborPositions = getNeighborPositions(game, {position}, false /* internal */);
      for (const neighbor of neighborPositions) {
        if (isDiagonalMove(position, neighbor)) continue;
        const occupied = lookupInGrid(game.grid, neighbor)
          .map(id => game.entities[id])
          .filter(e => config.blockingTypes.includes(e.type))
          .length > 0;
        const quantity = Math.max(0, amount - decayAmount);
        if (quantity > 0 && !occupied) {
          floodFillQueue.push({position: neighbor, quantity});
        }
      }
    }
  }
  floodFillPheromone(game, pheromoneType, playerID, floodFillQueue);
};


const computeAllPheromoneSteadyState = (game: Game): void => {
  for (const playerID in game.players) {
    for (const pheromoneType in globalConfig.pheromones) {
      const config = globalConfig.pheromones[pheromoneType];
      // elements in this queue will be of type:
      // {position: Vector, quantity: number}
      const posQueue = [];
      // find sources of the pheromoneType and add their positions to the queue
      getSourcesOfPheromoneType(game, pheromoneType, playerID)
        .forEach(entity => {
          if (entity.PHEROMONE_EMITTER) {
            posQueue.push({
              position: entity.position,
              quantity: entity.quantity,
            });
          }
          getEntityPositions(game, entity).forEach(position => {
            posQueue.push({
              position,
              quantity: entity.quantity,
            });
        });
      });

      floodFillPheromone(game, pheromoneType, playerID, posQueue);
    }
  }
}

// ------------------------------------------------------------------
// Setters
// ------------------------------------------------------------------

/**
 *  Set the pheromone value of one specific position
 */
const setPheromone = (
  game: Game, position: Vector, type: PheromoneType, quantity: number,
  playerID: PlayerID,
  alreadyUpdatedWorker: boolean,
): void => {
  const {grid} = game;
  if (!insideGrid(grid, position)) return;
  const config = globalConfig.pheromones[type];
  const {x, y} = position;
  if (type != 'FOOD') {
    grid[x][y][playerID][type] = Math.min(
      quantity,
      config.quantity,
    );
  } else {
    grid[x][y][playerID][type] = quantity;
  }
  if (game.pheromoneWorker && !alreadyUpdatedWorker) {
    game.pheromoneWorker.postMessage({
      type: 'SET_PHEROMONE',
      position,
      pheromoneType: type, quantity, playerID,
    });
  }
}

/**
 *  Add the pheromone source to the flood fill queue
 */
const fillPheromone = (
  game: Game, position: Vector,
  pheromoneType: PheromoneType, playerID: PlayerID,
  quantityOverride: ?number,
): void => {
  const config = globalConfig.pheromones[pheromoneType];
  const quantity = quantityOverride != null
    ? quantityOverride
    : config.quantity;
  if (quantity == 0) {
    return;
  }
  game.floodFillSources.push({
    position, pheromoneType, playerID, quantity,
  });
}

/**
 *  Add the pheromone source to the reverse flood fill queue
 */
const clearPheromone = (
  game: Game, position: Vector,
  pheromoneType: PheromoneType, playerID: PlayerID,
): void => {
  const quantity = getPheromoneAtPosition(game, position, pheromoneType, playerID);
  setPheromone(game, position, pheromoneType, quantity + 1, playerID);
  game.reverseFloodFillSources.push({
    position, pheromoneType, playerID, quantity,
  });
}

/**
 *  Recompute the pheromone values at this position across every
 *  pheromone type. Used for when e.g. a pupa hatches into an
 *  ant, need to re-fill in the space left behind by the pupa
 */
const refreshPheromones = (
  game: Game, position: Vector,
): void => {
  for (const playerID in game.players) {
    for (const pheromoneType in globalConfig.pheromones) {
      const quantity =
        getQuantityForStalePos(game, position, pheromoneType, playerID).quantity;
      if (quantity > 0) {
        game.floodFillSources.push({
          position, pheromoneType, playerID: parseInt(playerID), quantity, stale: true,
        });
      }
    }
  }
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

const getBiggestNeighborVal = (
  game: game, position: Vector,
  pheromoneType: PheromoneType, playerID: PlayerID,
): quantity => {
  const neighborPositions = getNeighborPositions(game, {position}, false /* internal */);
  let quantity = 0;
  for (const pos of neighborPositions) {
    if (isDiagonalMove(position, pos)) continue;
    const candidateAmount =
      getPheromoneAtPosition(game, pos, pheromoneType, playerID);
    if (candidateAmount > quantity) {
      quantity = candidateAmount;
    }
  }
  return quantity;
};


module.exports = {
  computeAllPheromoneSteadyState,
  floodFillPheromone,
  reverseFloodFillPheromone,
  setPheromone,
  fillPheromone,
  clearPheromone,
  refreshPheromones,
  getBiggestNeighborVal,
};
