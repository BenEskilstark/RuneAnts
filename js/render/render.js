// @flow

const {
  subtract, add, makeVector, vectorTheta, dist,
  magnitude, scale, toRect,
} = require('../utils/vectors');
const {lookupInGrid, getEntityPositions} = require('../utils/gridHelpers');
const {clamp} = require('../utils/helpers');
const {
  onScreen, getPositionsInFront,
  getControlledEntityInteraction,
} = require('../selectors/misc');
const globalConfig = require('../config');
const {
  getInterpolatedPos, getSpriteAndOffset, getInterpolatedTheta,
  getPheromoneSprite, getTileSprite,
} = require('../selectors/sprites');
const {Entities} = require('../entities/registry');
const {
  isNeighboringColonyPher, isAboveSomething,
} = require('../selectors/mouseInteractionSelectors');

import type {Game, Entity, Hill, Ant, Food} from '../types';

let cur = null;
let prevTime = 0;
let msAvg = 0;
const weightRatio = 0.1;
const render = (game: Game): void => {
  window.requestAnimationFrame((timestamp) => {
    const curTime = new Date().getTime();

    // don't call renderFrame multiple times on the same timestamp
    if (timestamp == cur) {
      return;
    }
    cur = timestamp;

    if (prevTime > 0) {
      msAvg = msAvg * (1 - weightRatio) + (curTime - prevTime) * weightRatio;
    }
    // console.log(1 / (msAvg / 1000));

    renderFrame(game);

    prevTime = curTime;
  });
}


let canvas = null;
let ctx = null;
const renderFrame = (game: Game): void => {
  canvas = document.getElementById('canvas');
  if (!canvas) return; // don't break
  ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, globalConfig.config.canvasWidth, globalConfig.config.canvasHeight);

  const pxWidth = globalConfig.config.canvasWidth / 4;
  const pxHeight = 0.6 * pxWidth;
  if (!game.maxMinimap) {
    const bigDims = {
      pxWidth: globalConfig.config.canvasWidth,
      pxHeight: globalConfig.config.canvasHeight,
      viewWidth: game.viewWidth,
      viewHeight: game.viewHeight,
      viewPos: {...game.viewPos},
    };
    const miniDims = {
      pxWidth,
      pxHeight: 0.6 * pxWidth,
      viewWidth: game.gridWidth,
      viewHeight: 60,
      viewPos: {
        x: 0,
        y: 0,
      },
    };
    // HACK: only pxWidth/pxHeight can really actually be set in main view
    renderView(canvas, ctx, game, bigDims);
    ctx.save();
    ctx.translate(
      globalConfig.config.canvasWidth - pxWidth - 8,
      globalConfig.config.canvasHeight - pxHeight - 8,
    );
    ctx.restore();
  } else {
    const nextViewPos = {
      x: game.viewPos.x - game.viewWidth / 2,
      y: game.viewPos.y - game.viewHeight / 2,
    };
    const bigDims = {
      pxWidth: globalConfig.config.canvasWidth,
      pxHeight: globalConfig.config.canvasHeight,
      viewWidth: game.viewWidth * 3,
      viewHeight: game.viewHeight * 3,
      viewPos: {
        x: clamp(nextViewPos.x, 0, game.gridWidth - game.viewWidth * 3),
        y: clamp(nextViewPos.y, 0, game.gridHeight - game.viewHeight * 3),
      },
    };
    const miniDims = {
      pxWidth,
      pxHeight,
      viewWidth: game.viewWidth,
      viewHeight: game.viewHeight,
      viewPos: {...game.viewPos},
    };
    ctx.save();
    ctx.translate(
      globalConfig.config.canvasWidth - pxWidth - 8,
      8,
    );
    ctx.globalAlpha = 0.8;
    // HACK: only pxWidth/pxHeight can really actually be set in main view
    renderView(canvas, ctx, game, miniDims, true /*isMini*/);
    ctx.restore();
  }
};

