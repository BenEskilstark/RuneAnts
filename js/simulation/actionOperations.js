// @flow

const {
  add, subtract, vectorTheta, makeVector, containsVector,
  dist, equals, magnitude, round,
} = require('../utils/vectors');
const {closeTo, thetaToDir, isDiagonalMove} = require('../utils/helpers');
const {getEntityPositions} = require('../utils/gridHelpers');
const {
  makeAction, isActionTypeQueued,
  queueAction, stackAction, cancelAction,
} = require('../simulation/actionQueue');
const {getMaxFrameOffset} = require('../selectors/sprites');
const {
  getPositionsInFront, getPositionsBehind, isFacing,
  canDoMove,
} = require('../selectors/misc');
const {collidesWith} = require('../selectors/collisions');
const {
  addEntity, removeEntity, moveEntity, pickupEntity, putdownEntity,
  rotateEntity, changeEntityType, removeEntityFromGrid,
  addSegmentToEntity,
} = require('../simulation/entityOperations');
const {fillPheromone} = require('../simulation/pheromones');
const {
  agentPutdown, agentPickup,
} = require('../simulation/agentOperations');
const {triggerExplosion} = require('../simulation/explosiveOperations');
const {dealDamageToEntity} = require('../simulation/miscOperations');
const {Entities} = require('../entities/registry');
const {areNeighbors, getNeighborPositions} = require('../selectors/neighbors');


const entityStartCurrentAction = (
  game: Game, entity: Entity,
): void => {
  if (entity.actions.length == 0) return;
  const curAction = entity.actions[0];
  curAction.effectDone = true;

  switch (curAction.type) {
    case 'PICKUP': {
      if (curAction.payload != null) {
        const {pickup, position} = curAction.payload;
        if (pickup != null && pickup.position != null) {
          agentPickup(game, entity, pickup, position);
        }
      }
      break;
    }
    case 'PUTDOWN':
      agentPutdown(game, entity);
      break;
    case 'MOVE_TURN':
      if (!closeTo(entity.theta, curAction.payload.nextTheta)) {
        rotateEntity(game, entity, curAction.payload.nextTheta);
      }
      // fall-through
    case 'MOVE': {
      if (equals(entity.position, curAction.payload.nextPos)) break;
      agentDoMove(game, entity, curAction.payload.nextPos);
      const {maxFrameOffset, frameStep} = getMaxFrameOffset(entity);
      if (maxFrameOffset != 0) {
        entity.frameOffset = (entity.frameOffset + maxFrameOffset)
          % (maxFrameOffset + frameStep);
      }
      break;
    }
    case 'BITE':
    case 'GRAPPLE':
      entityFight(game, entity, curAction.payload);
      break;
    case 'WHIRLWIND': {
      // find all targets
      const targets = getNeighborEntities(game, entity, true /* external */)
        .filter(e => e.hp > 0);
      // deal damage and apply stun
      for (const target of targets) {
        dealDamageToEntity(game, target, entity.damage);
      }
      break;
    }
    case 'STUN': {
      // do nothing
      break;
    }
    case 'TURN':
      rotateEntity(game, entity, curAction.payload);
      break;
    case 'DIE':
      entityDie(game, entity);
      break;
    case 'SHOOT':
      entityShoot(game, entity, curAction.payload);
      break;
    case 'COOLDOWN':
      break;
    case 'MAN':
      entityMan(game, entity, curAction.payload);
      break;
    case 'UN_MAN':
      entityUnMan(game, entity, curAction.payload);
      break;
  }
};

/**
 * returns true if it was able to do the move
 */
const agentDoMove = (game: Game, entity: Entity, nextPos: Vector): boolean => {
  const isMoveLegal = canDoMove(game, entity, nextPos);

  if (isMoveLegal.result == false && isMoveLegal.reason == 'OUTSIDE_GRID') {
    cancelAction(game, entity);
    return false;
  }

  if (isMoveLegal.result == false && isMoveLegal.reason == 'SEGMENTED_DIAGONAL') {
    cancelAction(game, entity);
    return false;
  }

  if (isMoveLegal.result == false && isMoveLegal.reason == 'BLOCKED') {
    cancelAction(game, entity);
    if (!isFacing(entity, nextPos)) {
      stackAction(game, entity, makeAction(game, entity, 'TURN', nextTheta));
      entityStartCurrentAction(game, entity);
    } else if (entity.RAM) {
      console.log("RAM", entity.position, nextPos);
      // if entity has the RAM property, then deal damage to the collisions
      const collisions = collidesWith(game, {...entity, position: nextPos}, entity.blockingTypes);
      const alreadyDamaged = {};
      collisions.forEach(e => {
        if (alreadyDamaged[e.id]) return;
        alreadyDamaged[e.id] = true;
        dealDamageToEntity(game, e, entity.damage);
      });
    }
    return false;
  }

  // Don't do move if not facing position you want to go to
  const nextTheta = vectorTheta(subtract(entity.position, nextPos));
  const thetaDiff = Math.abs(nextTheta - entity.theta) % (2 * Math.PI);
  if (!isFacing(entity, nextPos)) {
    if (game.controlledEntity && game.controlledEntity.id == entity.id) {
      // enables turning in place off a single button press
      cancelAction(game, entity);
    }
    if (thetaDiff <= Math.PI / 2 + 0.1 && entity.AGENT) {
      cancelAction(game, entity);
      stackAction(game, entity, makeAction(game, entity, 'MOVE_TURN', {nextTheta, nextPos}));
    } else {
      stackAction(game, entity, makeAction(game, entity, 'TURN', nextTheta));
    }
    entityStartCurrentAction(game, entity);
    return false;
  }

  moveEntity(game, entity, nextPos);

  return true;
}

