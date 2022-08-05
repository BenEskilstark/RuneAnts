// @flow

const {
  equals, add, subtract, magnitude, scale, vectorTheta, abs,
} = require('../utils/vectors');
const {getDuration, getFrame} = require('../simulation/actionQueue');
const {
  lookupInGrid, getPheromonesInCell,
} = require('../utils/gridHelpers');
const {getNeighborPositions} = require('../selectors/neighbors');
const {getPositionsInFront} = require('../selectors/misc');
const {thetaToDir, closeTo} = require('../utils/helpers');
const globalConfig = require('../config');

const getInterpolatedPos = (game: Game, entity: Entity): Vector => {
  const action = entity.actions[0];
  let pos = entity.position;
  if (action != null && !entity.stuck) {
    switch (action.type) {
      case 'MOVE_TURN':
      case 'MOVE': {
        const diff = subtract(entity.position, entity.prevPosition);
        const duration = getDuration(game, entity, action.type);
        const actionDuration = Math.min(duration, action.duration);
        const progress = (duration - actionDuration) / duration;
        pos = add(entity.prevPosition, scale(diff, progress));
        break;
      }
      case 'PUTDOWN':
      case 'PICKUP': {
        const posInFront = getPositionsInFront(game, entity)[0];
        const diff = subtract(posInFront, entity.position);
        const duration = getDuration(game, entity, action.type);
        let progress = (duration - Math.abs(duration / 2 - action.duration)) / (duration);
        if (magnitude(diff) > 1) {
          progress *= 0.5;
        }
        pos = add(entity.position, scale(diff, progress));
        break;
      }
    }
  }
  return pos;
};

const getInterpolatedTheta = (game: Game, entity: Entity): Vector => {
  const action = entity.actions[0];
  let theta = entity.theta;
  if (action == null) return theta;
  switch (action.type) {
    case 'MOVE_TURN': {
      let diff = entity.theta - entity.prevTheta;
      if (Math.abs(diff) < 0.01) break;
      if (Math.abs(diff) > Math.PI) {
        const mult = diff < 0 ? 1 : -1;
        diff = mult * (2 * Math.PI - Math.abs(diff));
      }
      const duration = getDuration(game, entity, action.type);
      const progress = Math.max(0, (duration - ( action.duration / 3)) / duration);
      theta = progress * diff + entity.prevTheta;
      break
    }
    case 'TURN': {
      let diff = entity.theta - entity.prevTheta;
      if (Math.abs(diff) > Math.PI) {
        const mult = diff < 0 ? 1 : -1;
        diff = mult * (2 * Math.PI - Math.abs(diff));
      }
      const duration = getDuration(game, entity, action.type);
      const progress = (duration - (action.duration + 0)) / duration;
      theta = progress * diff + entity.prevTheta;
      break;
    }
  }
  return theta;
};

const getInterpolatedIndex = (game: Game, entity: Entity): number => {
  const action = entity.actions[0];
  if (action == null) return 0;

  const duration = getDuration(game, entity, action.type);
  return Math.max(duration - action.duration - 1, 0);
};

const getMaxFrameOffset = (entity: Entity): number => {
  if (!entity.actions) return {maxFrameOffset: 0, frameStep: 0};
  if (entity.actions.length == 0) return {maxFrameOffset: 0, frameStep: 0};
  if (!entity.AGENT) return {maxFrameOffset: 0, frameStep: 0};

  const actionType = entity.actions[0].type;
  return {
    maxFrameOffset: entity[actionType].maxFrameOffset || 0,
    frameStep: entity[actionType].frameStep || 0,
  };
};

//////////////////////////////////////////////////////////////////////
// Turret-specific
//////////////////////////////////////////////////////////////////////

const getFastBarrelSprite = (game: Game, turret: Turret): Object => {
  const width = 32;
  const height = 32;
  const index = getInterpolatedIndex(game, turret);
  const frame = getFrame(game, turret, index);

  const obj = {
    img: game.sprites.FAST_TURRET,
    x: width * (frame + 2),
    y: 0,
    width,
    height,
  };

  return obj;
}

const getScorpionSprite = (game: Game, scorpion: Scorpion): Object => {
  const config = game.config;
  let width = 48;
  let height = 48;
  const obj = {
    img: game.sprites.SCORPION,
    x: 0, y: 0,
    width, height,
  };
  let index = getInterpolatedIndex(game, scorpion);
  if (scorpion.type == 'DEAD_SCORPION') {
    index = 6;
    obj.x = index * width;
  } else if (scorpion.actions.length == 0) {
    return obj;
  } else {
    obj.x = getFrame(game, scorpion, index) * width;
  }
  return obj;
};

//////////////////////////////////////////////////////////////////////
// Missile-specific
//////////////////////////////////////////////////////////////////////

