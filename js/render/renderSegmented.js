// @flow

const {
  getSegmentSprite, getSegmentHead, getSegmentTail,
  getDeadSegmentSprite, getDeadSegmentHead, getDeadSegmentTail,
} = require('../selectors/sprites');
const {renderHealthBar} = require('./renderHealthBar');
const {
  subtract, add, makeVector, vectorTheta,
} = require('../utils/vectors');
const {onScreen} = require('../selectors/misc');


const renderSegmented = (ctx, game, entity): void => {
  ctx.save();

  // render head:
  const headObj = getSegmentHead(game, entity);
  ctx.drawImage(
    headObj.img,
    headObj.x, headObj.y, headObj.width, headObj.height,
    0, 0, 1, 1,
  );

  // undo the rotation so the segments end up in the right place
  const width = 1;
  const height = 1;
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-1 * (entity.theta - Math.PI / 2));
  ctx.translate(-width / 2, -height / 2);

  // render segments:
  for (let i = 0; i < entity.segments.length - 1; i++) {
    const segment = entity.segments[i];
    if (!onScreen(game, {position: segment.position, width: 1, height: 1})) continue;
    const obj = getSegmentSprite(game, entity, segment);
    const segPos = subtract(segment.position, entity.position);
    ctx.save();
    ctx.translate(
      segPos.x + 0.5,
      segPos.y + 0.5,
    );
    ctx.rotate(segment.theta + Math.PI / 2);
    ctx.translate(-0.5, -0.5);
    ctx.drawImage(
      obj.img,
      obj.x, obj.y, obj.width, obj.height,
      0, 0, 1, 1,
    );
    ctx.restore();
  }

  // render tail segment:
  const tail = entity.segments[entity.segments.length - 1];
  const tailObj = getSegmentTail(game, entity, tail);
  const tailPos = subtract(tail.position, entity.position);
  ctx.save();
  ctx.translate(
    tailPos.x + 0.5,
    tailPos.y + 0.5,
  );
  ctx.rotate(tail.theta - Math.PI / 2);
  ctx.translate(-0.5, -0.5);
  ctx.drawImage(
    tailObj.img,
    tailObj.x, tailObj.y, tailObj.width, tailObj.height,
    0, 0, 1, 1,
  );
  ctx.restore();

  // health bar
  // ctx.save();
  // ctx.translate(
  //   entity.position.x + 0.5,
  //   entity.position.y + 0.5,
  // );
  // ctx.rotate(entity.theta - Math.PI / 2);
  // ctx.translate(-0.5, -0.5);
  // ctx.restore();

  ctx.restore();
}

////////////////////////////////////////////////////////////////
// Canvas
////////////////////////////////////////////////////////////////

const renderWormCanvas = (ctx, game, dims, entity): void => {
  ctx.save();
  ctx.translate(
    entity.position.x,
    entity.position.y,
  );
  ctx.fillStyle = 'pink';
  if (entity.type == 'CENTIPEDE') {
    ctx.fillStyle = 'white';
  }
  // head
  const nextSegment = entity.segments[0];
  const headDir = vectorTheta(subtract(entity.position, nextSegment.position));
  ctx.save();
  ctx.translate(0.5, 0.5);
  ctx.rotate(headDir - Math.PI / 2);
  ctx.translate(-0.5, -0.5);
  if (onMinimapSmall(dims, entity)) {
    ctx.fillRect(0, 0, 1, 0.5);
    ctx.beginPath();
    ctx.arc(0.5, 0.5, 0.5, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  // body
  for (let i = 0; i < entity.segments.length - 1; i++) {
    const segment = entity.segments[i];
    const relPos = subtract(segment.position, entity.position);
    if (onMinimapSmall(dims, {position: segment.position, width: 1, height: 1})) {
      ctx.fillRect(relPos.x, relPos.y, 1, 1);
    }
  }
  // tail
  const tail = entity.segments[entity.segments.length - 1];
  const relPos = subtract(tail.position, entity.position);
  const prevTail = entity.segments[entity.segments.length - 2];
  const tailDir = vectorTheta(subtract(tail.position, prevTail.position));
  ctx.save();
  ctx.translate(relPos.x + 0.5, relPos.y + 0.5);
  ctx.rotate(tailDir - Math.PI / 2);
  ctx.translate(-1* (relPos.x + 0.5), -1 * (relPos.y + 0.5));
  if (onMinimapSmall(dims, {position: tail.position, width: 1, height: 1})) {
    ctx.fillRect(relPos.x, relPos.y, 1, 0.5);
    ctx.beginPath();
    ctx.arc(relPos.x + 0.5, relPos.y + 0.5, 0.5, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  ctx.restore();
}

const onMinimapSmall = (dims: Dimensions, entity: Entity): boolean => {
  let {viewPos, viewWidth, viewHeight} = dims;
  const {position, width, height} = entity;
  const {x, y} = position;

  return x >= viewPos.x &&
    y >= viewPos.y &&
    (x + width) <= viewWidth + viewPos.x &&
    (y + height) <= viewHeight + viewPos.y;
};


module.exports = {
  renderSegmented,
  renderWormCanvas,
}