const renderView = (canvas, ctx2d, game, dims, isMini): void => {
  const {pxWidth, pxHeight, viewWidth, viewHeight, viewPos} = dims;

	const px = viewWidth / pxWidth;
  const pxy = viewHeight / pxHeight;

  ////////////////////////////////////////////
  // canvas scaling
  ////////////////////////////////////////////
  // scale world to the canvas
  ctx.save();
  ctx.scale(
    pxWidth / viewWidth,
    pxHeight / viewHeight,
  );
  ctx.lineWidth = px;
  // translate to viewPos
  ctx.translate(-1 * viewPos.x, -1 * viewPos.y);
  ////////////////////////////////////////////

  // Image-based rendering
  refreshStaleImage(game, dims);

  if (game.viewImage.canvas != null) {
    if (isMini) {
      ctx.drawImage(
        game.viewImage.canvas,
        // canvas true dimensions:
        dims.viewPos.x / px, dims.viewPos.y / pxy,
        dims.viewWidth / px, dims.viewHeight / pxy,
        // minimap dimensions:
        dims.viewPos.x, dims.viewPos.y,
        dims.viewWidth, dims.viewHeight,
      );
    } else {
      ctx.drawImage(
        game.viewImage.canvas,
        0, 0, game.gridWidth, game.gridHeight,
      );
    }
  } else {
    // background
    ctx.fillStyle = 'rgba(186, 175, 137, 1)';
    if (isMini) {
      ctx.fillRect(
        dims.viewPos.x, dims.viewPos.y, dims.viewWidth, dims.viewHeight,
      );
    } else {
      ctx.fillRect(
        0, 0, game.gridWidth, game.gridHeight,
      );
    }
    // render not-animated entities
    for (const id in game.NOT_ANIMATED) {
      renderEntity(ctx, game, game.entities[id], true);
    }
  }

  // animated things go on top of image:
  renderPheromones(ctx, game);
  for (const entityType in Entities) {
    for (const id of game[entityType]) {
      const entity = game.entities[id];
      if (!entity) {
        // console.log(
        //   "tried to render a null entity from grid",
        //   entityType,
        //   id,
        // );
        continue;
      }
      if (entity.NOT_ANIMATED) break;
      renderEntity(ctx, game, entity);
    }
  }


  // render cursor square
  const cursorPos = game.mouse.curPos;
  ctx.lineWidth = ctx.lineWidth * 2;
  const occupied = lookupInGrid(game.grid, cursorPos)
    .map(id => game.entities[id])
    .filter(e => e != null && (e.type == 'BACKGROUND' && !isAboveSomething(game, cursorPos)))
    .length > 0;
  if (!isNeighboringColonyPher(game, cursorPos) || occupied) {
    ctx.fillStyle = 'rgba(139,0,0, 0.1)';
    ctx.strokeStyle = 'red';
  } else {
    ctx.fillStyle = 'rgba(0,139,0, 0.1)';
    ctx.strokeStyle = 'green';
  }
  let cursorWidth = 1;
  let cursorHeight = 1;
  if (game.placeType != null && Entities[game.placeType] != null) {
    cursorWidth = Entities[game.placeType].config.width || 1;
    cursorHeight = Entities[game.placeType].config.height || 1;
  }
  ctx.fillRect(cursorPos.x, cursorPos.y,   cursorWidth, cursorHeight);
  ctx.strokeRect(cursorPos.x, cursorPos.y, cursorWidth, cursorHeight);

  // marquee
  if (
    game.isExperimental && document.onmousemove != null &&
    (game.mouse.isLeftDown || game.keepMarquee) && game.mouseMode != 'COLLECT'
  ) {
    ctx.strokeStyle = 'black';
    const {curPos, downPos} = game.mouse;
    let rect = toRect(curPos, downPos);
    if (game.keepMarquee && !game.mouse.isLeftDown) {
      rect = game.clipboard;
    }
    ctx.strokeRect(rect.position.x, rect.position.y, rect.width, rect.height);
  }

  // render score
  renderScore(ctx, game.score, dims);


  ctx.restore();
}

const renderScore = (ctx, score, dims) => {
  const text = `Score: ${score}`
  const fontSize = Math.min(dims.viewWidth, dims.viewHeight) / 10

  ctx.font = `${fontSize}px Arial`
  ctx.fillStyle = "#aaa"

  const { width } = ctx.measureText(text)

  ctx.fillText(
    text,
    dims.viewWidth / 2 - width / 2,
    4,
  )
}