const entityShoot = (game: Game, entity: Entity, payload) => {
  const {theta, projectileType} = payload;
  let projectile = null;
  switch (projectileType) {
    case 'LASER':
    case 'BULLET': {
      const position = round(add(makeVector(theta, -2), entity.position));
      projectile = Entities[projectileType].make(
        game, position, entity.playerID, theta + Math.PI,
      );
      break;
    }
    case 'MISSILE': {
      const position = round(add(makeVector(theta, -4), entity.position));
      projectile = Entities.MISSILE.make(
        game, position, entity.playerID,
        Entities.DYNAMITE.make(game, position, entity.playerID),
        theta + Math.PI,
        150,
        entity.targetID,
      );
      projectile.blockingTypes.push('MISSILE');
      break;
    }
  }
  if (projectile != null) {
    addEntity(game, projectile);
  }

};

const entityDie = (game: Game, entity: Entity): void => {
  if (entity.type == 'MISSILE' && entity.playerID == 2) {
    game.missilesSurvived += 1;
  }

  if (entity.EXPLOSIVE) {
    triggerExplosion(game, entity);
  }

  if (entity.holding != null) {
    putdownEntity(game, entity.holding, entity.position);
  }

  // make food at their body
  if (entity.isCritter) {
    for (let x = 0; x < entity.width; x++) {
      for (let y = 0; y < entity.height; y++) {
        addEntity(game, Entities.FOOD.make(game, add({x, y}, entity.position)));
      }
    }
  }

  removeEntity(game, entity);
};

const entityMan = (game: Game, entity: Entity, mannedEntity: Entity): void => {
  if (!mannedEntity.MANNED) return;
  pickupEntity(game: Game, entity, entity.position);
  mannedEntity.riders.push(entity);

  // transfer control:
  if (game.controlledEntity != null && game.controlledEntity.id == entity.id) {
    game.controlledEntity = mannedEntity;
  }
  if (game.focusedEntity != null && game.focusedEntity.id == entity.id) {
    game.focusedEntity = mannedEntity;
  }
};

const entityUnMan = (game: Game, entity: Entity, mannedEntity: Entity): void => {
  const nextRiders = [];
  let wasRiding = false;
  for (const rider of mannedEntity.riders) {
    if (rider.id != entity.id) {
      nextRiders.push(rider);
    } else {
      wasRiding = true;
    }
  }
  mannedEntity.riders = nextRiders;

  if (wasRiding) {
    putdownEntity(game, entity, add(mannedEntity.position, {x:-1, y: -1}));
  }

  // transfer control back:
  if (game.controlledEntity != null && game.controlledEntity.id == mannedEntity.id) {
    game.controlledEntity = entity;
  }
  if (game.focusedEntity != null && game.focusedEntity.id == mannedEntity.id) {
    game.focusedEntity = entity;
  }
};

const entityFight = (game: Game, entity: Entity, target: ?Entity): void => {
  if (!areNeighbors(game, entity, target)) return;
  if (target.type.slice(0, 4) === 'DEAD') return;
  if (target.position == null) return;

  let isFacingAtAll = false;
  getEntityPositions(game, target)
    .forEach(pos => {
      getPositionsInFront(game, entity).forEach(fp => {
        if (equals(pos, fp)) {
          isFacingAtAll = true;
        }
      })
    });
  if (!isFacingAtAll) {
    let nextTheta = vectorTheta(subtract(entity.position, target.position));
    getEntityPositions(game, target)
      .forEach(pos => {
        getNeighborPositions(game, entity).forEach(fp => {
          if (equals(pos, fp)) {
            nextTheta = vectorTheta(subtract(entity.position, fp));
          }
        })
      });
    // HACK: isFacing doesn't quite working for some diagonal directions,
    // so if you're already facing the direction you should be, then just let
    // the attack go through
    if (!closeTo(entity.theta, nextTheta)) {
      stackAction(game, entity, makeAction(game, entity, 'TURN', nextTheta));
      entityStartCurrentAction(game, entity);
      return;
    }
  }

  let damage = entity.damage;
  if (entity.actions.length > 0 && entity.actions[0].type == 'GRAPPLE') {
    damage = 0.34;
  }

  dealDamageToEntity(game, target, damage);

  // ALERT pheromone
  if (
    (entity.type == 'ANT' || entity.type == 'TERMITE') &&
    (entity.timeOnTask < 700 || entity.task != 'DEFEND')
  ) {
    // getEntityPositions(game, entity)
    //   .forEach(pos => fillPheromone(game, pos, 'ALERT', entity.playerID));
  }

  // attacked ants holding stuff put it down
  if (target.holding != null) {
    queueAction(game, target, makeAction(game, target, 'PUTDOWN'));
  }
};


module.exports = {
  entityStartCurrentAction,
}