const getMissileSprite = (game: Game, missile: Missile): Object => {
  let width = 16;
  let height = 32;
  let img = game.sprites.MISSILE;
  if (missile.warhead != null && missile.warhead.type == 'NUKE') {
    img = game.sprites.NUKE_MISSILE;
  }
  if (missile.PIERCING) {
    img = game.sprites.BUNKER_BUSTER;
  }
  let dur = 6;
  let numFrames = 3;
  let index = Math.floor(((missile.id + game.time) % (dur * numFrames)) / dur);

  const obj = {
    img,
    x: index * width,
    y: 0,
    width,
    height,
  };

  return obj;
};

//////////////////////////////////////////////////////////////////////
// Ant-specific
//////////////////////////////////////////////////////////////////////

const getAntSpriteAndOffset = (game: Game, ant: Ant): Object => {
  let width = 32;
  let height = 32;
  let img = game.sprites.ANT;
  if (ant.playerID == 2) {
    img = game.sprites.RED_ANT;
  }

  const obj = {
    img,
    x: 0,
    y: 0,
    width,
    height,
  };

  let index = getInterpolatedIndex(game, ant);
  if (ant.type == "DEAD_ANT") {
    index = ant.caste == 'YOUNG_QUEEN' ? 3 : 8;
    obj.x = index * width;
  } else if (ant.actions.length == 0) {
    return obj;
  } else {
    let frame = getFrame(game, ant, index);
    obj.x = frame * width;
  }

  return obj;
};

//////////////////////////////////////////////////////////////////////
// Pheromones
/////////////////////////////////////////////////////////////////////

const getPheromoneSprite = (
  game: Game, position: Vector, playerID: PlayerID, pheromoneType: string,
): Object => {
  let width = 16;
  let height = 16;
  const numFrames = 8;
  let img = game.sprites.PHEROMONE;
  const config = globalConfig.pheromones[pheromoneType];
  const quantity = getPheromonesInCell(game.grid, position, playerID)[pheromoneType];
  const progress = numFrames - Math.round((quantity / config.quantity) * numFrames);
  const obj = {
    img,
    x: progress * width,
    y: config.tileIndex * height,
    width,
    height,
    theta: 0,
  };

  if (
    quantity > config.quantity - config.decayAmount || pheromoneType == 'FOLLOW'
  ) {
    obj.x = 5;
    obj.y += 4;
    obj.width = 4;
    obj.height = 4;
    return obj;
  }

  const neighborPositions = getNeighborPositions(
    game, {position}, false, /* internal */
  );
  let neighborAmount = 0;
  let neighborPosition = null;
  for (const pos of neighborPositions) {
    const candidateAmount = getPheromonesInCell(game.grid, pos, playerID)[pheromoneType];
    if (candidateAmount > neighborAmount) {
      neighborAmount = candidateAmount;
      neighborPosition = pos;
    }
  }
  if (neighborPosition != null) {
    obj.theta = vectorTheta(subtract(position, neighborPosition)) + Math.PI / 2;
    // flip around if you are bigger than your biggest neighbor
    if (neighborAmount < quantity) {
      obj.theta += Math.PI;
    }
  }

  return obj;
}

//////////////////////////////////////////////////////////////////////
// Dirt/Food specific
/////////////////////////////////////////////////////////////////////
// indicies into the spritesheet
const tileDict = {
  'ltb': {x: 0, y: 1},
  'rtb': {x: 2, y: 1},
  'lrt': {x: 1, y: 0},
  'lrb': {x: 1, y: 2},
  't': {x: 3, y: 0},
  'b': {x: 3, y: 2},
  'l': {x: 4, y: 2},
  'r': {x: 6, y: 2},
  'tb': {x: 3, y: 1},
  'lt': {x: 0, y: 0},
  'lb': {x: 0, y: 2},
  'rt': {x: 2, y: 0},
  'rb': {x: 2, y: 2},
  'lr': {x: 5, y: 2},
};