const refreshStaleImage = (game, dims): void => {
  if (!game.viewImage.isStale && !game.viewImage.allStale) return;
  const {pxWidth, pxHeight, viewWidth, viewHeight, viewPos} = dims;
	const px = viewWidth / pxWidth;
  if (game.viewImage.canvas == null) {
    game.viewImage.canvas = document.createElement('canvas');
  }
  // changing these clears the canvas, which we don't want to do unless we need to
  if (game.viewImage.canvas.width != Math.round(game.gridWidth / px)) {
    game.viewImage.canvas.width = Math.round(game.gridWidth / px);
    game.viewImage.allStale = true;
  }
  if (game.viewImage.canvas.height != Math.round(game.gridHeight / (viewHeight / pxHeight))) {
    game.viewImage.canvas.height = Math.round(game.gridHeight / (viewHeight / pxHeight));
    game.viewImage.allStale = true;
  }
  const ctx = game.viewImage.canvas.getContext('2d');

  // scale world to the canvas
  ctx.save();
  ctx.scale(
    pxWidth / viewWidth,
    pxHeight / viewHeight,
  );
  ctx.lineWidth = px;

  // the image might remain stale based on asynchronousness of rendering
  let isStale = false;

  if (game.viewImage.allStale) {
    // background
    ctx.fillStyle = 'rgba(186, 175, 137, 1)';
    ctx.fillRect(
      0, 0, game.gridWidth, game.gridHeight,
    );
    ctx.globalAlpha = 0.2;
    for (let y = 0; y < game.gridHeight; y++) {
      // ctx.globalAlpha += y / game.gridHeight / 100;
      for (let x = 0; x < game.gridWidth; x++) {
        const obj = getTileSprite(game, {type: 'DIRT', dictIndexStr: 'lrtb'});
        if (obj != null && obj.img != null) {
          ctx.drawImage(
            obj.img,
            obj.x, obj.y, obj.width, obj.height,
            x, y, 1, 1,
          );
        }
      }
    }
    ctx.globalAlpha = 1;

    // render not-animated entities
    for (const id in game.NOT_ANIMATED) {
      renderEntity(ctx, game, game.entities[id]);
    }
  } else {
    const staleEntities = {};
    // because of rendering's asynchronousness, positions can be unmarked
    // as stale before their tileDict is updated
    const nextStalePositions = {};
    for (const posKey in game.viewImage.stalePositions) {
      const pos = game.viewImage.stalePositions[posKey];
      // background
      ctx.fillStyle = 'rgba(186, 175, 137, 1)';
      ctx.fillRect(pos.x, pos.y, 1, 1);
      const obj = getTileSprite(game, {type: 'DIRT', dictIndexStr: 'lrtb'});
      if (obj != null && obj.img != null) {
        ctx.globalAlpha = 0.2;
        ctx.drawImage(
          obj.img,
          obj.x, obj.y, obj.width, obj.height,
          pos.x, pos.y, 1, 1,
        );
        ctx.globalAlpha = 1;
      }
      for (const entityID of lookupInGrid(game.grid, pos)) {
        const entity = game.entities[entityID];
        if (!entity) {
          // console.log("tried to render a null entity from grid", pos, entityID);
          continue;
        }
        if (!entity.NOT_ANIMATED) continue;
        if (game.staleTiles.includes(entityID)) {
          isStale = true;
          nextStalePositions[posKey] = pos;
        }
        if (staleEntities[entity.type] == null) {
          staleEntities[entity.type] = {};
        }
        staleEntities[entity.type][entityID] = entity;
      }
    }
    for (const entityType in Entities) {
      for (const entityID in staleEntities[entityType]) {
        renderEntity(ctx, game, game.entities[entityID], Entities[entityType].render);
      }
    }
    game.viewImage.stalePositions = nextStalePositions;
  }

  ctx.restore();
  game.viewImage.isStale = isStale;
  game.viewImage.allStale = false;
};

