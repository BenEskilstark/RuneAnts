// @flow

const {
  subtract, add, makeVector, vectorTheta,
} = require('../utils/vectors');
const {lookupInGrid} = require('../utils/gridHelpers');

const renderHealthBar = (ctx, entity, maxHealth) => {

  const renderHP = Math.ceil(entity.hp);
  if (renderHP == maxHealth) return;

  ctx.save();
  // always render healthbar above entity no matter its theta
  ctx.translate(entity.width / 2, entity.height / 2);
  ctx.rotate(-entity.theta);
  ctx.translate(-entity.width / 2, -entity.height / 2);

  const barWidth = 1.5;
  const barHeight = 0.20;
  if (entity.prevHP >= renderHP + 1 && entity.prevHPAge < 6) {
    const redWidth = entity.prevHP / maxHealth * barWidth;
    ctx.fillStyle = 'red';
    ctx.fillRect(
      -0.25, -0.2,
      redWidth, barHeight,
    );
  }

  ctx.fillStyle = 'green';
  const healthWidth = Math.max(renderHP / maxHealth * barWidth, 0);
  ctx.fillRect(
    -0.25, -0.2,
    healthWidth, barHeight,
  );

  ctx.strokeStyle = 'black';
  ctx.strokeRect(
    -0.25, -0.2,
    barWidth, barHeight,
  );

  ctx.restore();
}

module.exports = {renderHealthBar};
