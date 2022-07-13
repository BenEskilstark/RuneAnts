// @flow

const globalConfig = require('../config');

/**
 * Entity creation checklist:
 *  - add the entity here keyed by type (in render order)
 *  - add the entities/entityType file to this directory
 *  - add the entities options and arguments to ui/LevelEditor
 *  - if the entity has any special properties, add them to properties/
 *  - if it blocks pheromones, add to the config
 */


const Entities = {
  BACKGROUND: require('./background.js'),
  DOODAD: require('./doodad.js'),

  DIRT: require('./dirt.js'),
  STONE: require('./stone.js'),
  STEEL: require('./steel.js'),

  BASE: require('./base.js'),

  FOOD: require('./food.js'),
  AGENT: require('./agent.js'),
  TOKEN: require('./token.js'),

  ANT: require('./ant.js'),
  WORM: require('./worm.js'),

  DYNAMITE: require('./dynamite.js'),

};

module.exports = {
  Entities,
};

