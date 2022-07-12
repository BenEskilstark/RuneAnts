// @flow

const {
  makeAction, isActionTypeQueued,
  queueAction, stackAction, cancelAction,
} = require('../simulation/actionQueue');
const {removeEntity} = require('../simulation/entityOperations');

const dealDamageToEntity = (game: Game, entity: Entity, damage: number): void => {
  entity.hp -= damage;
  if (entity.hp <= 0) {
    if (!entity.actions) {
      removeEntity(game, entity);
    } else if (!isActionTypeQueued(entity, 'DIE')) {
      stackAction(game, entity, makeAction(game, entity, 'DIE', null));
    }
  }
}

module.exports = {
  dealDamageToEntity,
};