const renderEntity = (ctx, game, entity, alwaysOnScreen): void => {
  if (entity == null || entity.position == null) return;
  let {render} = Entities[entity.type];
  if (entity.collectedAs != null) {
    render = Entities[entity.collectedAs].render;
  }
  if (
    !onScreen(game, entity)
    && !entity.NOT_ANIMATED
    && !alwaysOnScreen
    && (!entity.segmented || game.maxMinimap)
  ) {
    return;
  }
  if (entity.AGENT) {
    // interpolate position between previous position and current position
    entity = {
      ...entity,
      position: getInterpolatedPos(game, entity),
      theta: getInterpolatedTheta(game, entity),
    };
  }

  render(ctx, game, entity);

  if (game.showEntityIDs) {
    // ctx.translate(game.viewPos.x, game.viewPos.y);
    ctx.fillStyle = 'red';
    ctx.font = '1px sans serif';
    ctx.fillText(
      parseInt(entity.id), entity.position.x, entity.position.y + 1, 1,
    );
  }

  // render held entity(s)
  if (entity.actions) {
    const curAction = entity.actions[0];
    const isPickingUp = curAction != null && curAction.type == "PICKUP";
    if (entity.holding != null && !isPickingUp) {
      const {width, height} = entity;
      for (let i = 0; i < entity.holdingIDs.length; i++) {

        const heldEntity = game.entities[entity.holdingIDs[i]];
        if (heldEntity == null) continue;
        const renderFn = Entities[heldEntity.type].render;
        let position = entity.position;
        let theta = entity.theta;
        // NOTE: special case for ballistic entities
        if (entity.BALLISTIC) {
          position = entity.ballisticPosition;
          theta = entity.ballisticTheta + Math.PI;
        }
        ctx.save();
        ctx.translate(
          position.x + width / 2,
          position.y + height / 2,
        );
        ctx.rotate(theta - Math.PI / 2);
        ctx.translate(-entity.width / 2, -entity.height / 2);
        if (entity.holdingIDs.length == 1) {
          ctx.translate(width / 2 - 0.45/2, -0.1);
          ctx.scale(0.45, 0.45);
        } else {
          ctx.translate(i*width/3, -0.1);
          ctx.scale(0.48, 0.48);
        }
        renderFn(ctx, game, {...heldEntity, position: {x: 0, y: 0}});
        ctx.restore();
      }
    }
  }

  // render positions in front
  if (game.showPositionsInFront) {
    const positionsInFront = getPositionsInFront(game, entity);
    for (const pos of positionsInFront) {
      const {x, y} = pos;
      ctx.strokeStyle = 'red';
      ctx.strokeRect(x, y, 1, 1);
    }
  }

  // render true position
  if (game.showTruePositions) {
    ctx.fillStyle = 'rgba(200, 0, 0, 0.4)';
    ctx.fillRect(entity.position.x, entity.position.y, 1, 1);
  }

  // render hitbox
  if (game.showHitboxes) {
    const positionsInHitbox = getEntityPositions(game, entity);
    for (const pos of positionsInHitbox) {
      const {x, y} = pos;
      ctx.strokeStyle = 'red';
      ctx.strokeRect(x, y, 1, 1);
    }
  }

  // render true hitbox
  if (game.showTrueHitboxes) {
    const entityPositions = [];
    for (let x = 0; x < game.gridWidth; x++) {
      for (let y = 0; y < game.gridHeight; y++) {
        const entitiesAtPos = lookupInGrid(game.grid, {x, y});
        for (const id of entitiesAtPos) {
          if (id == entity.id) {
            entityPositions.push({x, y});
          }
        }
      }
    }
    for (const pos of entityPositions) {
      const {x, y} = pos;
      ctx.strokeStyle = 'red';
      ctx.strokeRect(x, y, 1, 1);
    }
  }
};


const renderPheromones = (ctx, game): void => {
  const config = globalConfig.pheromones;
  const {grid} = game;
  for (
    let x = Math.max(0, Math.floor(game.viewPos.x));
    x < Math.min(game.viewPos.x + game.viewWidth, game.gridWidth);
    x++
  ) {
    for (
      let y = Math.max(0, Math.floor(game.viewPos.y));
      y < Math.min(game.viewPos.y + game.viewHeight, game.gridHeight);
      y++
    ) {
      if (!onScreen(game, {position: {x, y}, width: 1, height: 1})) continue;
      for (const playerID in game.players) {
        if (playerID != game.playerID) continue;
        const player = game.players[playerID];
        const pheromonesAtCell = grid[x][y][player.id];
        for (const pheromoneType in pheromonesAtCell) {
          if (!game.pheromoneDisplay[pheromoneType]) continue;
          const quantity = pheromonesAtCell[pheromoneType];
          let alpha = Math.min(quantity / config[pheromoneType].quantity / 2, 0.5);
          if (alpha < 0.1) {
            continue; // don't bother rendering
          }
          alpha += 0.15;
          if (quantity <= 0) {
            continue;
          }
          if (pheromoneType == 'COLONY') {
            alpha /= 3;
          }
          ctx.globalAlpha = alpha;
          ctx.fillStyle = config[pheromoneType].color;
          if (game.showPheromoneValues) {
            ctx.strokeRect(x, y, 1, 1);
            ctx.font = '1px sans serif';
            ctx.fillText(parseInt(Math.ceil(quantity)), x, y + 1, 1);
          } else {
            if (!config[pheromoneType].isFluid) {
              const obj = getPheromoneSprite(game, {x, y}, player.id, pheromoneType);
              ctx.save();
              ctx.translate(x + 0.5, y + 0.5);
              ctx.rotate(obj.theta);
              ctx.drawImage(
                obj.img,
                obj.x, obj.y, obj.width, obj.height,
                -0.5, -0.5, 1, 1,
              );
              ctx.restore();
            } else {
              ctx.fillRect(x, y, 1, 1);
            }
          }
        }
      }
    }
  }
  ctx.globalAlpha = 1;
};

module.exports = {render};
