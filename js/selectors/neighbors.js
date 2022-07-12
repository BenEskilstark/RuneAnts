// @flow

const {
  equals, add, subtract, containsVector,
} = require('../utils/vectors');
const {
  lookupInGrid, insideGrid,getEntityPositions
} = require('../utils/gridHelpers');
const {collidesWith, collisionsAtSpace} = require('../selectors/collisions');

import type {Grid, Vector, Entity, EntityID, Game} from '../types';


const getNeighborEntities = (
  game: Game, entity: Entity, external: boolean,
): Array<Entity> => {
  if (entity.position == null) return [];

  const neighborIDs = [];
  const neighborPositions = getNeighborPositions(game, entity, external);
  for (const pos of neighborPositions) {
    const entitiesInCell = lookupInGrid(game.grid, pos)
      .filter(id => !neighborIDs.includes(id) && id != entity.id);
    neighborIDs.push(...entitiesInCell);
  }

  return neighborIDs.map(id => game.entities[id]);
}

const getNeighborEntitiesAndPosition = (game: Game, entity: Entity): Array<Object> => {
  if (entity.position == null) return [];

  const neighborObjs = [];
  const neighborPositions = getNeighborPositions(game, entity, true /* external */);
  for (const pos of neighborPositions) {
    const entitiesInCell = lookupInGrid(game.grid, pos)
      .filter(id => !neighborObjs.includes(id) && id != entity.id);
    for (const id of entitiesInCell) {
      neighborObjs.push({entity: game.entities[id], position: pos});
    }
  }

  return neighborObjs;
}


const areNeighbors = (game: Game, entityA: Entity, entityB: Entity): boolean => {
  if (entityA == null || entityB == null) return false;
  const aNeighbors = getNeighborEntities(game, entityA, true);
  return aNeighbors
    .filter(e => e.id === entityB.id)
    .length > 0;
};


const getFreeNeighborPositions = (
  game: Game, entity: Entity, blockingTypes: Array<EntityType>, external: ?boolean,
): Array<Vector> => {
  const neighborPositions =
    getNeighborPositions(game, entity, external /* internal by default */);
  const freePositions = [];
  for (const pos of neighborPositions) {
    const isOccupied = collisionsAtSpace(game, entity, blockingTypes, pos, true /*neighbor*/)
      .length > 0;

    // const alreadyCollidesWith = collidesWith(game, entity, blockingTypes)
    //   .map(e => e.id);
    // const alreadyColliding = entitiesAtPos
    //   .filter(e => !alreadyCollidesWith.includes(e.id))
    //   .length > 0;
    if (!isOccupied) {
      freePositions.push(pos);
    }
  }

  return freePositions;
};

/**
 * external means the neighbor positions should all be outside the entity,
 * regardless its size,
 * whereas !external means the directly-neighboring positions to the entity's
 * position value
 */
const getNeighborPositions = (game: Game, entity: Entity, external: boolean): Array<Vector> => {
  const positions = [];
  const neighbors = [
    // {x: -1, y: 0}, {x: 1, y: 0}, {x: 0, y: -1}, {x: 0, y: 1},
    {x: -1, y: 1},  {x: 0, y: 1},  {x: 1, y: 1},
    {x: -1, y: 0},                 {x: 1, y: 0},
    {x: -1, y: -1}, {x: 0, y: -1}, {x: 1, y: -1},
  ];
  if (external) {
    const entityPositions = getEntityPositions(game, entity);
    for (const pos of entityPositions) {
      for (const n of neighbors) {
        const potentialNeighbor = add(n, pos);
        if (
          !containsVector(entityPositions, potentialNeighbor) &&
          !containsVector(positions, potentialNeighbor) &&
          insideGrid(game.grid, potentialNeighbor)
        ) {
          positions.push(potentialNeighbor);
        }
      }
    }
  } else {
    for (const n of neighbors) {
      const potentialNeighbor = add(entity.position, n);
      if (
        insideGrid(game.grid, potentialNeighbor)
      ) {
        positions.push(potentialNeighbor);
      }
    }
  }

  return positions;
};

module.exports = {
  getNeighborPositions,
  getNeighborEntities,
  getNeighborEntitiesAndPosition,
  getFreeNeighborPositions,
  areNeighbors,
};
