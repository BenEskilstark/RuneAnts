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
const {
  isNeighboringColonyPher, isAboveSomething,
} = require('../selectors/mouseInteractionSelectors');

const handleCollect = (state, dispatch, gridPos, ignorePrevPos, ignoreColony) => {
  const game = state.game;
  // if (!state.game.mouse.isLeftDown) return;

  // don't interact with the same position twice
  if (
    !ignorePrevPos &&
    game.prevInteractPosition != null &&
    equals(game.prevInteractPosition, gridPos)
  ) {
    return false;
  }

  // only can collect entities that are connected to the colony
  if (!ignoreColony && !isNeighboringColonyPher(game, gridPos)) {
    return false;
  }

  const entities = lookupInGrid(game.grid, gridPos)
    .map(id => game.entities[id])
    .filter(e => e != null && e.COLLECTABLE && e.type != 'AGENT'); // && e.task == null)
  // NOTE: for some reason using this as the check causes pheromones
  // to not spread???
  //&& e.type != 'AGENT');

  dispatch({type: 'COLLECT_ENTITIES', entities, position: gridPos});
  return true;
}

const handlePlace = (state, dispatch, gridPos, ignorePrevPos) => {
  const game = state.game;
  // if (!state.game.mouse.isRightDown) return;

  // don't interact with the same position twice
  if (
    !ignorePrevPos &&
    game.prevInteractPosition != null &&
    equals(game.prevInteractPosition, gridPos)
  ) {
    return;
  }

  // only can place entities that are connected to the colony
  if (!isNeighboringColonyPher(game, gridPos)) {
    return;
  }

  let entityType = game.placeType;
  if (game.placeType == 'HOT COAL') {
    entityType = 'COAL';
  }
  // can't place if there's no entity type selected
  if (entityType == null) return;

  const config = Entities[entityType].config;

  const base = game.bases[game.playerID];

  // can't place a resource you don't have
  if (config.COLLECTABLE && base.resources[entityType] <= 0) return;

  // can't place buildings you can't afford
  if (config.cost && !canAffordBuilding(base, getModifiedCost(game, entityType))) {
    return;
  }

  // can't place on top of other resources
  const occupied = lookupInGrid(game.grid, gridPos)
    .map(id => game.entities[id])
    .filter(e => e != null && (!e.notOccupying || (e.type == 'BACKGROUND' && !isAboveSomething(game, gridPos))))
    .length > 0;
  if (occupied) return;

  // make the entity and update base resources for its cost
  let entity = null;
  if (config.COLLECTABLE) {
    entity = Entities[entityType].make(game, gridPos);
    let quantity = 1;
    if (base.resources[entityType] < 1) {
      quantity = base.resources[entityType];
      entity.hp *= quantity;
    }
    dispatch({
      type: 'SUBTRACT_BASE_RESOURCES',
      subtractResources: {[entityType]: quantity},
    });
  } else if (config.cost) {
    dispatch({
      type: 'SUBTRACT_BASE_RESOURCES',
      subtractResources: getModifiedCost(game, entityType),
    });
    entity = Entities[entityType].make(game, gridPos, game.playerID);
  }

  if (entity != null) {
    if (game.placeType == 'HOT COAL') {
      entity.onFire = true;
    }
    dispatch({type: 'CREATE_ENTITY', entity, position: gridPos});
  }
}

module.exports = {handleCollect, handlePlace};
