// @flow

const {
  makeAction, isActionTypeQueued,
  queueAction, stackAction, cancelAction,
} = require('../simulation/actionQueue');
const {
  add, subtract, vectorTheta, makeVector, containsVector,
  dist, equals, magnitude, round,
} = require('../utils/vectors');
const {clamp, closeTo, thetaToDir, isDiagonalMove} = require('../utils/helpers');
const {lookupInGrid} = require('../utils/gridHelpers');
const {removeEntity} = require('../simulation/entityOperations');
const {dealDamageToEntity} = require('../simulation/miscOperations');

/**
 * This algorithm traces rays out from the explosive location
 * dealing damage along the way.
 *
 * There is one ray per terminal location on the circumference
 * of the explosion radius.
 *
 * Each ray has a total damage it can deal equal to the damage of
 * the explosive. Whenever it deals damage, that damage is subtracted
 * from the remaining damage it can deal. When it can't deal any more
 * damage or when the ray reaches the end of its radius then it stops
 */
const triggerExplosion = (game, explosive, precompute): Array<Vector> => {
  if (explosive == null) return;
  let quadrantThetas = [0, Math.PI/2, Math.PI, 3 * Math.PI /2];
  let numRays = explosive.explosionRadius;
  if (explosive.explosionRadiusType == 'HORIZONTAL') {
    quadrantThetas = [0, Math.PI];
    numRays = 1;
  } else if (explosive.explosionRadiusType == 'VERTICAL') {
    quadrantThetas = [Math.PI/2, 3 * Math.PI / 2];
    numRays = 1;
  }

  // let positionsCleared = [];
  let alreadyDamaged = {};
  for (const quadrant of quadrantThetas) {
    for (let i = 0; i < numRays; i++) {
      let damage = explosive.damage;
      const radius = explosive.explosionRadius;
      for (let r = 1; r <= radius && damage > 0; r++) {
        const position = add(
          explosive.position,
          makeVector(quadrant + (i/explosive.explosionRadius) * (Math.PI / 2), r),
        );
        let dealtDamage = false;
        lookupInGrid(game.grid, round(position))
          .map(id => game.entities[id])
          .forEach(e => {
            if (e == null || damage <= 0) return;
            if (alreadyDamaged[e.id]) return;
            if (e.isExplosionImmune) return;
            alreadyDamaged[e.id] = true;
            if (e.hp > damage) {
              if (!precompute) {
                dealDamageToEntity(game, e, damage);
              }
              damage = 0;
            } else {
              damage -= e.hp;
              if (!precompute) {
                dealDamageToEntity(game, e, e.hp);
              }
              // positionsCleared.push({...position});
            }
            dealtDamage = true;
          });
        // if you didn't hit anything, still reduce damage as the radius increases
        if (!dealtDamage) {
          damage -= 10;
          // positionsCleared.push({...position});
        }
      }
    }
  }

  // return positionsCleared;
};

module.exports = {
  triggerExplosion,
};
