// @flow

const Agent = require('./agent.js');
const {add, subtract, equals, makeVector, vectorTheta} = require('../utils/vectors');
const {renderAgent} = require('../render/renderAgent');
const {renderSegmented} = require('../render/renderSegmented');

const config = {
  ...Agent.config,

  hp: 50,
  damage: 0,
  width: 1,
  height: 1,
  segmented: true,
  maxSegments: 16,


  // action overrides
  MOVE: {
    duration: 41 * 10,
    spriteOrder: [2, 3, 4, 5, 6], // for 180, 90 = +6
  },
  DIE: {
    duration: 41 * 2,
    spriteOrder: [6],
  },
  TURN: {
    duration: 41 * 12,
    spriteOrder: [0],
  },

  // task-specific overrides
  WANDER: {
    base: 1,
    forwardMovementBonus: 0,
    ALERT: 500,
    COLONY: 0,
  },
}

const make = (game: Game, position: Vector, segmentPositions: Array<Vector>, playerID): Worm => {
  const segments = [];
  let prevPos = position;
  for (let i = 0; i < segmentPositions.length - 1; i++) {
    const pos = segmentPositions[i];
    const nextPos = segmentPositions[i + 1];

    let segmentType = 'corner';
    let theta = 0;
    const beforeVec = subtract(prevPos, pos);
    const afterVec = subtract(pos, nextPos);
    if (beforeVec.x == 0 && afterVec.x == 0) {
      segmentType = 'straight';
      theta = beforeVec.y > afterVec.y ? Math.PI / 2 : 3 * Math.PI / 2;
    } else if (beforeVec.y == 0 && afterVec.y == 0) {
      segmentType = 'straight';
      theta = beforeVec.x > afterVec.x ? 2 * Math.PI : 0;
    } else {
      segmentType = 'corner';
      if (beforeVec.x > afterVec.x && beforeVec.y > afterVec.y) {
        theta = Math.PI;
      } else if (beforeVec.x < afterVec.x && beforeVec.y < afterVec.y) {
        theta = 0;
      } else if (beforeVec.x < afterVec.x && beforeVec.y > afterVec.y) {
        theta = 3 * Math.PI / 2;
      } else {
        theta = Math.PI / 2;
      }
    }

    segments.push({
      position: pos,
      theta,
      segmentType,
    });
    prevPos = pos;
  }
  const segBeforeTailPos = segmentPositions.length > 1
    ? segmentPositions[segmentPositions.length - 2]
    : position;
  const tailPos = segmentPositions[segmentPositions.length - 1];
  segments.push({
    position: tailPos,
    theta: vectorTheta(subtract(segBeforeTailPos, tailPos)),
  });

  return {
    ...Agent.make(game, position, playerID),
    ...config,
    type: 'WORM',
    segmented: true,
    segments,
    prevHP: config.hp,
    prevHPAge: 0,
    actions: [],
  };
};

const render = (ctx, game, entity): void => {
  renderAgent(ctx, game, entity, renderSegmented);
};

module.exports = {
  make, render, config,
};