const getTileSprite = (game: Game, entity: Entity): Object => {
  let entityType = entity.type;
  if (entity.collectedAs != null) {
    entityType = entity.collectedAs;
  }
  let width = 16;
  let height = 16;
  let spriteType = entityType == 'STONE' ? entity.subType : entityType;
  spriteType = spriteType == null ? entityType : spriteType;
  if (entity.onFire) {
    spriteType = 'HOT_' + spriteType;
  }
  if (entity.type == 'GLASS') {
    spriteType = 'STEEL';
  }
  let img = game.sprites[spriteType];
  const obj = {
    img,
    x: 0,
    y: 0,
    width,
    height,
  };
  const {dictIndexStr} = entity;
  if (dictIndexStr === '' || dictIndexStr == null) {
    obj.x = (4 + (entity.id % 4)) * width;
  } else if  (dictIndexStr === 'lrtb') {
    // HACK: write to the entity here so it will always choose the same tile
    if (entity.dictX != null) {
      obj.x = entity.dictX;
      obj.y = entity.dictY;
      obj.width = entity.dictWidth;
      obj.height = entity.dictHeight;
    } else {
      if (Math.random() < 0.7 || entityType == 'FOOD') {
        obj.x = width;
        obj.y = height;
      } else {
        obj.y = height + 2;
        obj.x = (4 + (Math.round(Math.random() * 4) % 4)) * width + 2;

        obj.width = 13;
        obj.height = 12;
      }
      entity.dictX = obj.x;
      entity.dictY = obj.y;
      entity.dictWidth = obj.width;
      entity.dictHeight = obj.height;
    }
  } else {
    if (tileDict[dictIndexStr] == null) {
      console.error("nothing in config for", dictIndexStr);
      return obj;
    }
    const {x, y} = tileDict[dictIndexStr];
    obj.x = x * width;
    obj.y = y * height;
  }

  return obj;
};

const hasNeighbor = (game, pos, type): boolean => {
  return lookupInGrid(game.grid, pos)
    .map(id => game.entities[id])
    .filter(e => e != null && e.type == type)
    .length > 0;
}

const getDictIndexStr = (game: Game, entity: Entity): Object => {
  let dictIndexStr = '';
  if (entity.position == null) return dictIndexStr;
  if (hasNeighbor(game, add(entity.position, {x: 1, y: 0}), entity.type)) {
    dictIndexStr += 'l';
  }
  if (hasNeighbor(game, add(entity.position, {x: -1, y: 0}), entity.type)) {
    dictIndexStr += 'r';
  }
  if (hasNeighbor(game, add(entity.position, {x: 0, y: 1}), entity.type)) {
    dictIndexStr += 't';
  }
  if (hasNeighbor(game, add(entity.position, {x: 0, y: -1}), entity.type)) {
    dictIndexStr += 'b';
  }
  return dictIndexStr;
};

//////////////////////////////////////////////////////////////////////
// Background
/////////////////////////////////////////////////////////////////////

const getBackgroundSprite = (game: Game, entity: Entity): Object => {
  let width = 100;
  let height = 50;
  let img = game.sprites[entity.name];
  const obj = {
    img,
    x: 0,
    y: 0,
    width: 1,
    height: 1,
  };

  obj.x = entity.position.x;
  obj.y = entity.position.y;

  return obj;
};


//////////////////////////////////////////////////////////////////////
// Segmented Critters
/////////////////////////////////////////////////////////////////////

// sprites for each segment
const segmentConfig = {
  straight: 1,
  corner: 7,
  tail: 0,
};

const getSegmentSprite = (game: Game, entity: Entity, segment): Object => {
  const img = game.sprites[entity.type];
  const obj = {
    img,
    x: 0,
    y: 0,
    width: 16,
    height: 16,
  };

  let index = getInterpolatedIndex(game, entity);
  let frame = 0;
  if (entity.actions.length > 0 && entity.actions[0].type != 'BITE') {
    frame = getFrame(game, entity, index);
  }

  if (frame == 0) {
    frame = segmentConfig[segment.segmentType];
    if (!segment.segmentType) {
      frame = 1;
    }
  } else if (segment.segmentType == 'corner') {
    const diff = segmentConfig.corner - segmentConfig.straight;
    frame += diff;
  }

  obj.x = frame * obj.width

  return obj;
};

const getSegmentHead = (game: Game, entity: Entity): Object => {
  const img = game.sprites[entity.type];
  const obj = {
    img,
    x: 0,
    y: 0,
    width: 16,
    height: 16,
  };

  let index = getInterpolatedIndex(game, entity);
  let frame = 0;
  if (entity.actions.length > 0 && entity.actions[0].type == 'BITE') {
    frame = getFrame(game, entity, index);
  }
  obj.x = frame * obj.width

  return obj;
};

const getSegmentTail = (game: Game, entity: Entity, segment): Object => {
  if (entity.type == 'CENTIPEDE') {
    return getSegmentSprite(game, entity, segment);
  } else {
    return getSegmentHead(game, entity, segment);
  }
};

module.exports = {
  getInterpolatedPos,
  getInterpolatedTheta,
  getInterpolatedIndex,
  getAntSpriteAndOffset,
  getTileSprite,
  getMissileSprite,
  getFastBarrelSprite,
  getPheromoneSprite,
  getDictIndexStr,
  getBackgroundSprite,
  getMaxFrameOffset,
  getSegmentSprite,
  getSegmentHead,
  getSegmentTail,
  getScorpionSprite,
}
