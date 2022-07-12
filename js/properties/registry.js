// @flow

const {Entities} = require('../entities/registry');

/**
 * Property creation checklist:
 *  - add the property here keyed by type
 *  - add the update function to the tickReducer
 */

const Properties = {
  // entities with actions queued right now
  ACTOR: true,

  // entities that emit a pheromone
  PHEROMONE_EMITTER: true,

  // entities that explode when they die
  EXPLOSIVE: true,

  // entities that don't animate every tick
  NOT_ANIMATED: true,

  // entities that use the tiled spritesheets
  TILED: true,
};

module.exports = {
  Properties,
};
