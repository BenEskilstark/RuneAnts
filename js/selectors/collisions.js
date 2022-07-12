// @flow

const {lookupInGrid, getEntityPositions} = require('../utils/gridHelpers');

import type {Game, Vector, EntityID, Entity} from '../types';


const collides = (game: Game, entityA: Entity, entityB: Entity): boolean => {
  return collidesWith(game, entityA)
    .filter(e => e.id === entityB.id)
    .length > 0;
};


const collidesWith = (
  game: Game, entity: Entity, blockingTypes: Array<EntityType>
): Array<Entity> => {
  const positions = getEntityPositions(game, entity);

  const collisions = [];
  for (const pos of positions) {
    const thisCell = collisionsAtSpace(game, entity, blockingTypes, pos);
    collisions.push(...thisCell);
  }
  return collisions;
}

// use special logic to see what is considered a collision at a given space
const collisionsAtSpace = (
  game, entity, blockingTypes, pos, neighbor: boolean
): Array<Entity> => {
  if (entity == null) return [];
  const collisions = lookupInGrid(game.grid, pos)
    .map(id => game.entities[id])
    .filter(e => {return e != null && e.id != entity.id})
    .filter(e => {
      return blockingTypes.includes(e.type);
    });
  return collisions;
}

module.exports = {
  collides,
  collidesWith,
  collisionsAtSpace,
};
