(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var config = {
  msPerTick: 16,

  canvasWidth: 1000,
  canvasHeight: 800,

  viewWidth: 25,
  viewHeight: 50,
  useFullScreen: true,
  cellWidth: 20,
  cellHeight: 16,

  audioFiles: [{ path: 'audio/Song Oct. 9.wav', type: 'wav' }],

  dispersingPheromoneUpdateRate: 6,
  gravity: -100,

  foodSpawnInterval: 1000 * 15,
  minFood: 50,

  explosiveScoreMultiple: 50

};

var nonMoltenPheromoneBlockingTypes = ['DIRT', 'STONE', 'DOODAD'];
var pheromoneBlockingTypes = [].concat(nonMoltenPheromoneBlockingTypes, ['ICE', 'STEEL', 'IRON']);

var pheromones = {
  COLONY: {
    quantity: 350,
    decayAmount: 1,
    color: 'rgb(155, 227, 90)',
    tileIndex: 1,

    blockingTypes: [].concat(_toConsumableArray(pheromoneBlockingTypes)),
    blockingPheromones: []
  },
  FOOD: {
    quantity: 100,
    decayAmount: 40,
    isDispersing: true,
    decayRate: 0.03, // how much it decays per tick
    color: 'rgb(0, 255, 0)',
    tileIndex: 0,

    blockingTypes: [].concat(_toConsumableArray(pheromoneBlockingTypes)),
    blockingPheromones: []
  },
  ALERT: {
    quantity: 60,
    decayAmount: 10,
    isDispersing: true,
    decayRate: 0.5, // how much it decays per tick
    color: 'rgb(255, 0, 0)',
    tileIndex: 2,
    blockingTypes: [].concat(_toConsumableArray(pheromoneBlockingTypes)),
    blockingPheromones: []
  },
  FOLLOW: {
    quantity: 100,
    decayAmount: 15,
    isDispersing: true,
    decayRate: 0.1, // how much it decays per tick
    color: 'rgb(210, 105, 30)',
    tileIndex: 1,
    blockingTypes: [].concat(_toConsumableArray(pheromoneBlockingTypes)),
    blockingPheromones: []
  },

  LIGHT: {
    quantity: 350,
    decayAmount: 1,
    color: 'rgb(155, 227, 90)',
    tileIndex: 0,

    blockingTypes: [].concat(_toConsumableArray(pheromoneBlockingTypes), ['COAL', 'TURBINE']),
    blockingPheromones: []
  },
  WATER: {
    quantity: 120,
    decayAmount: 120,
    decayRate: 0.0005,
    color: 'rgb(100, 205, 226)',
    tileIndex: 1,

    blockingTypes: pheromoneBlockingTypes,
    blockingPheromones: [],
    isDispersing: true,
    heatPoint: 100,
    heatsTo: 'STEAM',
    heatRate: 0.016666666666666666,
    coolPoint: -100, // heat level to condense at
    coolsTo: 'ICE',
    coolsToEntity: true,
    coolRate: 1, // amount of yourself that condenses per step
    coolConcentration: 5, // amount of yourself needed before condensation starts
    viscosity: {
      verticalLeftOver: 0,
      diagonalLeftOver: 0.5,
      horizontalLeftOver: 0.8
    },
    isFluid: true
  },
  STEAM: {
    quantity: 120,
    decayAmount: 120,
    decayRate: 0.0005,
    color: 'rgb(255, 255, 255)',
    tileIndex: 4,

    blockingTypes: [].concat(_toConsumableArray(pheromoneBlockingTypes)),
    blockingPheromones: [],
    isDispersing: true,
    coolPoint: 5, // heat level to condense at
    coolsTo: 'WATER',
    coolRate: 0.1, // amount of yourself that condenses per step
    coolConcentration: 60, // amount of yourself needed before condensation starts
    isFluid: true,
    viscosity: {
      verticalLeftOver: 0,
      diagonalLeftOver: 0.3,
      horizontalLeftOver: 0.66
    },
    isRising: true
  },
  OIL: {
    quantity: 120,
    decayAmount: 120,
    decayRate: 0.0005,
    color: 'rgb(0, 0, 0)',
    tileIndex: 4,

    blockingTypes: [].concat(_toConsumableArray(pheromoneBlockingTypes), ['COAL']),
    blockingPheromones: [],
    isDispersing: true,
    heatPoint: 10,
    heatsTo: 'SULPHUR_DIOXIDE',
    heatRate: 0.02,
    combustionPoint: 126,
    combustsTo: 'HOT_OIL',
    combustionRate: 1,
    viscosity: {
      verticalLeftOver: 0,
      diagonalLeftOver: 0.8,
      horizontalLeftOver: 0.9
    },
    isFluid: true
  },
  HOT_OIL: {
    quantity: 120,
    decayAmount: 120,
    decayRate: 1,
    color: 'rgb(150, 88, 101)',
    tileIndex: 4,

    blockingTypes: [].concat(_toConsumableArray(pheromoneBlockingTypes), ['COAL']),
    blockingPheromones: [],
    isDispersing: true,
    viscosity: {
      verticalLeftOver: 0,
      diagonalLeftOver: 0.5,
      horizontalLeftOver: 0.8
    },
    isFluid: true
  },
  SULPHUR_DIOXIDE: {
    quantity: 120,
    decayAmount: 120,
    decayRate: 0.0005,
    color: 'rgb(155, 227, 90)',
    tileIndex: 0,

    blockingTypes: [].concat(_toConsumableArray(pheromoneBlockingTypes)),
    blockingPheromones: [],
    isDispersing: true,
    coolPoint: -5, // heat level to condense at
    coolsTo: 'SULPHUR',
    coolRate: 1, // amount of yourself that condenses per step
    coolConcentration: 80, // amount of yourself needed before condensation starts
    coolsToEntity: true,
    isFluid: true,
    viscosity: {
      verticalLeftOver: 0,
      diagonalLeftOver: 0.3,
      horizontalLeftOver: 0.66
    },
    isRising: true
  },
  SAND: {
    quantity: 120,
    decayAmount: 120,
    decayRate: 0.0005,
    color: 'rgb(250, 240, 70)',
    tileIndex: 3,

    blockingTypes: [].concat(_toConsumableArray(pheromoneBlockingTypes), ['COAL']),
    blockingPheromones: ['MOLTEN_SAND'],
    isDispersing: true,
    heatPoint: 100,
    heatsTo: 'MOLTEN_SAND',
    heatRate: 1,
    viscosity: {
      verticalLeftOver: 0,
      diagonalLeftOver: 0.5,
      horizontalLeftOver: 1
    },
    isFluid: true
  },
  MOLTEN_SAND: {
    quantity: 120,
    decayAmount: 120,
    decayRate: 0.0005,
    color: 'rgb(215, 88, 101)',
    tileIndex: 2,

    blockingTypes: [].concat(_toConsumableArray(pheromoneBlockingTypes)),
    blockingPheromones: ['SAND', 'MOLTEN_IRON', 'MOLTEN_STEEL'],
    isDispersing: true,
    coolPoint: 5, // heat level to condense at
    coolsTo: 'GLASS',
    coolsToEntity: true,
    coolRate: 1, // amount of yourself that condenses per step
    coolConcentration: 9, // amount of yourself needed before condensation starts
    viscosity: {
      verticalLeftOver: 0,
      diagonalLeftOver: 0.5,
      horizontalLeftOver: 0.8
    },
    isFluid: true
  },
  MOLTEN_IRON: {
    quantity: 120,
    decayAmount: 120,
    decayRate: 0.0005,
    color: 'rgb(100, 100, 100)',
    tileIndex: 5,

    blockingTypes: [].concat(_toConsumableArray(pheromoneBlockingTypes)),
    blockingPheromones: ['MOLTEN_STEEL', 'MOLTEN_SAND', 'SAND'],
    isDispersing: true,
    coolPoint: 80, // heat level to freeze at
    coolsTo: 'IRON',
    coolRate: 1,
    coolsToEntity: true,
    isFluid: true,
    viscosity: {
      verticalLeftOver: 0,
      diagonalLeftOver: 0,
      horizontalLeftOver: 1
    },
    // NOTE: not using this
    combinesTo: [{
      substance: 'PHEROMONE',
      type: 'MOLTEN_STEEL',
      ingredients: [{ substance: 'ENTITY', type: 'COAL' }]
    }]
  },
  MOLTEN_STEEL: {
    quantity: 240,
    decayAmount: 240,
    decayRate: 0.0005,
    color: 'rgb(220, 220, 220)',
    tileIndex: 4,

    blockingTypes: [].concat(_toConsumableArray(pheromoneBlockingTypes)),
    blockingPheromones: ['MOLTEN_IRON', 'MOLTEN_SAND', 'SAND'],
    isDispersing: true,
    coolPoint: 90, // heat level to freeze at
    coolsTo: 'STEEL',
    coolRate: 1,
    coolsToEntity: true,
    isFluid: true,
    viscosity: {
      verticalLeftOver: 0,
      diagonalLeftOver: 0,
      horizontalLeftOver: 1
    }
  },
  HEAT: {
    quantity: 150,
    decayAmount: 15,
    decayRate: 1, // how much it decays per tick
    color: 'rgb(255, 0, 0)',
    tileIndex: 2,

    blockingTypes: [].concat(nonMoltenPheromoneBlockingTypes),
    blockingPheromones: [],
    isDispersing: true
  },
  COLD: {
    quantity: 120,
    decayAmount: 12,
    decayRate: 1, // how much it decays per tick
    color: 'rgb(100, 205, 226)',
    tileIndex: 1,

    blockingTypes: [].concat(nonMoltenPheromoneBlockingTypes),
    blockingPheromones: [],
    isDispersing: true
  }
};

module.exports = { config: config, pheromones: pheromones };
},{}],2:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _require = require('./makeEntity'),
    makeEntity = _require.makeEntity;

var _require2 = require('../utils/vectors'),
    subtract = _require2.subtract,
    add = _require2.add,
    makeVector = _require2.makeVector,
    vectorTheta = _require2.vectorTheta,
    round = _require2.round,
    rotate = _require2.rotate,
    floor = _require2.floor;

var _require3 = require('../selectors/sprites'),
    getAntSpriteAndOffset = _require3.getAntSpriteAndOffset;

var _require4 = require('../render/renderAgent'),
    renderAgent = _require4.renderAgent;

var config = {
  hp: 60,
  damage: 20,
  width: 2,
  height: 2,
  maxHold: 1,
  age: 0,

  // agent properties
  AGENT: true,
  pickupTypes: ['FOOD', 'DIRT', 'TOKEN', 'DYNAMITE', 'COAL', 'IRON', 'STEEL'],
  blockingTypes: ['FOOD', 'DIRT', 'AGENT', 'STONE', 'DOODAD', 'WORM', 'TOKEN', 'DYNAMITE', 'COAL', 'IRON', 'STEEL'],

  // action params
  MOVE: {
    duration: 45 * 4,
    spriteOrder: [1, 2],
    maxFrameOffset: 2,
    frameStep: 2
  },
  MOVE_TURN: {
    duration: 41 * 5,
    spriteOrder: [1, 2],
    maxFrameOffset: 2,
    frameStep: 2
  },
  PICKUP: {
    duration: 41 * 6,
    spriteOrder: [5, 6, 7]
  },
  PUTDOWN: {
    duration: 41 * 6,
    spriteOrder: [7, 6, 5]
  },
  TURN: {
    duration: 41 * 6,
    spriteOrder: [1, 2, 3, 4]
  },
  DIE: {
    duration: 41 * 2,
    spriteOrder: [8]
  },

  // task-specific params
  WANDER: {
    base: 1,
    forwardMovementBonus: 0,
    prevPositionPenalty: -100,
    ALERT: 500,
    COLONY: 10
  },
  RETRIEVE: {
    base: 1,
    forwardMovementBonus: 100,
    prevPositionPenalty: -100,
    ALERT: 300,
    COLONY: -100
  },
  RETURN: {
    base: 10,
    forwardMovementBonus: 500,
    prevPositionPenalty: -100,
    ALERT: 1000,
    COLONY: 1000
  },
  MOVE_DIRT: {
    base: 1,
    forwardMovementBonus: 20,
    prevPositionPenalty: -100,
    ALERT: 100,
    DIRT_DROP: 200
  },
  GO_TO_DIRT: {
    base: 1,
    forwardMovementBonus: 20,
    prevPositionPenalty: -100,
    ALERT: 100,
    MARKED_DIRT_PHER: 300
  }
};

var make = function make(game, position, playerID) {
  var agent = _extends({}, makeEntity('AGENT', position, config.width, config.height), config, {
    playerID: playerID,
    prevHP: config.hp,
    prevHPAge: 0,
    holding: null,
    holdingIDs: [], // treat holding like a stack
    task: 'WANDER',
    timeOnTask: 0,
    actions: [],
    lastHeldID: null,

    // this frame offset allows iterating through spritesheets across
    // multiple actions (rn only used by queen ant doing one full walk
    // cycle across two MOVE actions)
    frameOffset: 0,
    timeOnMove: 0 // for turning in place
  });

  return agent;
};

var render = function render(ctx, game, agent) {
  renderAgent(ctx, game, agent, spriteRenderFn);
};

var spriteRenderFn = function spriteRenderFn(ctx, game, ant) {
  var sprite = getAntSpriteAndOffset(game, ant);
  if (sprite.img != null) {
    ctx.drawImage(sprite.img, sprite.x, sprite.y, sprite.width, sprite.height, 0, 0, ant.width, ant.height);
  }
};

module.exports = {
  make: make, render: render, config: config
};
},{"../render/renderAgent":18,"../selectors/sprites":25,"../utils/vectors":32,"./makeEntity":10}],3:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _require = require('./makeEntity'),
    makeEntity = _require.makeEntity;

var _require2 = require('../selectors/sprites'),
    getAntSpriteAndOffset = _require2.getAntSpriteAndOffset;

var _require3 = require('../render/renderAgent'),
    renderAgent = _require3.renderAgent;

var config = {
  maxHP: 10, // hack to prevent circular reference with render Agent
  hp: 10,
  damage: 1,
  width: 1,
  height: 1,
  maxHold: 1,
  age: 0,

  AGENT: true,

  pickupTypes: ['FOOD', 'DIRT', 'TOKEN', 'DYNAMITE', 'STEEL'],
  blockingTypes: ['FOOD', 'DIRT', 'AGENT', 'STONE', 'DOODAD', 'WORM', 'TOKEN', 'ANT', 'STEEL'],

  // action params
  MOVE: {
    duration: 41 * 6,
    spriteOrder: [1, 2],
    maxFrameOffset: 2,
    frameStep: 2
  },
  MAN: {
    duration: 41 * 4,
    spriteOrder: [1, 2],
    maxFrameOffset: 2,
    frameStep: 2
  },
  UN_MAN: {
    duration: 41 * 4,
    spriteOrder: [1, 2],
    maxFrameOffset: 2,
    frameStep: 2
  },
  MOVE_TURN: {
    duration: 41 * 7,
    spriteOrder: [1, 2],
    maxFrameOffset: 2,
    frameStep: 2
  },
  PICKUP: {
    duration: 41 * 6,
    spriteOrder: [5, 6, 7]
  },
  PUTDOWN: {
    duration: 41 * 6,
    spriteOrder: [7, 6, 5]
  },
  TURN: {
    duration: 41 * 6,
    spriteOrder: [1, 2, 3, 4]
  },
  DIE: {
    duration: 41 * 2,
    spriteOrder: [8]
  },
  GRAPPLE: {
    duration: 41 * 6,
    spriteOrder: [5, 6, 7]
  },
  BITE: {
    duration: 41 * 6,
    spriteOrder: [5, 6, 7]
  },

  // task-specific params
  WANDER: {
    base: 1,
    forwardMovementBonus: 0,
    prevPositionPenalty: -100,
    ALERT: 500,
    FOOD: 100,
    FOLLOW: 2000,
    COLONY: -1
  },
  RETRIEVE: {
    base: 1,
    forwardMovementBonus: 100,
    prevPositionPenalty: -100,
    ALERT: 300,
    FOOD: 300,
    COLONY: -100
  },
  RETURN: {
    base: 3,
    forwardMovementBonus: 500,
    prevPositionPenalty: -1000,
    ALERT: 0,
    FOOD: 200,
    COLONY: 1000
  },
  DEFEND: {
    base: 3,
    forwardMovementBonus: 500,
    prevPositionPenalty: -1000,
    ALERT: 50
  },
  MOVE_DIRT: {
    base: 1,
    forwardMovementBonus: 20,
    prevPositionPenalty: -100,
    ALERT: 100,
    DIRT_DROP: 200
  },
  GO_TO_DIRT: {
    base: 1,
    forwardMovementBonus: 20,
    prevPositionPenalty: -100,
    ALERT: 100,
    MARKED_DIRT_PHER: 300
  }
};

var make = function make(game, position, playerID) {
  var ant = _extends({}, makeEntity('ANT', position, config.width, config.height), config, {
    playerID: playerID,
    prevHP: config.hp,
    prevHPAge: 0,
    holding: null,
    holdingIDs: [], // treat holding like a stack
    actions: [],

    task: 'WANDER',
    timeOnTask: 0,

    foodPherQuantity: 0, // tracks how much food pheromone to place

    // this frame offset allows iterating through spritesheets across
    // multiple actions (rn only used by queen ant doing one full walk
    // cycle across two MOVE actions)
    frameOffset: 0,
    timeOnMove: 0 // for turning in place
  });

  return ant;
};

var render = function render(ctx, game, agent) {
  renderAgent(ctx, game, agent, spriteRenderFn);
};

var spriteRenderFn = function spriteRenderFn(ctx, game, ant) {
  var sprite = getAntSpriteAndOffset(game, ant);
  if (sprite.img != null) {
    ctx.drawImage(sprite.img, sprite.x, sprite.y, sprite.width, sprite.height, 0, 0, ant.width, ant.height);
  }
};

module.exports = {
  config: config, make: make, render: render
};
},{"../render/renderAgent":18,"../selectors/sprites":25,"./makeEntity":10}],4:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _require = require('../selectors/sprites'),
    getBackgroundSprite = _require.getBackgroundSprite;

var _require2 = require('./makeEntity'),
    makeEntity = _require2.makeEntity;

var config = {
  notOccupying: true, // when creating entities w/marquee, they can go on top of this
  // notBlockingPutdown: true, // when putting down entities, they can go on top of this
  NOT_ANIMATED: true
  // onlyMakeOne: true, // when marquee-ing to create, only make one of these
  // with size = marquee
};

var make = function make(game, position, width, height, name) {
  return _extends({}, makeEntity('BACKGROUND', position, width, height), config, {
    name: name
  });
};

var render = function render(ctx, game, bg) {
  var obj = getBackgroundSprite(game, bg);
  if (obj == null || obj.img == null) return;
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.drawImage(obj.img, obj.x, obj.y, obj.width, obj.height, bg.position.x, bg.position.y, bg.width, bg.height);
  ctx.restore();
};

module.exports = {
  make: make, render: render, config: config
};
},{"../selectors/sprites":25,"./makeEntity":10}],5:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _require = require('./makeEntity'),
    makeEntity = _require.makeEntity;

var _require2 = require('../render/renderAgent'),
    renderAgent = _require2.renderAgent;

var globalConfig = require('../config');

var config = {
  maxHP: 50,
  hp: 50,
  width: 1,
  height: 1,
  PHEROMONE_EMITTER: true,
  AGENT: true,
  pheromoneType: 'COLONY',
  isExplosionImmune: true,

  blockingTypes: ['FOOD', 'DIRT', 'AGENT', 'STONE', 'DOODAD', 'WORM', 'TOKEN', 'DYNAMITE', 'COAL', 'IRON', 'STEEL'],

  // need this for panning to focus on it
  MOVE: {
    duration: 45 * 4
  }
};

var make = function make(game, position, playerID, quantity) {
  return _extends({}, makeEntity('BASE', position, config.width, config.height), config, {
    playerID: playerID,
    quantity: quantity || globalConfig.pheromones[config.pheromoneType].quantity,
    actions: []
  });
};

var render = function render(ctx, game, agent) {
  renderAgent(ctx, game, agent, spriteRenderFn);
};

var spriteRenderFn = function spriteRenderFn(ctx, game, base) {
  var img = game.sprites.BASE;
  ctx.drawImage(img, 0, 0, base.width, base.height);
};

module.exports = { config: config, make: make, render: render };
},{"../config":1,"../render/renderAgent":18,"./makeEntity":10}],6:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _require = require('../selectors/sprites'),
    getTileSprite = _require.getTileSprite;

var _require2 = require('./makeEntity'),
    makeEntity = _require2.makeEntity;

var config = {
  NOT_ANIMATED: true,
  TILED: true,
  COLLECTABLE: true,
  hp: 10
};

var make = function make(game, position, width, height) {
  return _extends({}, makeEntity('DIRT', position, width, height), config, {
    marked: null,
    dictIndexStr: ''
  });
};

var render = function render(ctx, game, dirt) {
  var obj = getTileSprite(game, dirt);

  if (obj == null || obj.img == null) return;
  ctx.drawImage(obj.img, obj.x, obj.y, obj.width, obj.height, dirt.position.x, dirt.position.y, dirt.width, dirt.height);

  if (dirt.marked != null) {
    ctx.fillStyle = 'rgba(0, 0, 250, 0.2)';
    ctx.fillRect(dirt.position.x, dirt.position.y, dirt.width, dirt.height);
  }
};

module.exports = {
  make: make, render: render, config: config
};
},{"../selectors/sprites":25,"./makeEntity":10}],7:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _require = require('./makeEntity'),
    makeEntity = _require.makeEntity;

var config = {
  notOccupying: true, // when creating entities w/marquee, they can go on top of this
  onlyMakeOne: true // when marquee-ing to create, only make one of these
  // with size = marquee
};

var make = function make(game, position, width, height, sprite) {
  return _extends({}, makeEntity('DOODAD', position, width, height), config, {
    sprite: sprite,
    theta: Math.PI / 2
  });
};

var render = function render(ctx, game, doodad) {
  var sprite = game.sprites[doodad.sprite];
  if (sprite != null) {
    ctx.drawImage(sprite, doodad.position.x, doodad.position.y, doodad.width, doodad.height);
  }
};

module.exports = {
  make: make, render: render, config: config
};
},{"./makeEntity":10}],8:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _require = require('./makeEntity'),
    makeEntity = _require.makeEntity;

var _require2 = require('../selectors/sprites'),
    getInterpolatedIndex = _require2.getInterpolatedIndex;

var _require3 = require('../simulation/actionQueue'),
    getDuration = _require3.getDuration;

var globalConfig = require('../config');

/**
 *  Explosives explode when they die. They can be killed by
 *  running out of hp or by having an age (in ms) greater than their timer
 *  time (set timer to null if you don't want it to do this).
 */

var config = {
  EXPLOSIVE: true,
  hp: 10,
  width: 1,
  height: 1,
  explosionRadius: 5,
  damage: 40,
  timer: 1,
  age: 0,

  DIE: {
    duration: 300,
    effectIndex: 250,
    spriteOrder: [0]
  }
};

var make = function make(game, position, playerID, explosionRadiusType) {
  return _extends({}, makeEntity('DYNAMITE', position, config.width, config.height), config, {
    playerID: playerID,
    actions: [],
    explosionRadiusType: explosionRadiusType || 'CIRCULAR'
  });
};

var render = function render(ctx, game, dynamite) {
  var curAction = dynamite.actions[0];
  // ctx.strokeStyle = 'black';
  // ctx.fillStyle = 'red';
  // ctx.fillRect(0, 0, dynamite.width, dynamite.height);
  // ctx.strokeRect(0, 0, dynamite.width, dynamite.height);

  // explosion itself
  if (curAction != null && curAction.type == 'DIE') {
    ctx.save();
    ctx.translate(dynamite.position.x, dynamite.position.y);
    var duration = getDuration(game, dynamite, curAction.type);
    var index = getInterpolatedIndex(game, dynamite);
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = 'orange';
    ctx.beginPath();
    var radius = index / duration * dynamite.explosionRadius;
    ctx.arc(dynamite.width / 2, dynamite.height / 2, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
};

module.exports = { config: config, make: make, render: render };
},{"../config":1,"../selectors/sprites":25,"../simulation/actionQueue":26,"./makeEntity":10}],9:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _require = require('../selectors/sprites'),
    getTileSprite = _require.getTileSprite;

var _require2 = require('./makeEntity'),
    makeEntity = _require2.makeEntity;

var config = {
  TILED: true,
  hp: 5
};

var make = function make(game, position, width, height) {
  return _extends({}, makeEntity('FOOD', position, width, height), config, {
    dictIndexStr: ''
  });
};

var render = function render(ctx, game, food) {
  var obj = getTileSprite(game, food);
  if (obj == null || obj.img == null) return;
  ctx.drawImage(obj.img, obj.x, obj.y, obj.width, obj.height, food.position.x, food.position.y, food.width, food.height);

  if (game.showMarkedFood) {
    if (game.bases[game.playerID].foodMarkedForRetrieval[food.id]) {
      ctx.fillStyle = 'rgba(0, 0, 250, 0.2)';
      ctx.fillRect(food.position.x, food.position.y, food.width, food.height);
      ctx.fillStyle = 'red';
      ctx.font = '1px sans serif';
      ctx.fillText(parseInt(food.id), food.position.x, food.position.y + 1, 1);
    }
  }
};

module.exports = {
  make: make, render: render, config: config
};
},{"../selectors/sprites":25,"./makeEntity":10}],10:[function(require,module,exports){
'use strict';

var makeEntity = function makeEntity(type, position, width, height) {
	return {
		id: -1, // NOTE: this is set by the reducer
		type: type,
		position: position,
		prevPosition: position,
		width: width != null ? width : 1,
		height: height != null ? height : 1,
		theta: 0,
		prevTheta: 0
	};
};

module.exports = {
	makeEntity: makeEntity
};
},{}],11:[function(require,module,exports){
'use strict';

var globalConfig = require('../config');

/**
 * Entity creation checklist:
 *  - add the entity here keyed by type (in render order)
 *  - add the entities/entityType file to this directory
 *  - add the entities options and arguments to ui/LevelEditor
 *  - if the entity has any special properties, add them to properties/
 *  - if it blocks pheromones, add to the config
 */

var Entities = {
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

  DYNAMITE: require('./dynamite.js')

};

module.exports = {
  Entities: Entities
};
},{"../config":1,"./agent.js":2,"./ant.js":3,"./background.js":4,"./base.js":5,"./dirt.js":6,"./doodad.js":7,"./dynamite.js":8,"./food.js":9,"./steel.js":12,"./stone.js":13,"./token.js":14,"./worm.js":15}],12:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _require = require('../selectors/sprites'),
    getTileSprite = _require.getTileSprite;

var _require2 = require('./makeEntity'),
    makeEntity = _require2.makeEntity;

var config = {
  TILED: true,
  MELTABLE: true,
  COLLECTABLE: true,
  PHEROMONE_EMITTER: true,
  pheromoneType: 'MOLTEN_STEEL',
  hp: 240,
  meltTemp: 140, // temperature at which you catch on fire
  heatQuantity: 240 // amount of steel  produced when melted
};

var make = function make(game, position, width, height, hp) {
  return _extends({}, makeEntity('STEEL', position, width || 1, height || 1), config, {
    dictIndexStr: '',
    hp: hp || config.hp,
    playerID: 0, // gaia
    quantity: 0 // amount of pheromone emitted
  });
};

var render = function render(ctx, game, steel) {
  var obj = getTileSprite(game, steel);
  if (obj == null || obj.img == null) return;
  ctx.drawImage(obj.img, obj.x, obj.y, obj.width, obj.height, steel.position.x, steel.position.y, steel.width, steel.height);
};

module.exports = {
  make: make, render: render, config: config
};
},{"../selectors/sprites":25,"./makeEntity":10}],13:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _require = require('../selectors/sprites'),
    getTileSprite = _require.getTileSprite;

var _require2 = require('./makeEntity'),
    makeEntity = _require2.makeEntity;

var config = {
  TILED: true,
  NOT_ANIMATED: true,
  COLLECTABLE: true,
  hp: 20
};

var make = function make(game, position, subType, width, height) {
  return _extends({}, makeEntity('STONE', position, width, height), config, {
    subType: subType == null || subType == 1 ? 'STONE' : subType,
    dictIndexStr: ''
  });
};

var render = function render(ctx, game, stone) {
  var obj = getTileSprite(game, stone);
  if (obj == null || obj.img == null) return;
  ctx.drawImage(obj.img, obj.x, obj.y, obj.width, obj.height, stone.position.x, stone.position.y, stone.width, stone.height);
};

module.exports = {
  make: make, render: render, config: config
};
},{"../selectors/sprites":25,"./makeEntity":10}],14:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _require = require('./makeEntity'),
    makeEntity = _require.makeEntity;

var globalConfig = require('../config');

var config = {
  PHEROMONE_EMITTER: true
};

var make = function make(game, position, playerID, pheromoneType, quantity) {
  return _extends({}, makeEntity('TOKEN', position, 1, 1), config, {
    pheromoneType: pheromoneType,
    playerID: playerID,
    quantity: quantity || globalConfig.pheromones[pheromoneType].quantity
  });
};

var render = function render(ctx, game, token) {
  ctx.save();
  ctx.translate(token.position.x, token.position.y);
  ctx.strokeStyle = 'black';
  ctx.fillStyle = 'steelblue';
  ctx.beginPath();
  var radius = token.width / 2;
  ctx.arc(token.width / 2, token.height / 2, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
  ctx.restore();
};

module.exports = { config: config, make: make, render: render };
},{"../config":1,"./makeEntity":10}],15:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var Agent = require('./agent.js');

var _require = require('../utils/vectors'),
    add = _require.add,
    subtract = _require.subtract,
    equals = _require.equals,
    makeVector = _require.makeVector,
    vectorTheta = _require.vectorTheta;

var _require2 = require('../render/renderAgent'),
    renderAgent = _require2.renderAgent;

var _require3 = require('../render/renderSegmented'),
    renderSegmented = _require3.renderSegmented;

var config = _extends({}, Agent.config, {

  hp: 50,
  damage: 0,
  width: 1,
  height: 1,
  segmented: true,
  maxSegments: 16,

  // action overrides
  MOVE: {
    duration: 41 * 10,
    spriteOrder: [2, 3, 4, 5, 6] // for 180, 90 = +6
  },
  DIE: {
    duration: 41 * 2,
    spriteOrder: [6]
  },
  TURN: {
    duration: 41 * 12,
    spriteOrder: [0]
  },

  // task-specific overrides
  WANDER: {
    base: 1,
    forwardMovementBonus: 0,
    ALERT: 500,
    COLONY: 0
  }
});

var make = function make(game, position, segmentPositions, playerID) {
  var segments = [];
  var prevPos = position;
  for (var i = 0; i < segmentPositions.length - 1; i++) {
    var pos = segmentPositions[i];
    var nextPos = segmentPositions[i + 1];

    var segmentType = 'corner';
    var theta = 0;
    var beforeVec = subtract(prevPos, pos);
    var afterVec = subtract(pos, nextPos);
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
      theta: theta,
      segmentType: segmentType
    });
    prevPos = pos;
  }
  var segBeforeTailPos = segmentPositions.length > 1 ? segmentPositions[segmentPositions.length - 2] : position;
  var tailPos = segmentPositions[segmentPositions.length - 1];
  segments.push({
    position: tailPos,
    theta: vectorTheta(subtract(segBeforeTailPos, tailPos))
  });

  return _extends({}, Agent.make(game, position, playerID), config, {
    type: 'WORM',
    segmented: true,
    segments: segments,
    prevHP: config.hp,
    prevHPAge: 0,
    actions: []
  });
};

var render = function render(ctx, game, entity) {
  renderAgent(ctx, game, entity, renderSegmented);
};

module.exports = {
  make: make, render: render, config: config
};
},{"../render/renderAgent":18,"../render/renderSegmented":20,"../utils/vectors":32,"./agent.js":2}],16:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

// NOTE: requires are relative to current directory and not parent
// directory like every other file because this worker is not required by
// any other module and so does not go through the normal babel/browserify transforms.
// See the make file for how it works
var _require = require('./utils/vectors'),
    add = _require.add,
    multiply = _require.multiply,
    subtract = _require.subtract,
    equals = _require.equals,
    floor = _require.floor,
    containsVector = _require.containsVector,
    vectorTheta = _require.vectorTheta;

var _require2 = require('./utils/helpers'),
    isDiagonalMove = _require2.isDiagonalMove;

var _require3 = require('./utils/stochastic'),
    oneOf = _require3.oneOf;

var _require4 = require('./selectors/neighbors'),
    getNeighborPositions = _require4.getNeighborPositions;

var _require5 = require('./utils/gridHelpers'),
    lookupInGrid = _require5.lookupInGrid,
    getEntityPositions = _require5.getEntityPositions;

var _require6 = require('./selectors/pheromones'),
    getPheromoneAtPosition = _require6.getPheromoneAtPosition,
    getQuantityForStalePos = _require6.getQuantityForStalePos,
    getTemperature = _require6.getTemperature,
    isPositionBlockingPheromone = _require6.isPositionBlockingPheromone;

var _require7 = require('./utils/helpers'),
    encodePosition = _require7.encodePosition,
    decodePosition = _require7.decodePosition,
    clamp = _require7.clamp;

var _require8 = require('./simulation/pheromones'),
    setPheromone = _require8.setPheromone,
    getBiggestNeighborVal = _require8.getBiggestNeighborVal;

var _require9 = require('./simulation/entityOperations'),
    insertEntityInGrid = _require9.insertEntityInGrid,
    removeEntityFromGrid = _require9.removeEntityFromGrid;

var globalConfig = require('./config');

/**
 *
 * This is a web worker to allow computing pheromones in a separate thread
 * since it can often take a long time.
 * Here's how this system works:
 * - The worker is created on game start with a reference to it on the game state
 * - It maintains a copy of the grid and all its pheromones
 * - Whenever the floodFillSources or reverseFloodFillSources change,
 *   then post a message to the worker to compute the new pheromone state
 * - It uses modified versions of the simulation/pheromones floodFill and reverseFloodFill
 *   functions to make a list of positions with new pheromone values
 * - The worker then sends this list back to a pheromoneWorkerSystem that listens
 *   for messages
 * - This system dispatches an action to update all the pheromones at once
 */

var game = null;
var floodFillQueue = [];
var reverseFloodFillQueue = [];

onmessage = function onmessage(ev) {
  var action = ev.data;
  switch (action.type) {
    case 'INIT':
      {
        // console.log("worker inited");
        game = {
          grid: action.grid,
          entities: action.entities,
          PHEROMONE_EMITTER: _extends({}, action.PHEROMONE_EMITTER),
          TURBINE: [].concat(_toConsumableArray(action.TURBINE)),

          floodFillQueue: [],
          reverseFloodFillQueue: [],
          dispersingPheromonePositions: {},
          lastTime: new Date().getTime()
        };
        for (var pherType in globalConfig.pheromones) {
          var pheromone = globalConfig.pheromones[pherType];
          if (pheromone.isDispersing) {
            game.dispersingPheromonePositions[pherType] = {};
          }
        }
        break;
      }
    case 'FLOOD_FILL':
      {
        var _game$floodFillQueue;

        // console.log("worker received flood fill request", action.floodFillSources);
        if (!game) break;
        (_game$floodFillQueue = game.floodFillQueue).push.apply(_game$floodFillQueue, _toConsumableArray(action.floodFillSources));
        startFloodFill();
        break;
      }
    case 'REVERSE_FLOOD_FILL':
      {
        var _game$reverseFloodFil;

        // console.log("worker received reverse flood fill request");
        if (!game) break;
        (_game$reverseFloodFil = game.reverseFloodFillQueue).push.apply(_game$reverseFloodFil, _toConsumableArray(action.reverseFloodFillSources));
        startReverseFloodFill();
        break;
      }
    case 'DISPERSE_PHEROMONES':
      {
        if (!game) break;
        startDispersePheromones(action.timeStamp);
        game.lastTime = action.timeStamp;
        break;
      }
    case 'SET_PHEROMONE':
      {
        var position = action.position,
            pheromoneType = action.pheromoneType,
            quantity = action.quantity,
            playerID = action.playerID;

        if (!game) break;
        setPheromone(game, position, pheromoneType, quantity, playerID);
        break;
      }
    case 'INSERT_IN_GRID':
      {
        var entity = action.entity;

        if (!game) break;
        insertEntityInGrid(game, entity);
        game.entities[entity.id] = entity; // need to re-up this in case of
        // entity type change
        break;
      }
    case 'REMOVE_FROM_GRID':
      {
        var _entity = action.entity;

        if (!game) break;
        removeEntityFromGrid(game, _entity);
        break;
      }
    case 'ADD_ENTITY':
      {
        var _entity2 = action.entity;

        if (!game) break;
        game.entities[_entity2.id] = _entity2;
        if (_entity2.PHEROMONE_EMITTER) {
          game.PHEROMONE_EMITTER[_entity2.id] = true;
        }
        if (_entity2.type == 'TURBINE') {
          game.TURBINE.push(_entity2.id);
        }
        break;
      }
    case 'REMOVE_ENTITY':
      {
        var _entity3 = action.entity;

        if (!game) break;
        delete game.entities[_entity3.id];
        if (_entity3.PHEROMONE_EMITTER) {
          delete game.PHEROMONE_EMITTER[_entity3.id];
        }
        if (_entity3.type == 'TURBINE') {
          game.TURBINE = game.TURBINE.filter(function (id) {
            return id != _entity3.id;
          });
        }
        break;
      }
    case 'SET_EMITTER_QUANTITY':
      {
        var entityID = action.entityID,
            _quantity = action.quantity;

        if (!game) break;
        var _entity4 = game.entities[entityID];
        game.entities[entityID].quantity = _quantity;
        if (_quantity == 0) {
          var revQuantity = globalConfig.pheromones[_entity4.pheromoneType].quantity;
          setPheromone(game, _entity4.position, _entity4.pheromoneType, revQuantity + 1, _entity4.playerID || 0);
          game.reverseFloodFillQueue.push({
            id: _entity4.id,
            playerID: _entity4.playerID || 0,
            pheromoneType: _entity4.pheromoneType,
            position: _entity4.position,
            quantity: revQuantity
          });
          startReverseFloodFill();
        } else {
          // game.floodFillQueue.push({
          //
          // });
          // startFloodFill();
        }
        break;
      }
    case 'CHANGE_EMITTER_TYPE':
      {
        var _entityID = action.entityID,
            _pheromoneType = action.pheromoneType;

        if (!game) break;
        game.entities[_entityID].pheromoneType = _pheromoneType;
        break;
      }
  }
};

var startFloodFill = function startFloodFill() {
  var result = [];
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = game.floodFillQueue[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var source = _step.value;

      if (source.stale) {
        source.quantity = getQuantityForStalePos(game, source.position, source.pheromoneType, source.playerID).quantity;
      }
      if (globalConfig.pheromones[source.pheromoneType] == null) {
        console.log("no pheromone config", source.pheromoneType, source);
      }
      if (source.quantity > globalConfig.pheromones[source.pheromoneType].quantity) {
        // console.log("big quantity", source.quantity, source.pheromoneType, source);
        source.quantity = globalConfig.pheromones[source.pheromoneType].quantity;
      }
      if (source.pheromoneType == 'COLONY' && source.playerID == 0 && source.quantity > 0) {
        // console.log("got zero colony", source);
        source.playerID = 1;
      }
      var positions = floodFillPheromone(game, source.pheromoneType, source.playerID, [source], {});
      if (Object.keys(positions).length > 0) {
        result.push(positions);
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  game.floodFillQueue = [];
  postMessage({ type: 'PHEROMONES', result: result });
};

var startReverseFloodFill = function startReverseFloodFill() {
  var result = [];
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = game.reverseFloodFillQueue[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var source = _step2.value;

      var positions = reverseFloodFillPheromone(game, source.pheromoneType, source.playerID, [source.position]);
      if (Object.keys(positions).length > 0) {
        result.push(positions);
      }
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  game.reverseFloodFillQueue = [];
  postMessage({ type: 'PHEROMONES', result: result });
};

var startDispersePheromones = function startDispersePheromones(timeStamp) {
  var result = [];
  var nextDispersingPheromones = updateDispersingPheromones(game, timeStamp);
  for (var pherType in nextDispersingPheromones) {
    if (Object.keys(nextDispersingPheromones[pherType]).length > 0) {
      result.push(nextDispersingPheromones[pherType]);
    }
  }
  // console.log(result);
  if (result.length > 0) {
    postMessage({ type: 'PHEROMONES', result: result });
  }
};

/**
 * use queue to continuously find neighbors and set their pheromone
 * value to decayAmount less, if that is greater than its current value
 */
var floodFillPheromone = function floodFillPheromone(game, pheromoneType, playerID, posQueue, partialResults) {
  var resultPositions = _extends({}, partialResults);
  var config = globalConfig.pheromones[pheromoneType];

  while (posQueue.length > 0) {
    var _posQueue$shift = posQueue.shift(),
        position = _posQueue$shift.position,
        quantity = _posQueue$shift.quantity;

    var isOccupied = isPositionBlockingPheromone(game, pheromoneType, position);
    if ((!isOccupied || config.canInhabitBlocker) && getPheromoneAtPosition(game, position, pheromoneType, playerID) < quantity) {
      setPheromone(game, position, pheromoneType, quantity, playerID);
      resultPositions[encodePosition(position)] = { pheromoneType: pheromoneType, quantity: quantity, playerID: playerID };

      var neighborPositions = getNeighborPositions(game, { position: position }, false /* internal */);
      var decayAmount = config.decayAmount;
      var amount = Math.max(0, quantity - decayAmount);

      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = neighborPositions[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var neighbor = _step3.value;

          if (isDiagonalMove(position, neighbor)) continue;
          var neighborAmount = getPheromoneAtPosition(game, neighbor, pheromoneType, playerID);
          var occupied = isPositionBlockingPheromone(game, pheromoneType, neighbor);
          if (amount > 0 && amount > neighborAmount && !occupied) {
            posQueue.push({ position: neighbor, quantity: amount });
          }
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }
    }

    // dispersing pheromones decay separately
    if (config.isDispersing) {
      var encodedPos = encodePosition(position);
      var _quantity2 = getPheromoneAtPosition(game, position, pheromoneType, playerID);
      if (_quantity2 > 0 && game.dispersingPheromonePositions[pheromoneType][encodedPos] == null) {
        game.dispersingPheromonePositions[pheromoneType][encodedPos] = {
          position: position, playerID: playerID, pheromoneType: pheromoneType, quantity: _quantity2
        };
      }
    }
  }
  return resultPositions;
};

/**
 * When a pheromoneBlocking entity is added into the grid, then it could close off
 * a path, requiring recalculation. So do:
 * Reverse flood fill where you start at the neighbors of the newly occupied position,
 * then 0 those positions out if they are bigger than all their neighbors,
 * then add THEIR non-zero neighbors to the queue and continue,
 * finally, re-do the flood fill on all the 0-ed out spaces in reverse order
 */
var reverseFloodFillPheromone = function reverseFloodFillPheromone(game, pheromoneType, playerID, posQueue) {
  var config = globalConfig.pheromones[pheromoneType];

  var resultPositions = [];
  var floodFillQueue = [];
  while (posQueue.length > 0) {
    var position = posQueue.shift();
    var amount = getPheromoneAtPosition(game, position, pheromoneType, playerID);
    var neighborAmount = getBiggestNeighborVal(game, position, pheromoneType, playerID);
    var maxAmount = config.quantity;
    var decayAmount = config.decayAmount;
    var shouldFloodFill = true;
    if (neighborAmount <= amount) {
      shouldFloodFill = false;
      setPheromone(game, position, pheromoneType, 0, playerID);
      resultPositions[encodePosition(position)] = { pheromoneType: pheromoneType, quantity: 0, playerID: playerID };
      var neighborPositions = getNeighborPositions(game, { position: position }, false /* internal */);
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = neighborPositions[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var neighbor = _step4.value;

          if (isDiagonalMove(position, neighbor)) continue;
          var _neighborAmount = getPheromoneAtPosition(game, neighbor, pheromoneType, playerID);
          if (_neighborAmount > 0 && _neighborAmount < maxAmount) {
            posQueue.push(neighbor);
          } else if (_neighborAmount == maxAmount) {
            // neighboring a pheromone source, so flood fill from here,
            // simpler than the block below this that computes neighbor positions for flood fill
            floodFillQueue.push({ position: position, quantity: maxAmount - decayAmount });
          }
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }
    }
    if (shouldFloodFill) {
      // if you aren't bigger than your biggest neighbor, then your value
      // is actually fine. So then add this position to the floodFillQueue
      // since it's right on the edge of the area that needs to be re-filled in
      var _neighborPositions = getNeighborPositions(game, { position: position }, false /* internal */);
      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = _neighborPositions[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var _neighbor = _step5.value;

          if (isDiagonalMove(position, _neighbor)) continue;
          var occupied = isPositionBlockingPheromone(game, pheromoneType, _neighbor);
          var quantity = Math.max(0, amount - decayAmount);
          if (quantity > 0 && !occupied) {
            floodFillQueue.push({ position: _neighbor, quantity: quantity });
          }
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5.return) {
            _iterator5.return();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
      }
    }
  }
  return floodFillPheromone(game, pheromoneType, playerID, floodFillQueue, resultPositions);
};

// fade pheromones that disperse
var updateDispersingPheromones = function updateDispersingPheromones(game, timeStamp) {
  var timeSinceLastTick = timeStamp - game.lastTime;
  var nextDispersingPheromones = {};
  for (var pherType in globalConfig.pheromones) {
    var pheromone = globalConfig.pheromones[pherType];
    if (pheromone.isDispersing) {
      nextDispersingPheromones[pherType] = {};
    }
  }

  var rate = globalConfig.config.dispersingPheromoneUpdateRate;
  var nextTurbines = {}; // as fluid pheromones move, update turbines here
  // map of entityID --> thetaSpeed
  var nextEntities = {}; // if fluids freeze into entities, record them here
  // map of encoded position --> {type, quantity}
  for (var _pherType in game.dispersingPheromonePositions) {
    var nextFluid = {}; // the algorithm for gravity with fluids will try to push
    // the same source position multiple times, so don't let it
    for (var encodedPosition in game.dispersingPheromonePositions[_pherType]) {
      var source = game.dispersingPheromonePositions[_pherType][encodedPosition];
      var position = source.position,
          playerID = source.playerID,
          pheromoneType = source.pheromoneType;

      var config = globalConfig.pheromones[pheromoneType];

      var pheromoneQuantity = getPheromoneAtPosition(game, position, pheromoneType, playerID);

      //////////////////////////////////////////////////////////////////////////////
      // check for phase change
      var heat = getTemperature(game, position);
      var sendToOtherPhase = 0;
      var phaseChangeTo = null;
      var changedPhase = false;
      var cooled = false;
      var originalPosition = _extends({}, source.position);
      if (config.combustionPoint && heat >= config.combustionPoint && pheromoneQuantity > 0) {
        phaseChangeTo = config.combustsTo;
        if (pheromoneQuantity < 1) {
          sendToOtherPhase = pheromoneQuantity;
        } else {
          sendToOtherPhase = config.combustionRate * pheromoneQuantity;
        }
        changedPhase = true;

        // add heat:
        var heatQuantity = globalConfig.pheromones['HEAT'].quantity;
        setPheromone(game, position, 'HEAT', heatQuantity, playerID);
        game.floodFillQueue.push({
          playerID: 0,
          pheromoneType: 'HEAT',
          position: position,
          quantity: heatQuantity
        });
        // nextDispersingPheromones['HEAT'][encodePosition(position)] = {
        //   ...source,
        //   pheromoneType: 'HEAT',
        //   position: {...position},
        //   quantity: heatQuantity,
        // };
      } else if (config.heatPoint && heat >= config.heatPoint && pheromoneQuantity > 0) {
        phaseChangeTo = config.heatsTo;
        if (pheromoneQuantity < 1) {
          sendToOtherPhase = pheromoneQuantity;
        } else {
          sendToOtherPhase = config.heatRate * pheromoneQuantity;
        }
        changedPhase = true;
      } else if (config.coolPoint && heat <= config.coolPoint && pheromoneQuantity > 0) {
        if (config.coolConcentration == null || pheromoneQuantity >= config.coolConcentration) {
          // console.log("cooling phase change at position", {...source.position});
          phaseChangeTo = config.coolsTo;
          if (pheromoneQuantity < 1) {
            sendToOtherPhase = pheromoneQuantity;
          } else {
            sendToOtherPhase = config.coolRate * pheromoneQuantity;
          }
          changedPhase = true;
          cooled = true;
        }
      }
      // set the value of this square to the amount sent to the other phase
      // OR if it's an entity, create it
      if (changedPhase) {
        if (config.coolsToEntity && cooled) {
          if (sendToOtherPhase > 0) {
            nextEntities[encodePosition(source.position)] = {
              type: phaseChangeTo,
              quantity: Math.round(sendToOtherPhase)
            };
          }
        } else {
          setPheromone(game, source.position, phaseChangeTo, sendToOtherPhase, playerID);
          nextDispersingPheromones[phaseChangeTo][encodePosition(source.position)] = _extends({}, source, { pheromoneType: phaseChangeTo, quantity: sendToOtherPhase });
        }

        // NOTE: I'm thinking of not doing it this way since it's complicated to send
        // the message for stuff to remove back and forth
        // // check if the ingredients are there for combinesTo and create that
        // // new thing
        // if (config.combinesTo != null) {
        //   const missingIngredients = true;
        //   for (const ingredient of config.combinesTo.ingredients) {
        //     if (ingredient.substance == 'ENTITY') {
        //       const entityType = ingredient.substance.type;
        //       for (const id of game[type]) {
        //         const ingEntity = game.entities[id];
        //         if (encodePosition(ingEntity.position) == encodePosition(source.position)) {
        //           missingIngredients = false;
        //           // TODO remove the coal
        //         }
        //       }
        //     } else if (ingredient.substance == 'PHEROMONE') {

        //     }
        //   }
        // }

        // then subtract the amount sent to the other phase from the amount we deal
        // with from now on
        pheromoneQuantity -= sendToOtherPhase;
      }
      //////////////////////////////////////////////////////////////////////////////


      // need to track if it became 0 on the last update and remove it now
      // (Can't remove it as soon as it becomes 0 or else we won't tell the client
      //  to also set itself to 0)
      if (!config.isFluid && pheromoneQuantity <= 0) {
        continue;
      }
      var decayRate = config.decayRate;
      if (decayRate == null) {
        decayRate = config.decayAmount;
      }
      // since we're only computed once every rate ticks, multiply here as if we had been
      // computing on every tick
      decayRate *= timeSinceLastTick / globalConfig.config.msPerTick;

      //////////////////////////////////////////////////////////////////////////////
      // Update fluids
      if (config.isFluid && (pheromoneQuantity > 0 || !changedPhase)) {
        var y = 1;
        if (config.isRising) {
          y = -1;
        }
        var positionBelow = add(position, { x: 0, y: y });
        var occupied = isPositionBlockingPheromone(game, pheromoneType, positionBelow);
        var diagonal = false;
        var leftOrRight = false;
        var pherBotLeft = 0;
        var pherBotRight = 0;
        if (occupied || getPheromoneAtPosition(game, positionBelow, pheromoneType, playerID) > config.quantity - 1) {
          var botLeft = add(position, { x: -1, y: y });
          var botRight = add(position, { x: 1, y: y });
          var botLeftOccupied = isPositionBlockingPheromone(game, pheromoneType, botLeft);
          var botRightOccupied = isPositionBlockingPheromone(game, pheromoneType, botRight);
          if (!botLeftOccupied && !botRightOccupied) {
            var leftPher = getPheromoneAtPosition(game, botLeft, pheromoneType, playerID);
            var rightPher = getPheromoneAtPosition(game, botRight, pheromoneType, playerID);
            positionBelow = leftPher > rightPher ? botRight : botLeft;
            positionBelow = leftPher == rightPher ? oneOf([botLeft, botRight]) : positionBelow;
            // positionBelow = oneOf([botLeft, botRight]);
            occupied = false;
            diagonal = true;
          } else if (!botLeftOccupied) {
            positionBelow = botLeft;
            occupied = false;
            diagonal = true;
          } else if (!botRightOccupied) {
            positionBelow = botRight;
            occupied = false;
            diagonal = true;
          }
          // else check the pheromone values at the diagonal
          pherBotLeft = getPheromoneAtPosition(game, botLeft, pheromoneType, playerID);
          pherBotRight = getPheromoneAtPosition(game, botRight, pheromoneType, playerID);
          if (pherBotLeft > config.quantity - 1 && pherBotRight > config.quantity - 1) {
            occupied = true;
          }
        }
        var pheromoneDiag = getPheromoneAtPosition(game, positionBelow, pheromoneType, playerID);
        if (occupied && (!diagonal || pherBotLeft > config.quantity - 1 || pherBotRight > config.quantity - 1)) {
          var left = add(position, { x: -1, y: 0 });
          var right = add(position, { x: 1, y: 0 });
          var leftOccupied = isPositionBlockingPheromone(game, pheromoneType, left);
          var rightOccupied = isPositionBlockingPheromone(game, pheromoneType, right);
          if (!leftOccupied && !rightOccupied) {
            var _leftPher = getPheromoneAtPosition(game, left, pheromoneType, playerID);
            var _rightPher = getPheromoneAtPosition(game, right, pheromoneType, playerID);
            positionBelow = _leftPher > _rightPher ? right : left;
            positionBelow = _leftPher == _rightPher ? oneOf([left, right]) : positionBelow;
            // positionBelow = oneOf([left, right]);
            occupied = false;
            leftOrRight = true;
          } else if (!leftOccupied) {
            positionBelow = left;
            occupied = false;
            leftOrRight = true;
          } else if (!rightOccupied) {
            positionBelow = right;
            occupied = false;
            leftOrRight = true;
          }
          // don't spread left/right to a higher concentration
          // if (leftOrRight) {
          //   const leftRightQuantity =
          //     getPheromoneAtPosition(game, positionBelow, pheromoneType, playerID);
          //   if (leftRightQuantity + 1 >= pheromoneQuantity) {
          //     occupied = true;
          //     leftOrRight = false;
          //   }
          // }
        }
        if (!occupied) {
          var pheromoneBelow = getPheromoneAtPosition(game, positionBelow, pheromoneType, playerID);
          var maxQuantity = config.quantity;

          var targetPercentLeft = config.viscosity.verticalLeftOver;
          if (diagonal) {
            targetPercentLeft = config.viscosity.diagonalLeftOver;
          }
          if (leftOrRight) {
            targetPercentLeft = config.viscosity.horizontalLeftOver;
          }

          var pherToGive = pheromoneQuantity * (1 - targetPercentLeft);
          if (pheromoneBelow + pherToGive > maxQuantity) {
            pherToGive = maxQuantity - pheromoneBelow;
          }

          // check for turbines that should be spun
          if (!diagonal) {
            var _iteratorNormalCompletion6 = true;
            var _didIteratorError6 = false;
            var _iteratorError6 = undefined;

            try {
              for (var _iterator6 = game.TURBINE[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                var turbineID = _step6.value;

                var turbine = game.entities[turbineID];
                // if source.position and positionBelow are both inside the turbine
                // then set its speed to be pherToGive / maxQuantity * maxThetaSpeed
                var turbinePositions = getEntityPositions(game, turbine);
                var positionBelowInside = false;
                var positionInside = false;
                var _iteratorNormalCompletion7 = true;
                var _didIteratorError7 = false;
                var _iteratorError7 = undefined;

                try {
                  for (var _iterator7 = turbinePositions[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                    var pos = _step7.value;

                    if (equals(pos, positionBelow)) positionBelowInside = true;
                    if (equals(pos, source.position)) positionInside = true;
                  }
                } catch (err) {
                  _didIteratorError7 = true;
                  _iteratorError7 = err;
                } finally {
                  try {
                    if (!_iteratorNormalCompletion7 && _iterator7.return) {
                      _iterator7.return();
                    }
                  } finally {
                    if (_didIteratorError7) {
                      throw _iteratorError7;
                    }
                  }
                }

                if (!positionBelowInside || !positionInside) continue;

                if (!nextTurbines[turbineID]) nextTurbines[turbineID] = 0;
                var dirTheta = vectorTheta(subtract(source.position, positionBelow));
                var dir = dirTheta > 0 ? 1 : -1;

                // decrease amount of pheromone travelling in this direction
                if (pherToGive > 1) {
                  pherToGive = pherToGive - pherToGive * 0.2;
                } else {
                  dir = 0;
                }
                nextTurbines[turbineID] += dir * pherToGive / maxQuantity * turbine.maxThetaSpeed;
              }
            } catch (err) {
              _didIteratorError6 = true;
              _iteratorError6 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion6 && _iterator6.return) {
                  _iterator6.return();
                }
              } finally {
                if (_didIteratorError6) {
                  throw _iteratorError6;
                }
              }
            }
          }

          var leftOverPheromone = pheromoneQuantity - pherToGive;
          // fluids only decay in very small concentrations
          if (leftOverPheromone > 1) {
            decayRate = 0;
          }

          // set pheromone at this position to the left over that couldn't fall down
          setPheromone(game, position, pheromoneType, leftOverPheromone - decayRate, playerID);

          // if (!nextFluid[encodePosition(position)]) {
          var nextQuantity = Math.max(0, leftOverPheromone - decayRate);
          if (nextQuantity != 0 || source.quantity != 0) {
            nextDispersingPheromones[pheromoneType][encodePosition(position)] = _extends({}, source, {
              position: _extends({}, position),
              quantity: nextQuantity
            });
            nextFluid[encodePosition(position)] = true;
          }
          // }

          pheromoneQuantity = pheromoneQuantity - leftOverPheromone + pheromoneBelow;
          // update the source to be the next position
          source.position = positionBelow;
        }
      }
      //////////////////////////////////////////////////////////////////////////////


      // fluids only decay in very small concentrations
      if (config.isFluid && pheromoneQuantity > 0.5 && pheromoneType != 'HOT_OIL') {
        decayRate = 0;
      }

      var finalPherQuantity = Math.max(0, pheromoneQuantity - decayRate);
      setPheromone(game, source.position, pheromoneType, finalPherQuantity, playerID);

      if (config.isFluid && !changedPhase) {
        if (finalPherQuantity - decayRate > 0) {
          nextFluid[encodePosition(source.position)] = true;
          nextDispersingPheromones[pheromoneType][encodePosition(source.position)] = _extends({}, source, { quantity: finalPherQuantity });
        }
      } else {
        nextDispersingPheromones[pheromoneType][encodePosition(source.position)] = _extends({}, source, { quantity: finalPherQuantity });
      }
    }
  }
  // console.log(nextDispersingPheromones);
  game.dispersingPheromonePositions = nextDispersingPheromones;

  // send turbines messages
  var _iteratorNormalCompletion8 = true;
  var _didIteratorError8 = false;
  var _iteratorError8 = undefined;

  try {
    for (var _iterator8 = game.TURBINE[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
      var _turbineID = _step8.value;

      if (nextTurbines[_turbineID] != null) {
        postMessage({
          type: 'TURBINES',
          entityID: _turbineID,
          thetaSpeed: nextTurbines[_turbineID]
        });
      }
    }

    // send entity messages
  } catch (err) {
    _didIteratorError8 = true;
    _iteratorError8 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion8 && _iterator8.return) {
        _iterator8.return();
      }
    } finally {
      if (_didIteratorError8) {
        throw _iteratorError8;
      }
    }
  }

  if (Object.keys(nextEntities).length > 0) {
    postMessage({
      type: 'ENTITIES',
      entities: nextEntities
    });
  }

  return nextDispersingPheromones;
};

},{"./config":1,"./selectors/neighbors":23,"./selectors/pheromones":24,"./simulation/entityOperations":27,"./simulation/pheromones":28,"./utils/gridHelpers":29,"./utils/helpers":30,"./utils/stochastic":31,"./utils/vectors":32}],17:[function(require,module,exports){
'use strict';

var _require = require('../entities/registry'),
    Entities = _require.Entities;

/**
 * Property creation checklist:
 *  - add the property here keyed by type
 *  - add the update function to the tickReducer
 */

var Properties = {
  // entities with actions queued right now
  ACTOR: true,

  // entities that emit a pheromone
  PHEROMONE_EMITTER: true,

  // entities that explode when they die
  EXPLOSIVE: true,

  // entities that don't animate every tick
  NOT_ANIMATED: true,

  // entities that use the tiled spritesheets
  TILED: true
};

module.exports = {
  Properties: Properties
};
},{"../entities/registry":11}],18:[function(require,module,exports){
'use strict';

var _require = require('../utils/vectors'),
    subtract = _require.subtract,
    add = _require.add,
    makeVector = _require.makeVector,
    vectorTheta = _require.vectorTheta,
    round = _require.round,
    rotate = _require.rotate,
    floor = _require.floor;

var _require2 = require('../utils/gridHelpers'),
    lookupInGrid = _require2.lookupInGrid,
    getEntityPositions = _require2.getEntityPositions,
    getPheromonesInCell = _require2.getPheromonesInCell;

var _require3 = require('./renderHealthBar'),
    renderHealthBar = _require3.renderHealthBar;

var _require4 = require('../utils/helpers'),
    thetaToDir = _require4.thetaToDir;

var renderAgent = function renderAgent(ctx, game, agent, spriteRenderFn) {
  ctx.save();

  // render relative to top left of grid square,
  // but first translate for rotation around the center
  // NOTE: to support NxM entities, width/height assumes an up-down orientation,
  // so when the agent is left-right, flip width and height
  var dir = thetaToDir(agent.theta);
  var width = dir == 'left' || dir == 'right' ? agent.height : agent.width;
  var height = dir == 'left' || dir == 'right' ? agent.width : agent.height;
  ctx.translate(agent.position.x + width / 2, agent.position.y + height / 2);
  ctx.rotate(agent.theta - Math.PI / 2);
  ctx.translate(-agent.width / 2, -agent.height / 2);

  // render the specific agent here:
  spriteRenderFn(ctx, game, agent);

  ctx.translate(width / 2, height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.translate(-width / 2, -height / 2);

  // render hp bar
  if (agent.maxHP != null && Math.ceil(agent.hp) < agent.maxHP) {
    renderHealthBar(ctx, agent, agent.maxHP);
  }

  ctx.restore();

  if (game.showAgentDecision && agent.decisions != null) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = agent.decisions[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var decision = _step.value;
        var position = decision.position,
            score = decision.score,
            chosen = decision.chosen;
        var x = position.x,
            y = position.y;

        if (chosen) {
          ctx.strokeStyle = 'red';
          ctx.strokeRect(x, y, 1, 1);
        }
        ctx.strokeStyle = 'black';
        ctx.fillStyle = 'black';
        ctx.font = '1px sans serif';
        ctx.fillText(parseInt(score), x, y + 1, 1);
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  }
};

module.exports = { renderAgent: renderAgent };
},{"../utils/gridHelpers":29,"../utils/helpers":30,"../utils/vectors":32,"./renderHealthBar":19}],19:[function(require,module,exports){
'use strict';

var _require = require('../utils/vectors'),
    subtract = _require.subtract,
    add = _require.add,
    makeVector = _require.makeVector,
    vectorTheta = _require.vectorTheta;

var _require2 = require('../utils/gridHelpers'),
    lookupInGrid = _require2.lookupInGrid;

var renderHealthBar = function renderHealthBar(ctx, entity, maxHealth) {

  var renderHP = Math.ceil(entity.hp);
  if (renderHP == maxHealth) return;

  ctx.save();
  // always render healthbar above entity no matter its theta
  ctx.translate(entity.width / 2, entity.height / 2);
  ctx.rotate(-entity.theta);
  ctx.translate(-entity.width / 2, -entity.height / 2);

  var barWidth = 1.5;
  var barHeight = 0.20;
  if (entity.prevHP >= renderHP + 1 && entity.prevHPAge < 6) {
    var redWidth = entity.prevHP / maxHealth * barWidth;
    ctx.fillStyle = 'red';
    ctx.fillRect(-0.25, -0.2, redWidth, barHeight);
  }

  ctx.fillStyle = 'green';
  var healthWidth = Math.max(renderHP / maxHealth * barWidth, 0);
  ctx.fillRect(-0.25, -0.2, healthWidth, barHeight);

  ctx.strokeStyle = 'black';
  ctx.strokeRect(-0.25, -0.2, barWidth, barHeight);

  ctx.restore();
};

module.exports = { renderHealthBar: renderHealthBar };
},{"../utils/gridHelpers":29,"../utils/vectors":32}],20:[function(require,module,exports){
'use strict';

var _require = require('../selectors/sprites'),
    getSegmentSprite = _require.getSegmentSprite,
    getSegmentHead = _require.getSegmentHead,
    getSegmentTail = _require.getSegmentTail,
    getDeadSegmentSprite = _require.getDeadSegmentSprite,
    getDeadSegmentHead = _require.getDeadSegmentHead,
    getDeadSegmentTail = _require.getDeadSegmentTail;

var _require2 = require('./renderHealthBar'),
    renderHealthBar = _require2.renderHealthBar;

var _require3 = require('../utils/vectors'),
    subtract = _require3.subtract,
    add = _require3.add,
    makeVector = _require3.makeVector,
    vectorTheta = _require3.vectorTheta;

var _require4 = require('../selectors/misc'),
    onScreen = _require4.onScreen;

var renderSegmented = function renderSegmented(ctx, game, entity) {
  ctx.save();

  // render head:
  var headObj = getSegmentHead(game, entity);
  ctx.drawImage(headObj.img, headObj.x, headObj.y, headObj.width, headObj.height, 0, 0, 1, 1);

  // undo the rotation so the segments end up in the right place
  var width = 1;
  var height = 1;
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-1 * (entity.theta - Math.PI / 2));
  ctx.translate(-width / 2, -height / 2);

  // render segments:
  for (var i = 0; i < entity.segments.length - 1; i++) {
    var segment = entity.segments[i];
    if (!onScreen(game, { position: segment.position, width: 1, height: 1 })) continue;
    var obj = getSegmentSprite(game, entity, segment);
    var segPos = subtract(segment.position, entity.position);
    ctx.save();
    ctx.translate(segPos.x + 0.5, segPos.y + 0.5);
    ctx.rotate(segment.theta + Math.PI / 2);
    ctx.translate(-0.5, -0.5);
    ctx.drawImage(obj.img, obj.x, obj.y, obj.width, obj.height, 0, 0, 1, 1);
    ctx.restore();
  }

  // render tail segment:
  var tail = entity.segments[entity.segments.length - 1];
  var tailObj = getSegmentTail(game, entity, tail);
  var tailPos = subtract(tail.position, entity.position);
  ctx.save();
  ctx.translate(tailPos.x + 0.5, tailPos.y + 0.5);
  ctx.rotate(tail.theta - Math.PI / 2);
  ctx.translate(-0.5, -0.5);
  ctx.drawImage(tailObj.img, tailObj.x, tailObj.y, tailObj.width, tailObj.height, 0, 0, 1, 1);
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
};

////////////////////////////////////////////////////////////////
// Canvas
////////////////////////////////////////////////////////////////

var renderWormCanvas = function renderWormCanvas(ctx, game, dims, entity) {
  ctx.save();
  ctx.translate(entity.position.x, entity.position.y);
  ctx.fillStyle = 'pink';
  if (entity.type == 'CENTIPEDE') {
    ctx.fillStyle = 'white';
  }
  // head
  var nextSegment = entity.segments[0];
  var headDir = vectorTheta(subtract(entity.position, nextSegment.position));
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
  for (var i = 0; i < entity.segments.length - 1; i++) {
    var segment = entity.segments[i];
    var _relPos = subtract(segment.position, entity.position);
    if (onMinimapSmall(dims, { position: segment.position, width: 1, height: 1 })) {
      ctx.fillRect(_relPos.x, _relPos.y, 1, 1);
    }
  }
  // tail
  var tail = entity.segments[entity.segments.length - 1];
  var relPos = subtract(tail.position, entity.position);
  var prevTail = entity.segments[entity.segments.length - 2];
  var tailDir = vectorTheta(subtract(tail.position, prevTail.position));
  ctx.save();
  ctx.translate(relPos.x + 0.5, relPos.y + 0.5);
  ctx.rotate(tailDir - Math.PI / 2);
  ctx.translate(-1 * (relPos.x + 0.5), -1 * (relPos.y + 0.5));
  if (onMinimapSmall(dims, { position: tail.position, width: 1, height: 1 })) {
    ctx.fillRect(relPos.x, relPos.y, 1, 0.5);
    ctx.beginPath();
    ctx.arc(relPos.x + 0.5, relPos.y + 0.5, 0.5, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  ctx.restore();
};

var onMinimapSmall = function onMinimapSmall(dims, entity) {
  var viewPos = dims.viewPos,
      viewWidth = dims.viewWidth,
      viewHeight = dims.viewHeight;
  var position = entity.position,
      width = entity.width,
      height = entity.height;
  var x = position.x,
      y = position.y;


  return x >= viewPos.x && y >= viewPos.y && x + width <= viewWidth + viewPos.x && y + height <= viewHeight + viewPos.y;
};

module.exports = {
  renderSegmented: renderSegmented,
  renderWormCanvas: renderWormCanvas
};
},{"../selectors/misc":22,"../selectors/sprites":25,"../utils/vectors":32,"./renderHealthBar":19}],21:[function(require,module,exports){
'use strict';

var _require = require('../utils/gridHelpers'),
    lookupInGrid = _require.lookupInGrid,
    getEntityPositions = _require.getEntityPositions;

var collides = function collides(game, entityA, entityB) {
  return collidesWith(game, entityA).filter(function (e) {
    return e.id === entityB.id;
  }).length > 0;
};

var collidesWith = function collidesWith(game, entity, blockingTypes) {
  var positions = getEntityPositions(game, entity);

  var collisions = [];
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = positions[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var pos = _step.value;

      var thisCell = collisionsAtSpace(game, entity, blockingTypes, pos);
      collisions.push.apply(collisions, thisCell);
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return collisions;
};

// use special logic to see what is considered a collision at a given space
var collisionsAtSpace = function collisionsAtSpace(game, entity, blockingTypes, pos, neighbor) {
  if (entity == null) return [];
  var collisions = lookupInGrid(game.grid, pos).map(function (id) {
    return game.entities[id];
  }).filter(function (e) {
    return e != null && e.id != entity.id;
  }).filter(function (e) {
    // ant colliding with ant is more complicated:
    if (e.type == 'ANT' && entity.type == 'ANT' && blockingTypes.includes('ANT')) {
      // blocked by enemy ants
      if (e.playerID != entity.playerID) {
        return true;
      }

      // not blocked if holding stuff
      if (entity.holding != null && e.holding == null) {
        // || e.holding != null) {
        return false;
      }
    }
    return blockingTypes.includes(e.type);
  });
  return collisions;
};

module.exports = {
  collides: collides,
  collidesWith: collidesWith,
  collisionsAtSpace: collisionsAtSpace
};
},{"../utils/gridHelpers":29}],22:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _require = require('../utils/gridHelpers'),
    lookupInGrid = _require.lookupInGrid,
    getEntityPositions = _require.getEntityPositions,
    entityInsideGrid = _require.entityInsideGrid;

var _require2 = require('../utils/helpers'),
    thetaToDir = _require2.thetaToDir,
    isDiagonalMove = _require2.isDiagonalMove;

var _require3 = require('../selectors/collisions'),
    collidesWith = _require3.collidesWith;

var _require4 = require('../selectors/neighbors'),
    getFreeNeighborPositions = _require4.getFreeNeighborPositions;

var _require5 = require('../utils/vectors'),
    add = _require5.add,
    makeVector = _require5.makeVector,
    subtract = _require5.subtract,
    vectorTheta = _require5.vectorTheta,
    round = _require5.round,
    ceil = _require5.ceil,
    containsVector = _require5.containsVector;

var _require6 = require('../simulation/actionQueue'),
    makeAction = _require6.makeAction;

var onScreen = function onScreen(game, entity) {
  var viewPos = game.viewPos,
      viewWidth = game.viewWidth,
      viewHeight = game.viewHeight;
  var position = entity.position,
      width = entity.width,
      height = entity.height;
  var x = position.x,
      y = position.y;


  if (!game.maxMinimap) {
    return x + width >= viewPos.x - 1 && y + height >= viewPos.y - 1 && x <= viewWidth + viewPos.x + 1 && y <= viewHeight + viewPos.y + 1;
  } else {
    return x >= viewPos.x && y >= viewPos.y && x + width <= viewWidth + viewPos.x && y + height <= viewHeight + viewPos.y;
  }
};

// NOTE: outside of entity
var getPositionsInFront = function getPositionsInFront(game, entity) {
  var dimension = entity.width;
  if (entity.height > entity.width) {
    dimension = entity.height;
  }
  var magnitude = entity.theta < Math.PI * 0.9 ? -1 : -1 * dimension;
  var positions = [];
  for (var x = 0; x < entity.width; x++) {
    var neighborVec = { x: x, y: 0 };
    if (thetaToDir(entity.theta) == 'left' || thetaToDir(entity.theta) == 'right') {
      neighborVec = { x: 0, y: x };
    }
    // HACK: facing up-left or up-right diagonally causes the positions-in-front to be inside
    // BUT only the y-axis is off
    var roundingFn = Math.round;
    if (entity.theta > Math.PI) {
      roundingFn = Math.ceil;
    }

    var posSum = add(add(neighborVec, entity.position), makeVector(entity.theta, magnitude));
    positions.push({ x: Math.round(posSum.x), y: roundingFn(posSum.y) });
  }
  return positions;
};

// NOTE: outside of entity
var getPositionsBehind = function getPositionsBehind(game, entity) {
  if (entity.segmented) {
    var tailPos = entity.segments[entity.segments.length - 1].position;
    var segBeforeTailPos = entity.segments.length > 1 ? entity.segments[entity.segments.length - 2].position : entity.position;
    var theta = vectorTheta(subtract(segBeforeTailPos, tailPos));
    var behindPos = add(tailPos, makeVector(theta, -1));
    return [behindPos];
  }
  var dir = thetaToDir(entity.theta);
  var x = 0;
  var y = entity.height + 1;
  if (dir == 'left' || dir == 'leftdown' || dir == 'leftup') {
    x = -entity.height - 1;
  }
  if (dir == 'right' || dir == 'rightdown' || dir == 'rightup') {
    x = entity.height + 1;
  }
  if (dir == 'up' || dir == 'rightup' || dir == 'leftup') {
    y = -entity.height - 1;
  }
  if (dir == 'leftup' || dir == 'leftdown') {
    x += 1;
  }
  if (dir == 'left' || dir == 'right') {
    y = 0;
  }
  var offset = { x: x, y: y };
  return getPositionsInFront(game, entity).map(function (p) {
    return subtract(p, offset);
  });
};

var isFacing = function isFacing(entity, position) {
  var nextDir = thetaToDir(vectorTheta(subtract(entity.position, position)));
  return nextDir == thetaToDir(entity.theta);
};

var canDoMove = function canDoMove(game, entity, nextPos) {
  if (!entityInsideGrid(game, _extends({}, entity, { position: nextPos }))) {
    return { result: false, reason: 'OUTSIDE_GRID' };
  }

  if (entity.segmented && isDiagonalMove(entity.position, nextPos)) {
    return { result: false, reason: 'SEGMENTED_DIAGONAL' };
  }

  var blockers = entity.blockingTypes;
  var freeInternalNeighbors = getFreeNeighborPositions(game, entity, blockers);
  if (!containsVector(freeInternalNeighbors, nextPos) || collidesWith(game, _extends({}, entity, { position: nextPos }), blockers).length > 0) {
    return { result: false, reason: 'BLOCKED' };
  }

  // CAN do the move even if not facing
  // if (!isFacing(entity, nextPos)) {
  //   return false;
  // }

  return { result: true };
};

/**
 *  Returns the entityAction the controlled Entity would do if
 *  you pressed E right now
 */
var getControlledEntityInteraction = function getControlledEntityInteraction(game, agent) {
  // PUTDOWN if holding
  if (agent.holding != null) {
    return makeAction(game, agent, 'PUTDOWN', null);
  }
  var positionsInFront = getPositionsInFront(game, agent);
  // PICKUP if there's something to pick up
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = positionsInFront[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var pickupPos = _step.value;

      var pickup = lookupInGrid(game.grid, pickupPos).map(function (id) {
        return game.entities[id];
      }).filter(function (e) {
        return agent.pickupTypes.includes(e.type);
      })[0];
      if (pickup != null) {
        return makeAction(game, agent, 'PICKUP', { pickup: pickup, position: pickupPos });
      }
    }

    // else return PICKUP by default
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return makeAction(game, agent, 'PICKUP', { pickup: null, position: positionsInFront[0] });
};

var getManningAction = function getManningAction(game) {
  var controlledEntity = game.controlledEntity;
  var entityAction = null;
  var entity = controlledEntity;
  if (!controlledEntity.MANNED) {
    var entityToMan = null;

    var positionsInFront = getPositionsInFront(game, controlledEntity);
    // PICKUP if there's something to pick up
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = positionsInFront[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var pos = _step2.value;

        var couldMan = lookupInGrid(game.grid, pos).map(function (id) {
          return game.entities[id];
        }).filter(function (e) {
          return e.MANNED;
        })[0];
        if (couldMan) {
          entityToMan = couldMan;
          break;
        }
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }

    if (entityToMan) {
      entityAction = makeAction(game, controlledEntity, 'MAN', entityToMan);
    }
  }

  if (controlledEntity.MANNED && controlledEntity.riders.length > 0) {
    entityAction = makeAction(game, controlledEntity.riders[0], 'UN_MAN', controlledEntity);
    entity = controlledEntity.riders[0];
  }

  return { entity: entity, entityAction: entityAction };
};

module.exports = {
  onScreen: onScreen,
  getPositionsInFront: getPositionsInFront,
  getPositionsBehind: getPositionsBehind,
  isFacing: isFacing,
  canDoMove: canDoMove,
  getControlledEntityInteraction: getControlledEntityInteraction,
  getManningAction: getManningAction
};
},{"../selectors/collisions":21,"../selectors/neighbors":23,"../simulation/actionQueue":26,"../utils/gridHelpers":29,"../utils/helpers":30,"../utils/vectors":32}],23:[function(require,module,exports){
'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var _require = require('../utils/vectors'),
    equals = _require.equals,
    add = _require.add,
    subtract = _require.subtract,
    containsVector = _require.containsVector;

var _require2 = require('../utils/gridHelpers'),
    lookupInGrid = _require2.lookupInGrid,
    insideGrid = _require2.insideGrid,
    getEntityPositions = _require2.getEntityPositions;

var _require3 = require('../selectors/collisions'),
    collidesWith = _require3.collidesWith,
    collisionsAtSpace = _require3.collisionsAtSpace;

var getNeighborEntities = function getNeighborEntities(game, entity, external) {
  if (entity.position == null) return [];

  var neighborIDs = [];
  var neighborPositions = getNeighborPositions(game, entity, external);
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = neighborPositions[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var pos = _step.value;

      var entitiesInCell = lookupInGrid(game.grid, pos).filter(function (id) {
        return !neighborIDs.includes(id) && id != entity.id;
      });
      neighborIDs.push.apply(neighborIDs, _toConsumableArray(entitiesInCell));
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return neighborIDs.map(function (id) {
    return game.entities[id];
  });
};

var getNeighborEntitiesAndPosition = function getNeighborEntitiesAndPosition(game, entity) {
  if (entity.position == null) return [];

  var neighborObjs = [];
  var neighborPositions = getNeighborPositions(game, entity, true /* external */);
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = neighborPositions[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var pos = _step2.value;

      var entitiesInCell = lookupInGrid(game.grid, pos).filter(function (id) {
        return !neighborObjs.includes(id) && id != entity.id;
      });
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = entitiesInCell[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var id = _step3.value;

          neighborObjs.push({ entity: game.entities[id], position: pos });
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  return neighborObjs;
};

var areNeighbors = function areNeighbors(game, entityA, entityB) {
  if (entityA == null || entityB == null) return false;
  var aNeighbors = getNeighborEntities(game, entityA, true);
  return aNeighbors.filter(function (e) {
    return e.id === entityB.id;
  }).length > 0;
};

var getFreeNeighborPositions = function getFreeNeighborPositions(game, entity, blockingTypes, external) {
  var neighborPositions = getNeighborPositions(game, entity, external /* internal by default */);
  var freePositions = [];
  var _iteratorNormalCompletion4 = true;
  var _didIteratorError4 = false;
  var _iteratorError4 = undefined;

  try {
    for (var _iterator4 = neighborPositions[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
      var pos = _step4.value;

      var isOccupied = collisionsAtSpace(game, entity, blockingTypes, pos, true /*neighbor*/).length > 0;

      // const alreadyCollidesWith = collidesWith(game, entity, blockingTypes)
      //   .map(e => e.id);
      // const alreadyColliding = entitiesAtPos
      //   .filter(e => !alreadyCollidesWith.includes(e.id))
      //   .length > 0;
      if (!isOccupied) {
        freePositions.push(pos);
      }
    }
  } catch (err) {
    _didIteratorError4 = true;
    _iteratorError4 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion4 && _iterator4.return) {
        _iterator4.return();
      }
    } finally {
      if (_didIteratorError4) {
        throw _iteratorError4;
      }
    }
  }

  return freePositions;
};

/**
 * external means the neighbor positions should all be outside the entity,
 * regardless its size,
 * whereas !external means the directly-neighboring positions to the entity's
 * position value
 */
var getNeighborPositions = function getNeighborPositions(game, entity, external) {
  var positions = [];
  var neighbors = [
  // {x: -1, y: 0}, {x: 1, y: 0}, {x: 0, y: -1}, {x: 0, y: 1},
  { x: -1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 }];
  if (external) {
    var entityPositions = getEntityPositions(game, entity);
    var _iteratorNormalCompletion5 = true;
    var _didIteratorError5 = false;
    var _iteratorError5 = undefined;

    try {
      for (var _iterator5 = entityPositions[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
        var pos = _step5.value;
        var _iteratorNormalCompletion6 = true;
        var _didIteratorError6 = false;
        var _iteratorError6 = undefined;

        try {
          for (var _iterator6 = neighbors[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
            var n = _step6.value;

            var potentialNeighbor = add(n, pos);
            if (!containsVector(entityPositions, potentialNeighbor) && !containsVector(positions, potentialNeighbor) && insideGrid(game.grid, potentialNeighbor)) {
              positions.push(potentialNeighbor);
            }
          }
        } catch (err) {
          _didIteratorError6 = true;
          _iteratorError6 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion6 && _iterator6.return) {
              _iterator6.return();
            }
          } finally {
            if (_didIteratorError6) {
              throw _iteratorError6;
            }
          }
        }
      }
    } catch (err) {
      _didIteratorError5 = true;
      _iteratorError5 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion5 && _iterator5.return) {
          _iterator5.return();
        }
      } finally {
        if (_didIteratorError5) {
          throw _iteratorError5;
        }
      }
    }
  } else {
    var _iteratorNormalCompletion7 = true;
    var _didIteratorError7 = false;
    var _iteratorError7 = undefined;

    try {
      for (var _iterator7 = neighbors[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
        var _n = _step7.value;

        var _potentialNeighbor = add(entity.position, _n);
        if (insideGrid(game.grid, _potentialNeighbor)) {
          positions.push(_potentialNeighbor);
        }
      }
    } catch (err) {
      _didIteratorError7 = true;
      _iteratorError7 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion7 && _iterator7.return) {
          _iterator7.return();
        }
      } finally {
        if (_didIteratorError7) {
          throw _iteratorError7;
        }
      }
    }
  }

  return positions;
};

module.exports = {
  getNeighborPositions: getNeighborPositions,
  getNeighborEntities: getNeighborEntities,
  getNeighborEntitiesAndPosition: getNeighborEntitiesAndPosition,
  getFreeNeighborPositions: getFreeNeighborPositions,
  areNeighbors: areNeighbors
};
},{"../selectors/collisions":21,"../utils/gridHelpers":29,"../utils/vectors":32}],24:[function(require,module,exports){
'use strict';

var _require = require('../utils/vectors'),
    add = _require.add,
    multiply = _require.multiply,
    subtract = _require.subtract,
    equals = _require.equals,
    floor = _require.floor,
    containsVector = _require.containsVector;

var _require2 = require('../utils/helpers'),
    isDiagonalMove = _require2.isDiagonalMove;

var _require3 = require('../selectors/neighbors'),
    getNeighborPositions = _require3.getNeighborPositions;

var _require4 = require('../utils/gridHelpers'),
    lookupInGrid = _require4.lookupInGrid,
    getEntityPositions = _require4.getEntityPositions,
    insideGrid = _require4.insideGrid;

var globalConfig = require('../config');

var getPheromoneAtPosition = function getPheromoneAtPosition(game, position, type, playerID) {
  var grid = game.grid;

  if (!insideGrid(grid, position)) return 0;
  var x = position.x,
      y = position.y;

  try {
    return grid[x][y][playerID][type] || 0;
  } catch (ex) {
    return 0;
  }
};

var getTemperature = function getTemperature(game, position) {
  return getPheromoneAtPosition(game, position, 'HEAT', 0) - getPheromoneAtPosition(game, position, 'COLD', 0);
};

/**
 * When a position is opened up, get candidate {pos, quantity} based on the
 * pheromone value of the greatest neighbor OR
 * if this position is itself generating pheromones (because it's in a
 * token radius) then just return that value
 */
var getQuantityForStalePos = function getQuantityForStalePos(game, position, pheromoneType, playerID) {
  var relevantEmitters = lookupInGrid(game.grid, position).map(function (id) {
    return game.entities[id];
  }).filter(function (e) {
    return e.pheromoneType == pheromoneType;
  });
  if (relevantEmitters.length > 0) {
    var entity = relevantEmitters[0];
    if (entity.quantity > 0) {
      return {
        position: position,
        quantity: entity.quantity
      };
    }
  }

  var neighborPositions = getNeighborPositions(game, { position: position }, false /* internal */);
  var decayAmount = globalConfig.pheromones[pheromoneType].decayAmount;
  var quantity = 0;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = neighborPositions[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var pos = _step.value;

      if (isDiagonalMove(position, pos)) continue;
      var candidateAmount = getPheromoneAtPosition(game, pos, pheromoneType, playerID) - decayAmount;
      if (candidateAmount > quantity) {
        quantity = candidateAmount;
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return { position: position, quantity: quantity };
};

/**
 * If the given entity is a pheromone source, return it/any positions associated with
 * it that are also pheromone sources
 */
var getEntityPheromoneSources = function getEntityPheromoneSources(game, entity) {

  var pheromoneType = null;
  var playerID = null;
  var quantity = 0;

  if (entity.PHEROMONE_EMITTER) {
    return [{
      id: entity.id,
      playerID: entity.playerID || 0,
      pheromoneType: entity.pheromoneType,
      position: entity.position,
      quantity: entity.quantity
    }];
  }

  if (entity.holding != null && entity.holding.type == 'FOOD' && entity.task == 'RETURN') {
    pheromoneType = 'FOOD';
    playerID = entity.playerID;
    quantity = entity.foodPherQuantity || 0;
    if (quantity == 0) {
      return [];
    } else {
      return [{
        id: entity.id,
        playerID: playerID,
        pheromoneType: pheromoneType,
        position: entity.position,
        quantity: quantity
      }];
    }
  }
  return [];
};

/**
 *  Function used at the game start to populate the initial set of pheromones
 *  across all entities emitting pheromones of the given type and playerID
 */
var getSourcesOfPheromoneType = function getSourcesOfPheromoneType(game, pheromoneType, playerID) {
  var sources = [];
  for (var entityID in game.PHEROMONE_EMITTER) {
    var entity = game.entities[entityID];
    if (entity.pheromoneType != pheromoneType) continue;
    if (entity.playerID != playerID) continue;
    if (entity.quantity <= 0) continue;
    sources.push(entity);
  }
  return sources;
};

var isPositionBlockingPheromone = function isPositionBlockingPheromone(game, pheromoneType, position) {
  var config = globalConfig.pheromones[pheromoneType];
  var occupied = lookupInGrid(game.grid, position).map(function (id) {
    return game.entities[id];
  }).filter(function (e) {
    return e != null && config.blockingTypes.includes(e.type);
  }).length > 0;

  if (occupied) return true;
  if (config.blockingPheromones.length == 0) return false;

  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = config.blockingPheromones[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var blockingPher = _step2.value;

      if (getPheromoneAtPosition(game, position, blockingPher, 0) > 0) {
        return true;
      }
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  return false;
};

module.exports = {
  getPheromoneAtPosition: getPheromoneAtPosition,
  getTemperature: getTemperature,
  getSourcesOfPheromoneType: getSourcesOfPheromoneType,
  getEntityPheromoneSources: getEntityPheromoneSources,
  getQuantityForStalePos: getQuantityForStalePos,
  isPositionBlockingPheromone: isPositionBlockingPheromone
};
},{"../config":1,"../selectors/neighbors":23,"../utils/gridHelpers":29,"../utils/helpers":30,"../utils/vectors":32}],25:[function(require,module,exports){
'use strict';

var _require = require('../utils/vectors'),
    equals = _require.equals,
    add = _require.add,
    subtract = _require.subtract,
    magnitude = _require.magnitude,
    scale = _require.scale,
    vectorTheta = _require.vectorTheta,
    abs = _require.abs;

var _require2 = require('../simulation/actionQueue'),
    getDuration = _require2.getDuration,
    getFrame = _require2.getFrame;

var _require3 = require('../utils/gridHelpers'),
    lookupInGrid = _require3.lookupInGrid,
    getPheromonesInCell = _require3.getPheromonesInCell;

var _require4 = require('../selectors/neighbors'),
    getNeighborPositions = _require4.getNeighborPositions;

var _require5 = require('../selectors/misc'),
    getPositionsInFront = _require5.getPositionsInFront;

var _require6 = require('../utils/helpers'),
    thetaToDir = _require6.thetaToDir,
    closeTo = _require6.closeTo;

var globalConfig = require('../config');

var getInterpolatedPos = function getInterpolatedPos(game, entity) {
  var action = entity.actions[0];
  var pos = entity.position;
  if (action != null && !entity.stuck) {
    switch (action.type) {
      case 'MOVE_TURN':
      case 'MOVE':
        {
          var diff = subtract(entity.position, entity.prevPosition);
          var duration = getDuration(game, entity, action.type);
          var actionDuration = Math.min(duration, action.duration);
          var progress = (duration - actionDuration) / duration;
          pos = add(entity.prevPosition, scale(diff, progress));
          break;
        }
      case 'PUTDOWN':
      case 'PICKUP':
        {
          var posInFront = getPositionsInFront(game, entity)[0];
          var _diff = subtract(posInFront, entity.position);
          var _duration = getDuration(game, entity, action.type);
          var _progress = (_duration - Math.abs(_duration / 2 - action.duration)) / _duration;
          if (magnitude(_diff) > 1) {
            _progress *= 0.5;
          }
          pos = add(entity.position, scale(_diff, _progress));
          break;
        }
    }
  }
  return pos;
};

var getInterpolatedTheta = function getInterpolatedTheta(game, entity) {
  var action = entity.actions[0];
  var theta = entity.theta;
  if (action == null) return theta;
  switch (action.type) {
    case 'MOVE_TURN':
      {
        var diff = entity.theta - entity.prevTheta;
        if (Math.abs(diff) < 0.01) break;
        if (Math.abs(diff) > Math.PI) {
          var mult = diff < 0 ? 1 : -1;
          diff = mult * (2 * Math.PI - Math.abs(diff));
        }
        var duration = getDuration(game, entity, action.type);
        var progress = Math.max(0, (duration - action.duration / 3) / duration);
        theta = progress * diff + entity.prevTheta;
        break;
      }
    case 'TURN':
      {
        var _diff2 = entity.theta - entity.prevTheta;
        if (Math.abs(_diff2) > Math.PI) {
          var _mult = _diff2 < 0 ? 1 : -1;
          _diff2 = _mult * (2 * Math.PI - Math.abs(_diff2));
        }
        var _duration2 = getDuration(game, entity, action.type);
        var _progress2 = (_duration2 - (action.duration + 0)) / _duration2;
        theta = _progress2 * _diff2 + entity.prevTheta;
        break;
      }
  }
  return theta;
};

var getInterpolatedIndex = function getInterpolatedIndex(game, entity) {
  var action = entity.actions[0];
  if (action == null) return 0;

  var duration = getDuration(game, entity, action.type);
  return Math.max(duration - action.duration - 1, 0);
};

var getMaxFrameOffset = function getMaxFrameOffset(entity) {
  if (!entity.actions) return { maxFrameOffset: 0, frameStep: 0 };
  if (entity.actions.length == 0) return { maxFrameOffset: 0, frameStep: 0 };
  if (!entity.AGENT) return { maxFrameOffset: 0, frameStep: 0 };

  var actionType = entity.actions[0].type;
  return {
    maxFrameOffset: entity[actionType].maxFrameOffset || 0,
    frameStep: entity[actionType].frameStep || 0
  };
};

//////////////////////////////////////////////////////////////////////
// Turret-specific
//////////////////////////////////////////////////////////////////////

var getFastBarrelSprite = function getFastBarrelSprite(game, turret) {
  var width = 32;
  var height = 32;
  var index = getInterpolatedIndex(game, turret);
  var frame = getFrame(game, turret, index);

  var obj = {
    img: game.sprites.FAST_TURRET,
    x: width * (frame + 2),
    y: 0,
    width: width,
    height: height
  };

  return obj;
};

//////////////////////////////////////////////////////////////////////
// Missile-specific
//////////////////////////////////////////////////////////////////////

var getMissileSprite = function getMissileSprite(game, missile) {
  var width = 16;
  var height = 32;
  var img = game.sprites.MISSILE;
  if (missile.warhead != null && missile.warhead.type == 'NUKE') {
    img = game.sprites.NUKE_MISSILE;
  }
  if (missile.PIERCING) {
    img = game.sprites.BUNKER_BUSTER;
  }
  var dur = 6;
  var numFrames = 3;
  var index = Math.floor((missile.id + game.time) % (dur * numFrames) / dur);

  var obj = {
    img: img,
    x: index * width,
    y: 0,
    width: width,
    height: height
  };

  return obj;
};

//////////////////////////////////////////////////////////////////////
// Ant-specific
//////////////////////////////////////////////////////////////////////

var getAntSpriteAndOffset = function getAntSpriteAndOffset(game, ant) {
  var width = 32;
  var height = 32;
  var img = game.sprites.ANT;
  if (ant.playerID == 2) {
    img = game.sprites.RED_ANT;
  }

  var obj = {
    img: img,
    x: 0,
    y: 0,
    width: width,
    height: height
  };

  var index = getInterpolatedIndex(game, ant);
  if (ant.type == "DEAD_ANT") {
    index = ant.caste == 'YOUNG_QUEEN' ? 3 : 8;
    obj.x = index * width;
  } else if (ant.actions.length == 0) {
    return obj;
  } else {
    var frame = getFrame(game, ant, index);
    obj.x = frame * width;
  }

  return obj;
};

//////////////////////////////////////////////////////////////////////
// Pheromones
/////////////////////////////////////////////////////////////////////

var getPheromoneSprite = function getPheromoneSprite(game, position, playerID, pheromoneType) {
  var width = 16;
  var height = 16;
  var numFrames = 8;
  var img = game.sprites.PHEROMONE;
  var config = globalConfig.pheromones[pheromoneType];
  var quantity = getPheromonesInCell(game.grid, position, playerID)[pheromoneType];
  var progress = numFrames - Math.round(quantity / config.quantity * numFrames);
  var obj = {
    img: img,
    x: progress * width,
    y: config.tileIndex * height,
    width: width,
    height: height,
    theta: 0
  };

  if (quantity > config.quantity - config.decayAmount || pheromoneType == 'FOLLOW') {
    obj.x = 5;
    obj.y += 4;
    obj.width = 4;
    obj.height = 4;
    return obj;
  }

  var neighborPositions = getNeighborPositions(game, { position: position }, false /* internal */
  );
  var neighborAmount = 0;
  var neighborPosition = null;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = neighborPositions[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var pos = _step.value;

      var candidateAmount = getPheromonesInCell(game.grid, pos, playerID)[pheromoneType];
      if (candidateAmount > neighborAmount) {
        neighborAmount = candidateAmount;
        neighborPosition = pos;
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
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
};

//////////////////////////////////////////////////////////////////////
// Dirt/Food specific
/////////////////////////////////////////////////////////////////////
// indicies into the spritesheet
var tileDict = {
  'ltb': { x: 0, y: 1 },
  'rtb': { x: 2, y: 1 },
  'lrt': { x: 1, y: 0 },
  'lrb': { x: 1, y: 2 },
  't': { x: 3, y: 0 },
  'b': { x: 3, y: 2 },
  'l': { x: 4, y: 2 },
  'r': { x: 6, y: 2 },
  'tb': { x: 3, y: 1 },
  'lt': { x: 0, y: 0 },
  'lb': { x: 0, y: 2 },
  'rt': { x: 2, y: 0 },
  'rb': { x: 2, y: 2 },
  'lr': { x: 5, y: 2 }
};

var getTileSprite = function getTileSprite(game, entity) {
  var entityType = entity.type;
  if (entity.collectedAs != null) {
    entityType = entity.collectedAs;
  }
  var width = 16;
  var height = 16;
  var spriteType = entityType == 'STONE' ? entity.subType : entityType;
  spriteType = spriteType == null ? entityType : spriteType;
  if (entity.onFire) {
    spriteType = 'HOT_' + spriteType;
  }
  if (entity.type == 'GLASS') {
    spriteType = 'STEEL';
  }
  var img = game.sprites[spriteType];
  var obj = {
    img: img,
    x: 0,
    y: 0,
    width: width,
    height: height
  };
  var dictIndexStr = entity.dictIndexStr;

  if (dictIndexStr === '' || dictIndexStr == null) {
    obj.x = (4 + entity.id % 4) * width;
  } else if (dictIndexStr === 'lrtb') {
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
        obj.x = (4 + Math.round(Math.random() * 4) % 4) * width + 2;

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
    var _tileDict$dictIndexSt = tileDict[dictIndexStr],
        x = _tileDict$dictIndexSt.x,
        y = _tileDict$dictIndexSt.y;

    obj.x = x * width;
    obj.y = y * height;
  }

  return obj;
};

var hasNeighbor = function hasNeighbor(game, pos, type) {
  return lookupInGrid(game.grid, pos).map(function (id) {
    return game.entities[id];
  }).filter(function (e) {
    return e != null && e.type == type;
  }).length > 0;
};

var getDictIndexStr = function getDictIndexStr(game, entity) {
  var dictIndexStr = '';
  if (entity.position == null) return dictIndexStr;
  if (hasNeighbor(game, add(entity.position, { x: 1, y: 0 }), entity.type)) {
    dictIndexStr += 'l';
  }
  if (hasNeighbor(game, add(entity.position, { x: -1, y: 0 }), entity.type)) {
    dictIndexStr += 'r';
  }
  if (hasNeighbor(game, add(entity.position, { x: 0, y: 1 }), entity.type)) {
    dictIndexStr += 't';
  }
  if (hasNeighbor(game, add(entity.position, { x: 0, y: -1 }), entity.type)) {
    dictIndexStr += 'b';
  }
  return dictIndexStr;
};

//////////////////////////////////////////////////////////////////////
// Background
/////////////////////////////////////////////////////////////////////

var getBackgroundSprite = function getBackgroundSprite(game, entity) {
  var width = 100;
  var height = 50;
  var img = game.sprites[entity.name];
  var obj = {
    img: img,
    x: 0,
    y: 0,
    width: 1,
    height: 1
  };

  obj.x = entity.position.x;
  obj.y = entity.position.y;

  return obj;
};

//////////////////////////////////////////////////////////////////////
// Segmented Critters
/////////////////////////////////////////////////////////////////////

// sprites for each segment
var segmentConfig = {
  straight: 1,
  corner: 7,
  tail: 0
};

var getSegmentSprite = function getSegmentSprite(game, entity, segment) {
  var img = game.sprites[entity.type];
  var obj = {
    img: img,
    x: 0,
    y: 0,
    width: 16,
    height: 16
  };

  var index = getInterpolatedIndex(game, entity);
  var frame = 0;
  if (entity.actions.length > 0 && entity.actions[0].type != 'BITE') {
    frame = getFrame(game, entity, index);
  }

  if (frame == 0) {
    frame = segmentConfig[segment.segmentType];
    if (!segment.segmentType) {
      frame = 1;
    }
  } else if (segment.segmentType == 'corner') {
    var diff = segmentConfig.corner - segmentConfig.straight;
    frame += diff;
  }

  obj.x = frame * obj.width;

  return obj;
};

var getSegmentHead = function getSegmentHead(game, entity) {
  var img = game.sprites[entity.type];
  var obj = {
    img: img,
    x: 0,
    y: 0,
    width: 16,
    height: 16
  };

  var index = getInterpolatedIndex(game, entity);
  var frame = 0;
  if (entity.actions.length > 0 && entity.actions[0].type == 'BITE') {
    frame = getFrame(game, entity, index);
  }
  obj.x = frame * obj.width;

  return obj;
};

var getSegmentTail = function getSegmentTail(game, entity, segment) {
  if (entity.type == 'CENTIPEDE') {
    return getSegmentSprite(game, entity, segment);
  } else {
    return getSegmentHead(game, entity, segment);
  }
};

module.exports = {
  getInterpolatedPos: getInterpolatedPos,
  getInterpolatedTheta: getInterpolatedTheta,
  getInterpolatedIndex: getInterpolatedIndex,
  getAntSpriteAndOffset: getAntSpriteAndOffset,
  getTileSprite: getTileSprite,
  getMissileSprite: getMissileSprite,
  getFastBarrelSprite: getFastBarrelSprite,
  getPheromoneSprite: getPheromoneSprite,
  getDictIndexStr: getDictIndexStr,
  getBackgroundSprite: getBackgroundSprite,
  getMaxFrameOffset: getMaxFrameOffset,
  getSegmentSprite: getSegmentSprite,
  getSegmentHead: getSegmentHead,
  getSegmentTail: getSegmentTail
};
},{"../config":1,"../selectors/misc":22,"../selectors/neighbors":23,"../simulation/actionQueue":26,"../utils/gridHelpers":29,"../utils/helpers":30,"../utils/vectors":32}],26:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _require = require('../utils/helpers'),
    closeTo = _require.closeTo,
    isDiagonalTheta = _require.isDiagonalTheta,
    thetaToDir = _require.thetaToDir;

var _require2 = require('../selectors/pheromones'),
    getPheromoneAtPosition = _require2.getPheromoneAtPosition;

var _require3 = require('../utils/vectors'),
    floor = _require3.floor,
    ceil = _require3.ceil;

// -----------------------------------------------------------------------
// Queueing Actions
// -----------------------------------------------------------------------

var cancelAction = function cancelAction(game, entity) {
  if (entity.actions.length == 0) return;

  var curAction = entity.actions[0];
  switch (curAction.type) {
    case 'MOVE':
      entity.prevPosition = _extends({}, entity.position);
      break;
    case 'TURN':
      entity.prevTheta = entity.theta;
      break;
    case 'MOVE_TURN':
      entity.prevPosition = _extends({}, entity.position);
      entity.prevTheta = entity.theta;
      break;
  }

  entity.actions.shift();
};

// stacked actions come before other queued actions
var stackAction = function stackAction(game, entity, action) {
  if (!entity.actions) {
    entity.actions = [];
  }
  if (!game.ACTOR[entity.id]) {
    game.ACTOR[entity.id] = true;
  }
  if (entity.actions.length == 0) {
    entity.actions.push(action);
    return;
  }

  var curAction = entity.actions[0];
  // HACK: this nonsense is because if the ant was previously pointing diagonally,
  // and then points at a 90degree angle, the duration needs to change from 1.4x
  // to just 1x, but the entity's action won't ever update unless we pre-send
  // that theta and update the action here as soon as we stack it
  var theta = action.type == 'TURN' ? action.payload : entity.theta;
  theta = action.type == 'MOVE_TURN' ? action.payload.nextTheta : theta;
  curAction.duration = getDuration(game, _extends({}, entity, { theta: theta }), curAction.type);
  curAction.effectDone = false;

  entity.actions.unshift(action);
};

var queueAction = function queueAction(game, entity, action) {
  // const curAction = entity.actions[0];
  // if (curAction != null) {
  //   // HACK: this nonsense is because if the ant was previously pointing diagonally,
  //   // and then points at a 90degree angle, the duration needs to change from 1.4x
  //   // to just 1x, but the entity's action won't ever update unless we pre-send
  //   // that theta and update the action here as soon as we stack it
  //   let theta = action.type == 'TURN'
  //     ? action.payload : entity.theta;
  //   theta = action.type == 'MOVE_TURN' ? action.payload.nextTheta : theta;
  //   action.duration = getDuration(game, {...entity, theta}, curAction.type);
  // }

  if (!entity.actions) {
    entity.actions = [];
  }
  if (!game.ACTOR[entity.id]) {
    game.ACTOR[entity.id] = true;
  }
  entity.actions.push(action);
};

// -----------------------------------------------------------------------
// Making Actions
// -----------------------------------------------------------------------

var makeAction = function makeAction(game, entity, actionType, payload) {
  var duration = getDuration(game, entity, actionType);
  // HACK: for making entities take twice as long to turn
  // NOTE: also requires change in getDuration below
  // if (actionType == 'TURN') {
  //   const thetaDiff = Math.abs(entity.theta - payload) % (2*Math.PI);
  //   if (closeTo(thetaDiff, Math.PI)) {
  //     duration *= 2;
  //   }
  // }

  var config = entity;
  var effectIndex = 0;
  if (config[actionType] != null) {
    effectIndex = config[actionType].effectIndex || 0;
  }

  var action = {
    type: actionType,
    duration: duration,
    payload: payload,
    effectIndex: effectIndex,
    effectDone: false
  };
  return action;
};

// -----------------------------------------------------------------------
// Getters
// -----------------------------------------------------------------------

var isActionTypeQueued = function isActionTypeQueued(entity, actionType, almostDone) {
  if (entity.actions == null) {
    return false;
  }
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = entity.actions[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var action = _step.value;

      if (action.type == actionType) {
        if (almostDone && action.duration <= 16) {
          continue;
        }
        return true;
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return false;
};

var getDuration = function getDuration(game, entity, actionType) {
  var config = entity;
  if (!config[actionType]) return 1;
  var duration = config[actionType].duration;

  if (
  // (actionType == 'MOVE' || actionType == 'MOVE_TURN') &&
  actionType == 'MOVE' && isDiagonalTheta(entity.theta)) {
    duration = Math.round(duration * 1.4); // sqrt(2)
  }
  if (!entity || !entity.position) return duration;

  // slowed down by water
  var inWater = getPheromoneAtPosition(game, floor(entity.position), 'WATER', game.playerID) > 0 || getPheromoneAtPosition(game, floor(entity.prevPosition), 'WATER', game.playerID) > 0;
  if ((actionType == 'MOVE' || actionType == 'MOVE_TURN') && inWater) {
    duration *= 2.5;
  }

  // HACK: for making critters take twice as long to turn
  // NOTE: also requires change in makeAction above
  // if (actionType == 'TURN') {
  //   let curAction = entity.actions[0];
  //   if (curAction == null) return duration;
  //   // if this is true, then we're in the current turn action already
  //   if (curAction.payload == entity.theta) {
  //     const thetaDiff = Math.abs(entity.prevTheta - entity.theta) % (2*Math.PI);
  //     if (closeTo(thetaDiff, Math.PI)) {
  //       duration *= 2;
  //     }
  //   }
  // }

  return duration;
};

var getFrame = function getFrame(game, entity, index) {
  var config = entity;
  if (entity.actions.length == 0) return 0;
  var actionType = entity.actions[0].type;

  // compute hacky frameOffset
  var frameOffset = 0;
  if (entity.actions[0].payload != null && entity.actions[0].payload.frameOffset > 0 && (actionType == 'MOVE' || actionType == 'MOVE_TURN')
  // HACK: when bite target is queen, frameOffset can be > 0
  ) {
      frameOffset = entity.actions[0].payload.frameOffset;
    }

  // compute caste-specific overrides
  var spriteOrder = 1;
  if (config[actionType] != null) {
    spriteOrder = config[actionType].spriteOrder;
  } else {
    console.error("no config for action", entity, actionType);
  }
  var duration = getDuration(game, entity, actionType);

  var progress = index / duration;
  var spriteIndex = Math.floor(progress * spriteOrder.length);
  return spriteOrder[spriteIndex] + frameOffset;
};

module.exports = {
  cancelAction: cancelAction,
  stackAction: stackAction,
  queueAction: queueAction,
  isActionTypeQueued: isActionTypeQueued,
  getDuration: getDuration,
  makeAction: makeAction,
  getFrame: getFrame
};
},{"../selectors/pheromones":24,"../utils/helpers":30,"../utils/vectors":32}],27:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var _require = require('../utils/vectors'),
    add = _require.add,
    subtract = _require.subtract,
    vectorTheta = _require.vectorTheta,
    equals = _require.equals;

var globalConfig = require('../config');

var _require2 = require('../utils/helpers'),
    thetaToDir = _require2.thetaToDir,
    closeTo = _require2.closeTo,
    encodePosition = _require2.encodePosition;

var _require3 = require('../utils/gridHelpers'),
    insideGrid = _require3.insideGrid,
    insertInCell = _require3.insertInCell,
    deleteFromCell = _require3.deleteFromCell,
    getEntityPositions = _require3.getEntityPositions;

var _require4 = require('../selectors/neighbors'),
    getNeighborEntities = _require4.getNeighborEntities,
    getNeighborPositions = _require4.getNeighborPositions;

var _require5 = require('../entities/makeEntity'),
    makeEntity = _require5.makeEntity;

var _require6 = require('../selectors/pheromones'),
    getEntityPheromoneSources = _require6.getEntityPheromoneSources,
    getQuantityForStalePos = _require6.getQuantityForStalePos,
    getPheromoneAtPosition = _require6.getPheromoneAtPosition;

var _require7 = require('../simulation/pheromones'),
    setPheromone = _require7.setPheromone;

var _require8 = require('../entities/registry'),
    Entities = _require8.Entities;

var _require9 = require('../properties/registry'),
    Properties = _require9.Properties;

var insertEntityInGrid = function insertEntityInGrid(game, entity) {
  var dir = thetaToDir(entity.theta);
  if (entity.segmented) {
    var position = entity.position,
        segments = entity.segments;

    var nextSegments = [];
    // head
    insertInCell(game.grid, position, entity.id);

    // segments
    var prevPos = position;
    for (var i = 0; i < segments.length - 1; i++) {
      var pos = segments[i].position;
      var nextPos = segments[i + 1].position;
      var segmentType = 'corner';
      var theta = 0;
      var beforeVec = subtract(prevPos, pos);
      var afterVec = subtract(pos, nextPos);
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
      nextSegments.push({
        position: pos,
        theta: theta,
        segmentType: segmentType
      });
      prevPos = pos;
      insertInCell(game.grid, pos, entity.id);
    }

    // tail
    var segBeforeTailPos = segments.length > 1 ? segments[segments.length - 2].position : position;
    var tailPos = segments[segments.length - 1].position;
    nextSegments.push({
      position: tailPos,
      theta: vectorTheta(subtract(segBeforeTailPos, tailPos))
    });
    insertInCell(game.grid, tailPos, entity.id);

    entity.segments = nextSegments;
  } else {
    for (var x = 0; x < entity.width; x++) {
      for (var y = 0; y < entity.height; y++) {
        var _pos = { x: x, y: y };
        if ((dir == 'left' || dir == 'right') && entity.type != "BACKGROUND") {
          _pos = { x: y, y: x };
        }
        var gridPos = add(entity.position, _pos);
        insertInCell(game.grid, gridPos, entity.id);
        // if (
        //   globalConfig.pheromones.DIRT_DROP.blockingTypes.includes(entity.type) &&
        //   game.pheromoneWorker
        // ) {
        //   game.dirtPutdownPositions = game.dirtPutdownPositions
        //     .filter(p => !equals(p, gridPos));
        // }
      }
    }
  }

  // for the worker
  if (!game.pheromoneWorker) return;
  if (game.time > 1) {
    game.pheromoneWorker.postMessage({ type: 'INSERT_IN_GRID', entity: entity });
  }

  if (game.time > 1 && entity.NOT_ANIMATED) {
    markEntityAsStale(game, entity);
  }

  // tiled sprites updating:
  if (entity.TILED) {
    var _game$staleTiles;

    game.staleTiles.push(entity.id);
    var neighbors = getNeighborEntities(game, entity, true /*external*/).filter(function (e) {
      return e.type == entity.type;
    }).map(function (e) {
      return e.id;
    });
    (_game$staleTiles = game.staleTiles).push.apply(_game$staleTiles, _toConsumableArray(neighbors));
  }

  if (game.time < 1) return;

  // pheromone updating:
  var pherSources = getEntityPheromoneSources(game, entity);
  if (pherSources.length > 0) {
    var _game$floodFillSource;

    // TODO: do I need to do this filter? NOTE that having it breaks critter pheromone
    // game.reverseFloodFillSources = game.reverseFloodFillSources
    //   .filter(s => s.id != entity.id);
    (_game$floodFillSource = game.floodFillSources).push.apply(_game$floodFillSource, _toConsumableArray(pherSources));
  }

  var _loop = function _loop(pheromoneType) {
    if (!globalConfig.pheromones[pheromoneType].blockingTypes.includes(entity.type)) return 'continue';
    game.floodFillSources = game.floodFillSources.filter(function (s) {
      return s.id != entity.id || s.pheromoneType != pheromoneType;
    });
    var neighborPositions = getNeighborPositions(game, entity, true /* external */);

    for (var playerID in game.players) {
      // NOTE: dispersing pheromones never reverseFloodFill
      if (globalConfig.pheromones[pheromoneType].isDispersing) {
        setPheromone(game, entity.position, pheromoneType, 0, playerID);
        continue;
      }
      setPheromone(game, entity.position, pheromoneType, 0, playerID);
      var maxAmount = globalConfig.pheromones[pheromoneType].quantity;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = neighborPositions[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var neighbor = _step.value;

          var quantity = getPheromoneAtPosition(game, neighbor, pheromoneType, playerID);
          if (quantity < maxAmount) {
            game.reverseFloodFillSources.push({
              id: entity.id,
              position: neighbor,
              pheromoneType: pheromoneType,
              playerID: playerID
            });
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  };

  for (var pheromoneType in globalConfig.pheromones) {
    var _ret = _loop(pheromoneType);

    if (_ret === 'continue') continue;
  }
};

var removeEntityFromGrid = function removeEntityFromGrid(game, entity) {
  var position = entity.position;
  var dir = thetaToDir(entity.theta);
  if (entity.segmented) {
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = entity.segments[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var segment = _step2.value;

        deleteFromCell(game.grid, segment.position, entity.id);
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }

    deleteFromCell(game.grid, entity.position, entity.id);
  } else {
    for (var x = 0; x < entity.width; x++) {
      for (var y = 0; y < entity.height; y++) {
        var pos = { x: x, y: y };
        if (dir == 'left' || dir == 'right') {
          pos = { x: y, y: x };
        }
        var gridPos = add(entity.position, pos);
        deleteFromCell(game.grid, gridPos, entity.id);
      }
    }
  }

  // for the worker
  if (!game.pheromoneWorker) return;
  if (game.time > 1) {
    game.pheromoneWorker.postMessage({ type: 'REMOVE_FROM_GRID', entity: entity });
  }

  if (game.time > 1 && entity.NOT_ANIMATED) {
    markEntityAsStale(game, entity);
  }

  // tiled sprites updating:
  if (entity.TILED) {
    var _game$staleTiles2;

    game.staleTiles = game.staleTiles.filter(function (id) {
      return id != entity.id;
    });
    var neighbors = getNeighborEntities(game, entity, true /*external*/).filter(function (e) {
      return e.type == entity.type;
    }).map(function (e) {
      return e.id;
    });
    (_game$staleTiles2 = game.staleTiles).push.apply(_game$staleTiles2, _toConsumableArray(neighbors));
  }

  if (game.time < 1) return;
  // pheromone updating:
  var pherSources = getEntityPheromoneSources(game, entity);
  if (pherSources.length > 0) {
    var pheromoneType = pherSources[0].pheromoneType;
    // NOTE: dispersing pheromones never reverseFloodFill
    if (!globalConfig.pheromones[pheromoneType].isDispersing) {
      var _game$reverseFloodFil;

      var playerID = pherSources[0].playerID;
      // If you are added as a fill source AND removed from the grid on the same tick,
      // then the pheromone will stay behind because reverse fills are done before flood fills
      // So check if you are in the floodFill queue and just remove it:
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        var _loop2 = function _loop2() {
          var source = _step3.value;

          game.floodFillSources = game.floodFillSources.filter(function (s) {
            return !(s.pheromoneType == source.pheromoneType && s.playerID == source.playerID && equals(s.position, source.position));
          });
        };

        for (var _iterator3 = pherSources[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          _loop2();
        }

        // by adding 1, we force this position to be bigger than all its neighbors, which is how the
        // reverse flooding checks if a position is stale and should be set to 0
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = pherSources[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var _source = _step4.value;

          setPheromone(game, _source.position, pheromoneType, _source.quantity + 1, playerID);
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }

      (_game$reverseFloodFil = game.reverseFloodFillSources).push.apply(_game$reverseFloodFil, _toConsumableArray(pherSources));
    }
  }

  for (var _pheromoneType in globalConfig.pheromones) {
    if (!globalConfig.pheromones[_pheromoneType].blockingTypes.includes(entity.type)) continue;
    for (var _playerID in game.players) {
      if (pherSources.length > 0 && pherSources[0].pheromoneType == _pheromoneType) {
        continue; // don't flood fill this type, we just removed it
      }
      var quantity = getQuantityForStalePos(game, position, _pheromoneType, _playerID).quantity;
      setPheromone(game, entity.position, _pheromoneType, 0, _playerID);
      game.floodFillSources.push({
        id: entity.id,
        position: position,
        quantity: quantity,
        pheromoneType: _pheromoneType,
        playerID: _playerID,
        stale: true // if stale, then you override the quantity value when
        // it comes time to compute
      });
    }
  }
};

var addEntity = function addEntity(game, entity) {
  entity.id = game.nextID++;

  game.entities[entity.id] = entity;

  // add to type and property-based memos
  game[entity.type].push(entity.id);
  if (entity.AGENT && entity.type != 'AGENT') {
    game.AGENT.push(entity.id);
  }
  for (var prop in Properties) {
    if (entity[prop]) {
      game[prop][entity.id] = entity;
    }
  }

  // NOTE: special case for missiles
  if (entity.warhead) {
    if (entity.warhead.id == -1 || !game.entities[entity.warhead.id]) {
      addEntity(game, entity.warhead);
    }
    entity.holding = entity.warhead;
    entity.holdingIDs.push(entity.warhead.id);
    entity.warhead.position = null;
    entity.warhead.timer = Entities[entity.warhead.type].config.timer;
    entity.warhead.age = 0;
    entity.warhead.actions = [];
  }

  // update the pheromone worker that this entity exists
  if (game.pheromoneWorker && game.time > 1) {
    game.pheromoneWorker.postMessage({ type: 'ADD_ENTITY', entity: entity });
  }

  if (entity.position != null) {
    insertEntityInGrid(game, entity);
  }

  return game;
};

var removeEntity = function removeEntity(game, entity) {

  game[entity.type] = game[entity.type].filter(function (id) {
    return id != entity.id;
  });
  if (entity.AGENT && entity.type != 'AGENT') {
    game.AGENT = game.AGENT.filter(function (id) {
      return id != entity.id;
    });
  }

  // remove from type and property-based memos
  for (var prop in Properties) {
    delete game[prop][entity.id];
  }

  delete game.entities[entity.id];

  // update the pheromone worker that this is removed
  if (game.pheromoneWorker && game.time > 1) {
    game.pheromoneWorker.postMessage({ type: 'REMOVE_ENTITY', entity: entity });
  }

  if (entity.position != null) {
    removeEntityFromGrid(game, entity);
  }
  return game;
};

var moveEntity = function moveEntity(game, entity, nextPos) {
  entity.prevPosition = _extends({}, entity.position);

  removeEntityFromGrid(game, entity);
  entity.position = _extends({}, nextPos);
  // if it's segmented, also update the positions of all the segments
  // before inserting back into the grid
  if (entity.segmented) {
    var next = _extends({}, entity.prevPosition);
    var _iteratorNormalCompletion5 = true;
    var _didIteratorError5 = false;
    var _iteratorError5 = undefined;

    try {
      for (var _iterator5 = entity.segments[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
        var segment = _step5.value;

        var tmp = _extends({}, segment.position);
        segment.position = next;
        next = tmp;
      }
    } catch (err) {
      _didIteratorError5 = true;
      _iteratorError5 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion5 && _iterator5.return) {
          _iterator5.return();
        }
      } finally {
        if (_didIteratorError5) {
          throw _iteratorError5;
        }
      }
    }
  }
  insertEntityInGrid(game, entity);

  // only rotate if you have to, so as not to blow away prevTheta
  var nextTheta = vectorTheta(subtract(entity.prevPosition, entity.position));
  if (!closeTo(nextTheta, entity.theta) && !entity.type == 'BULLET') {
    rotateEntity(game, entity, nextTheta);
  }
  return game;
};

var rotateEntity = function rotateEntity(game, entity, nextTheta) {
  if (entity.width != entity.height) {
    removeEntityFromGrid(game, entity);
  }
  entity.prevTheta = entity.theta;
  entity.theta = nextTheta;
  if (entity.width != entity.height) {
    insertEntityInGrid(game, entity);
  }
  return game;
};

var changeEntityType = function changeEntityType(game, entity, oldType, nextType) {
  // NOTE: remove then re-add to grid in order to get pheromones working right
  removeEntityFromGrid(game, entity);
  game[oldType] = game[oldType].filter(function (id) {
    return id != entity.id;
  });
  game[nextType].push(entity.id);
  entity.type = nextType;
  insertEntityInGrid(game, entity);
};

var changePheromoneEmitterQuantity = function changePheromoneEmitterQuantity(game, entity, nextQuantity) {
  entity.quantity = nextQuantity;
  // NOTE: remove then re-add to grid in order to get pheromones working right
  removeEntityFromGrid(game, entity);
  game.pheromoneWorker.postMessage({
    type: 'SET_EMITTER_QUANTITY',
    entityID: entity.id,
    quantity: nextQuantity
  });
  insertEntityInGrid(game, entity);
};

var changeEntitySize = function changeEntitySize(game, entity, width, height) {
  removeEntityFromGrid(game, entity);
  entity.prevWidth = entity.width;
  entity.prevHeight = entity.height;
  entity.width = width;
  entity.height = height;
  insertEntityInGrid(game, entity);
};

var addSegmentToEntity = function addSegmentToEntity(game, entity, segmentPosition) {
  removeEntityFromGrid(game, entity);
  entity.segments.push({ position: segmentPosition });
  insertEntityInGrid(game, entity);
};

///////////////////////////////////////////////////////////////////////////
// Entity Subdivision
///////////////////////////////////////////////////////////////////////////

var subdivideEntity = function subdivideEntity(game, entity) {
  var subdivisions = [];
  var quadrantPositions = [{ x: entity.position.x, y: entity.position.y }];
  if (entity.width > 1) {
    quadrantPositions.push({ x: Math.floor(entity.position.x + entity.width / 2), y: entity.position.y });
  }
  if (entity.height > 1) {
    quadrantPositions.push({ x: entity.position.x, y: Math.floor(entity.position.y + entity.height / 2) });
  }
  if (entity.width > 1 && entity.height > 1) {
    quadrantPositions.push({
      x: Math.floor(entity.position.x + entity.width / 2),
      y: Math.floor(entity.position.y + entity.height / 2)
    });
  }
  var _iteratorNormalCompletion6 = true;
  var _didIteratorError6 = false;
  var _iteratorError6 = undefined;

  try {
    for (var _iterator6 = quadrantPositions[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
      var pos = _step6.value;

      var width = pos.x != entity.position.x ? entity.width - (pos.x - entity.position.x) : Math.max(1, Math.floor(entity.position.x + entity.width / 2) - pos.x);
      var height = pos.y != entity.position.y ? entity.height - (pos.y - entity.position.y) : Math.max(1, Math.floor(entity.position.y + entity.height / 2) - pos.y);
      // console.log(pos.x, pos.y, width, height);
      var quadrantEntity = _extends({}, entity, makeEntity(entity.type, pos, width, height));
      subdivisions.push(quadrantEntity);
    }
  } catch (err) {
    _didIteratorError6 = true;
    _iteratorError6 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion6 && _iterator6.return) {
        _iterator6.return();
      }
    } finally {
      if (_didIteratorError6) {
        throw _iteratorError6;
      }
    }
  }

  return subdivisions;
};

var continuouslySubdivide = function continuouslySubdivide(game, entity, pickupPos) {
  var subdivisions = subdivideEntity(game, entity);
  var toSub = null;
  var _iteratorNormalCompletion7 = true;
  var _didIteratorError7 = false;
  var _iteratorError7 = undefined;

  try {
    for (var _iterator7 = subdivisions[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
      var sub = _step7.value;

      // check if pickupPos is inside this sub
      if (pickupPos.x >= sub.position.x && pickupPos.x < sub.position.x + sub.width && pickupPos.y >= sub.position.y && pickupPos.y < sub.position.y + sub.height) {
        toSub = sub;
      } else {
        addEntity(game, sub);
      }
    }
  } catch (err) {
    _didIteratorError7 = true;
    _iteratorError7 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion7 && _iterator7.return) {
        _iterator7.return();
      }
    } finally {
      if (_didIteratorError7) {
        throw _iteratorError7;
      }
    }
  }

  if (toSub.width > 1 || toSub.height > 1) {
    return continuouslySubdivide(game, toSub, pickupPos);
  } else {
    addEntity(game, toSub);
    return toSub;
  }
};

///////////////////////////////////////////////////////////////////////////
// Pickup/Putdown
///////////////////////////////////////////////////////////////////////////

var pickupEntity = function pickupEntity(game, entity, pickupPos) {
  var toPickup = entity;
  removeEntityFromGrid(game, entity);

  entity.prevPosition = entity.position;
  // do the subdivision if entity is bigger
  if (pickupPos != null && (entity.width > 1 || entity.height > 1)) {
    var sub = continuouslySubdivide(game, entity, pickupPos);
    removeEntityFromGrid(game, sub);
    sub.position = null;
    toPickup = sub;
    removeEntity(game, entity);
  } else {
    entity.position = null;
  }

  return toPickup;
};

var putdownEntity = function putdownEntity(game, entity, pos) {
  entity.position = _extends({}, pos);
  entity.prevPosition = _extends({}, pos);

  // NOTE: need to do this before inserting in the grid so it doesn't do
  // a flood fill unnecessarily
  if (entity.type == 'DIRT' && entity.marked) {
    entity.marked = null;
    game.markedDirtIDs = game.markedDirtIDs.filter(function (id) {
      return id != entity.id;
    });
  }

  insertEntityInGrid(game, entity);

  return game;
};

// Helper function for insert/remove to mark as stale all entity positions
// plus all neighbor positions when computing the image-based rendering background
var markEntityAsStale = function markEntityAsStale(game, entity) {
  getEntityPositions(game, entity).forEach(function (pos) {
    var key = encodePosition(pos);
    if (!game.viewImage.stalePositions[key]) {
      game.viewImage.stalePositions[key] = pos;
    }
  });
  getNeighborPositions(game, entity).forEach(function (pos) {
    var key = encodePosition(pos);
    if (!game.viewImage.stalePositions[key]) {
      game.viewImage.stalePositions[key] = pos;
    }
  });
  game.viewImage.isStale = true;
};

module.exports = {
  addEntity: addEntity,
  removeEntity: removeEntity,
  moveEntity: moveEntity,
  rotateEntity: rotateEntity,
  pickupEntity: pickupEntity,
  putdownEntity: putdownEntity,
  changeEntityType: changeEntityType,
  changeEntitySize: changeEntitySize,
  markEntityAsStale: markEntityAsStale,
  addSegmentToEntity: addSegmentToEntity,
  changePheromoneEmitterQuantity: changePheromoneEmitterQuantity,

  // NOTE: only used by the worker!
  insertEntityInGrid: insertEntityInGrid,
  removeEntityFromGrid: removeEntityFromGrid
};
},{"../config":1,"../entities/makeEntity":10,"../entities/registry":11,"../properties/registry":17,"../selectors/neighbors":23,"../selectors/pheromones":24,"../simulation/pheromones":28,"../utils/gridHelpers":29,"../utils/helpers":30,"../utils/vectors":32}],28:[function(require,module,exports){
'use strict';

var _require = require('../utils/vectors'),
    add = _require.add,
    multiply = _require.multiply,
    subtract = _require.subtract,
    equals = _require.equals,
    floor = _require.floor,
    containsVector = _require.containsVector;

var _require2 = require('../utils/helpers'),
    isDiagonalMove = _require2.isDiagonalMove;

var _require3 = require('../selectors/neighbors'),
    getNeighborPositions = _require3.getNeighborPositions;

var _require4 = require('../utils/gridHelpers'),
    lookupInGrid = _require4.lookupInGrid,
    getEntityPositions = _require4.getEntityPositions,
    insideGrid = _require4.insideGrid;

var _require5 = require('../selectors/pheromones'),
    getPheromoneAtPosition = _require5.getPheromoneAtPosition,
    getSourcesOfPheromoneType = _require5.getSourcesOfPheromoneType,
    getQuantityForStalePos = _require5.getQuantityForStalePos;

var globalConfig = require('../config');

/**
 * use queue to continuously find neighbors and set their pheromone
 * value to decayAmount less, if that is greater than its current value
 */
var floodFillPheromone = function floodFillPheromone(game, pheromoneType, playerID, posQueue) {
  var config = globalConfig.pheromones[pheromoneType];

  var _loop = function _loop() {
    var _posQueue$shift = posQueue.shift(),
        position = _posQueue$shift.position,
        quantity = _posQueue$shift.quantity;

    var isOccupied = lookupInGrid(game.grid, position).map(function (id) {
      return game.entities[id];
    }).filter(function (e) {
      return config.blockingTypes.includes(e.type);
    }).length > 0;

    if ((!isOccupied || config.canInhabitBlocker) && getPheromoneAtPosition(game, position, pheromoneType, playerID) < quantity) {
      setPheromone(game, position, pheromoneType, quantity, playerID);
      var neighborPositions = getNeighborPositions(game, { position: position }, false /* internal */);
      var decayAmount = config.decayAmount;
      var amount = Math.max(0, quantity - decayAmount);

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = neighborPositions[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var neighbor = _step.value;

          if (isDiagonalMove(position, neighbor)) continue;
          var neighborAmount = getPheromoneAtPosition(game, neighbor, pheromoneType, playerID);
          var occupied = lookupInGrid(game.grid, neighbor).map(function (id) {
            return game.entities[id];
          }).filter(function (e) {
            return config.blockingTypes.includes(e.type);
          }).length > 0;
          if (amount > 0 && amount > neighborAmount && !occupied) {
            posQueue.push({ position: neighbor, quantity: amount });
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }

    // dispersing pheromones decay separately
    if (config.isDispersing) {
      if (getPheromoneAtPosition(game, position, pheromoneType, playerID) > 0 && game.dispersingPheromonePositions.find(function (s) {
        return equals(s.position, position) && playerID == s.playerID && s.pheromoneType == pheromoneType;
      }) == null) {
        game.dispersingPheromonePositions.push({
          position: position, playerID: playerID, pheromoneType: pheromoneType
        });
      }
    }
  };

  while (posQueue.length > 0) {
    _loop();
  }
};

/**
 * When a pheromoneBlocking entity is added into the grid, then it could close off
 * a path, requiring recalculation. So do:
 * Reverse flood fill where you start at the neighbors of the newly occupied position,
 * then 0 those positions out if they are bigger than all their neighbors,
 * then add THEIR non-zero neighbors to the queue and continue,
 * finally, re-do the flood fill on all the 0-ed out spaces in reverse order
 */
var reverseFloodFillPheromone = function reverseFloodFillPheromone(game, pheromoneType, playerID, posQueue) {
  var config = globalConfig.pheromones[pheromoneType];

  var floodFillQueue = [];
  if (pheromoneType == 'FOOD') {
    console.trace("hrmm");
  }
  while (posQueue.length > 0) {
    var _position = posQueue.shift();
    var amount = getPheromoneAtPosition(game, _position, pheromoneType, playerID);
    var neighborAmount = getBiggestNeighborVal(game, _position, pheromoneType, playerID);
    var maxAmount = config.quantity;
    var decayAmount = config.decayAmount;
    var shouldFloodFill = true;
    if (neighborAmount <= amount) {
      shouldFloodFill = false;
      setPheromone(game, _position, pheromoneType, 0, playerID);
      var neighborPositions = getNeighborPositions(game, { position: _position }, false /* internal */);
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = neighborPositions[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var neighbor = _step2.value;

          if (isDiagonalMove(_position, neighbor)) continue;
          var _neighborAmount = getPheromoneAtPosition(game, neighbor, pheromoneType, playerID);
          if (_neighborAmount > 0 && _neighborAmount < maxAmount) {
            posQueue.push(neighbor);
          } else if (_neighborAmount == maxAmount) {
            // neighboring a pheromone source, so flood fill from here,
            // simpler than the block below this that computes neighbor positions for flood fill
            floodFillQueue.push({ position: _position, quantity: maxAmount - decayAmount });
          }
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    }
    if (shouldFloodFill) {
      // if you aren't bigger than your biggest neighbor, then your value
      // is actually fine. So then add this position to the floodFillQueue
      // since it's right on the edge of the area that needs to be re-filled in
      var _neighborPositions = getNeighborPositions(game, { position: _position }, false /* internal */);
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = _neighborPositions[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var _neighbor = _step3.value;

          if (isDiagonalMove(_position, _neighbor)) continue;
          var occupied = lookupInGrid(game.grid, _neighbor).map(function (id) {
            return game.entities[id];
          }).filter(function (e) {
            return config.blockingTypes.includes(e.type);
          }).length > 0;
          var _quantity = Math.max(0, amount - decayAmount);
          if (_quantity > 0 && !occupied) {
            floodFillQueue.push({ position: _neighbor, quantity: _quantity });
          }
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }
    }
  }
  floodFillPheromone(game, pheromoneType, playerID, floodFillQueue);
};

var computeAllPheromoneSteadyState = function computeAllPheromoneSteadyState(game) {
  for (var playerID in game.players) {
    var _loop2 = function _loop2(pheromoneType) {
      var config = globalConfig.pheromones[pheromoneType];
      // elements in this queue will be of type:
      // {position: Vector, quantity: number}
      var posQueue = [];
      // find sources of the pheromoneType and add their positions to the queue
      getSourcesOfPheromoneType(game, pheromoneType, playerID).forEach(function (entity) {
        if (entity.PHEROMONE_EMITTER) {
          posQueue.push({
            position: entity.position,
            quantity: entity.quantity
          });
        }
        getEntityPositions(game, entity).forEach(function (position) {
          posQueue.push({
            position: position,
            quantity: entity.quantity
          });
        });
      });

      floodFillPheromone(game, pheromoneType, playerID, posQueue);
    };

    for (var pheromoneType in globalConfig.pheromones) {
      _loop2(pheromoneType);
    }
  }
};

// ------------------------------------------------------------------
// Setters
// ------------------------------------------------------------------

/**
 *  Set the pheromone value of one specific position
 */
var setPheromone = function setPheromone(game, position, type, quantity, playerID, alreadyUpdatedWorker) {
  var grid = game.grid;

  if (!insideGrid(grid, position)) return;
  var config = globalConfig.pheromones[type];
  var x = position.x,
      y = position.y;

  if (type != 'FOOD') {
    grid[x][y][playerID][type] = Math.min(quantity, config.quantity);
  } else {
    grid[x][y][playerID][type] = quantity;
  }
  if (game.pheromoneWorker && !alreadyUpdatedWorker) {
    game.pheromoneWorker.postMessage({
      type: 'SET_PHEROMONE',
      position: position,
      pheromoneType: type, quantity: quantity, playerID: playerID
    });
  }
};

/**
 *  Add the pheromone source to the flood fill queue
 */
var fillPheromone = function fillPheromone(game, position, pheromoneType, playerID, quantityOverride) {
  var config = globalConfig.pheromones[pheromoneType];
  var quantity = quantityOverride != null ? quantityOverride : config.quantity;
  if (quantity == 0) {
    return;
  }
  game.floodFillSources.push({
    position: position, pheromoneType: pheromoneType, playerID: playerID, quantity: quantity
  });
};

/**
 *  Add the pheromone source to the reverse flood fill queue
 */
var clearPheromone = function clearPheromone(game, position, pheromoneType, playerID) {
  var quantity = getPheromoneAtPosition(game, position, pheromoneType, playerID);
  setPheromone(game, position, pheromoneType, quantity + 1, playerID);
  game.reverseFloodFillSources.push({
    position: position, pheromoneType: pheromoneType, playerID: playerID, quantity: quantity
  });
};

/**
 *  Recompute the pheromone values at this position across every
 *  pheromone type. Used for when e.g. a pupa hatches into an
 *  ant, need to re-fill in the space left behind by the pupa
 */
var refreshPheromones = function refreshPheromones(game, position) {
  for (var playerID in game.players) {
    for (var pheromoneType in globalConfig.pheromones) {
      var _quantity2 = getQuantityForStalePos(game, position, pheromoneType, playerID).quantity;
      if (_quantity2 > 0) {
        game.floodFillSources.push({
          position: position, pheromoneType: pheromoneType, playerID: parseInt(playerID), quantity: _quantity2, stale: true
        });
      }
    }
  }
};

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

var getBiggestNeighborVal = function getBiggestNeighborVal(game, position, pheromoneType, playerID) {
  var neighborPositions = getNeighborPositions(game, { position: position }, false /* internal */);
  var quantity = 0;
  var _iteratorNormalCompletion4 = true;
  var _didIteratorError4 = false;
  var _iteratorError4 = undefined;

  try {
    for (var _iterator4 = neighborPositions[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
      var pos = _step4.value;

      if (isDiagonalMove(position, pos)) continue;
      var candidateAmount = getPheromoneAtPosition(game, pos, pheromoneType, playerID);
      if (candidateAmount > quantity) {
        quantity = candidateAmount;
      }
    }
  } catch (err) {
    _didIteratorError4 = true;
    _iteratorError4 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion4 && _iterator4.return) {
        _iterator4.return();
      }
    } finally {
      if (_didIteratorError4) {
        throw _iteratorError4;
      }
    }
  }

  return quantity;
};

module.exports = {
  computeAllPheromoneSteadyState: computeAllPheromoneSteadyState,
  floodFillPheromone: floodFillPheromone,
  reverseFloodFillPheromone: reverseFloodFillPheromone,
  setPheromone: setPheromone,
  fillPheromone: fillPheromone,
  clearPheromone: clearPheromone,
  refreshPheromones: refreshPheromones,
  getBiggestNeighborVal: getBiggestNeighborVal
};
},{"../config":1,"../selectors/neighbors":23,"../selectors/pheromones":24,"../utils/gridHelpers":29,"../utils/helpers":30,"../utils/vectors":32}],29:[function(require,module,exports){
'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var globalConfig = require('../config');

var _require = require('../utils/helpers'),
    thetaToDir = _require.thetaToDir;

var _require2 = require('../utils/vectors'),
    add = _require2.add,
    multiply = _require2.multiply,
    subtract = _require2.subtract,
    equals = _require2.equals,
    floor = _require2.floor,
    containsVector = _require2.containsVector;

var initGrid = function initGrid(gridWidth, gridHeight, numPlayers) {
  var grid = [];
  for (var x = 0; x < gridWidth; x++) {
    var col = [];
    for (var y = 0; y < gridHeight; y++) {
      var cell = {
        entities: []
      };
      for (var i = 0; i < numPlayers; i++) {
        cell[i] = {};
        for (var pheromoneType in globalConfig.pheromones) {
          cell[i][pheromoneType] = 0;
        }
      }
      col.push(cell);
    }
    grid.push(col);
  }
  return grid;
};

var insideGrid = function insideGrid(grid, position) {
  if (position == null) return false;
  var x = position.x,
      y = position.y;

  return grid[x] != null && x >= 0 && y >= 0 && x < grid.length && y < grid[x].length;
};
var entityInsideGrid = function entityInsideGrid(game, entity) {
  var gridWidth = game.gridWidth,
      gridHeight = game.gridHeight;
  var position = entity.position,
      width = entity.width,
      height = entity.height;

  if (position == null) return false;
  var x = position.x,
      y = position.y;


  return x >= 0 && y >= 0 && x + width <= gridWidth && y + height <= gridHeight;
};

var lookupInGrid = function lookupInGrid(grid, position) {
  if (!insideGrid(grid, position)) return [];
  return grid[position.x][position.y].entities;
};

var getPheromonesInCell = function getPheromonesInCell(grid, position, playerID) {
  if (!insideGrid(grid, position)) return [];
  return grid[position.x][position.y][playerID];
};

var insertInCell = function insertInCell(grid, position, entityID) {
  if (!insideGrid(grid, position)) return false;

  grid[position.x][position.y].entities.push(entityID);
  return true;
};

var deleteFromCell = function deleteFromCell(grid, position, entityID) {
  if (!insideGrid(grid, position)) return true;

  var x = position.x,
      y = position.y;

  var oldLength = grid[x][y].entities.length;
  grid[x][y].entities = grid[x][y].entities.filter(function (id) {
    return id != entityID;
  });

  return oldLength != grid[x][y].entities.length;
};

var canvasToGrid = function canvasToGrid(game, canvasPos) {
  var config = globalConfig.config;
  var scaleVec = {
    x: game.viewWidth / window.innerWidth,
    y: game.viewHeight / window.innerHeight
  };

  var gridCoord = floor(add({ x: game.viewPos.x, y: game.viewPos.y }, multiply(canvasPos, scaleVec)));
  return floor(gridCoord);
};

var getEntityPositions = function getEntityPositions(game, entity) {
  if (entity.segmented) {
    return [entity.position].concat(_toConsumableArray(entity.segments.map(function (s) {
      return s.position;
    })));
  }
  var width = entity.width != null ? entity.width : 1;
  var height = entity.height != null ? entity.height : 1;
  var dir = thetaToDir(entity.theta);
  var positions = [];
  for (var x = 0; x < entity.width; x++) {
    for (var y = 0; y < entity.height; y++) {
      var pos = { x: x, y: y };
      if ((dir == 'left' || dir == 'right') && entity.type != 'BACKGROUND') {
        pos = { x: y, y: x };
      }
      positions.push(add(entity.position, pos));
    }
  }
  return positions;
};

module.exports = {
  initGrid: initGrid, // TODO: move gridHelpers out of utils/
  insideGrid: insideGrid,
  lookupInGrid: lookupInGrid,
  insertInCell: insertInCell,
  deleteFromCell: deleteFromCell,
  getPheromonesInCell: getPheromonesInCell,
  canvasToGrid: canvasToGrid,
  getEntityPositions: getEntityPositions,
  entityInsideGrid: entityInsideGrid
};
},{"../config":1,"../utils/helpers":30,"../utils/vectors":32}],30:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var _require = require('./vectors'),
    subtract = _require.subtract,
    vectorTheta = _require.vectorTheta;

var clamp = function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
};

// NOTE: for angles in radians being close to each other!
var closeTo = function closeTo(a, b) {
  var normalizedA = a % (2 * Math.PI);
  var epsilon = 0.00001;
  return Math.abs(normalizedA - b) < epsilon;
};

var sameArray = function sameArray(arrayA, arrayB) {
  if (arrayA.length != arrayB.length) return false;
  for (var i = 0; i < arrayA.length; i++) {
    if (arrayA[i] != arrayB[i]) {
      return false;
    }
  }
  return true;
};

var thetaToDir = function thetaToDir(theta, noDiagonal) {
  // 90 degree only:
  if (noDiagonal) {
    var _directions = ['left', 'down', 'right', 'up'];
    var _deg = Math.round(theta * 180 / Math.PI);
    if (Math.round(_deg / 45) % 2 != 0) return null;
    return _directions[Math.round(_deg / 90) % 4];
  }

  // including 45 degree:
  var directions = ['left', 'leftup', 'up', 'rightup', 'right', 'rightdown', 'down', 'leftdown'];
  var deg = Math.round(theta * 180 / Math.PI);
  if (Math.round(deg / 45) != deg / 45) return null;
  return directions[Math.round(deg / 45) % 8];
};

var isDiagonalTheta = function isDiagonalTheta(theta) {
  var dir = thetaToDir(theta);
  return dir == 'leftdown' || dir == 'rightdown' || dir == 'rightup' || dir == 'leftup';
};

var isDiagonalMove = function isDiagonalMove(vecA, vecB) {
  return isDiagonalTheta(vectorTheta(subtract(vecA, vecB)));
};

var encodePosition = function encodePosition(pos) {
  return "" + pos.x + "," + pos.y;
};

var decodePosition = function decodePosition(pos) {
  var _pos$split = pos.split(','),
      _pos$split2 = _slicedToArray(_pos$split, 2),
      x = _pos$split2[0],
      y = _pos$split2[1];

  return { x: parseInt(x), y: parseInt(y) };
};

var getDisplayTime = function getDisplayTime(millis) {
  var seconds = Math.floor(millis / 1000);
  var minutes = Math.floor(seconds / 60);
  var leftOverSeconds = seconds - minutes * 60;
  var leftOverSecondsStr = leftOverSeconds == 0 ? '00' : '' + leftOverSeconds;
  if (leftOverSeconds < 10 && leftOverSeconds != 0) {
    leftOverSecondsStr = '0' + leftOverSecondsStr;
  }

  return minutes + ':' + leftOverSecondsStr;
};

var throttle = function throttle(func, args, wait) {
  var inThrottle = false;
  return function (ev) {
    if (inThrottle) {
      return;
    }
    func.apply(undefined, _toConsumableArray(args).concat([ev]));
    inThrottle = true;
    setTimeout(function () {
      inThrottle = false;
    }, wait);
  };
};

function isMobile() {
  var toMatch = [/Android/i, /webOS/i, /iPhone/i, /iPad/i, /iPod/i, /BlackBerry/i, /Windows Phone/i];

  return toMatch.some(function (toMatchItem) {
    return navigator.userAgent.match(toMatchItem);
  });
}

// HACK: when we're in electron window.require is a function
function isElectron() {
  return window.require != null;
}

function deepCopy(obj) {
  if ((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) !== 'object' || obj == null) {
    return obj;
  }

  var copy = {};
  for (var key in obj) {
    if (_typeof(obj[key]) === 'object' && obj[key] != null) {
      if (Array.isArray(obj[key])) {
        copy[key] = [];
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = obj[key][Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var elem = _step.value;

            copy[key].push(deepCopy(elem));
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      } else {
        copy[key] = deepCopy(obj[key]);
      }
    } else {
      copy[key] = obj[key];
    }
  }
  return copy;
}

function filterObj(obj, fn) {
  var nextObj = {};
  for (var id in obj) {
    if (fn(obj[id])) {
      nextObj[id] = obj[id];
    }
  }
  return nextObj;
}

function forEachObj(obj, fn) {
  for (var id in obj) {
    fn(obj[id]);
  }
  return obj;
}

module.exports = {
  clamp: clamp, closeTo: closeTo, sameArray: sameArray, thetaToDir: thetaToDir,
  isDiagonalTheta: isDiagonalTheta, isDiagonalMove: isDiagonalMove,
  encodePosition: encodePosition, decodePosition: decodePosition,
  getDisplayTime: getDisplayTime, isMobile: isMobile,
  throttle: throttle,
  isElectron: isElectron,
  deepCopy: deepCopy,
  forEachObj: forEachObj,
  filterObj: filterObj
};
},{"./vectors":32}],31:[function(require,module,exports){
"use strict";

var floor = Math.floor,
    sqrt = Math.sqrt,
    random = Math.random,
    round = Math.round;


var rand = function rand() {
  return random();
};

// return an integer between min and max, inclusive
var randomIn = function randomIn(min, max) {
  return floor(min + rand() * (max - min + 1));
};

var shamefulGaussian = function shamefulGaussian() {
  return (rand() + rand() + rand() + rand() + rand() + rand() - 3) / 3;
};
var normalIn = function normalIn(min, max) {
  var gaussian = (shamefulGaussian() + 1) / 2;
  return floor(min + gaussian * (max - min + 1));
};

var oneOf = function oneOf(options) {
  if (options.length === 0) return null;
  return options[floor(rand() * options.length)];
};

// weights must be positive
var weightedOneOf = function weightedOneOf(options, weights) {
  var cumulativeWeights = [];
  var sum = 0;

  for (var i = 0; i < options.length; i++) {
    sum += weights[i];
    cumulativeWeights.push(sum);
  }

  var randomVal = randomIn(0, sum - 1) + 1;

  var index = 0;
  for (; randomVal > cumulativeWeights[index]; index++) {}

  return options[index];
};

module.exports = {
  randomIn: randomIn,
  normalIn: normalIn,
  oneOf: oneOf,
  weightedOneOf: weightedOneOf
};
},{}],32:[function(require,module,exports){
"use strict";

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var cos = Math.cos,
    sin = Math.sin;


var add = function add() {
  for (var _len = arguments.length, vectors = Array(_len), _key = 0; _key < _len; _key++) {
    vectors[_key] = arguments[_key];
  }

  var resultVec = { x: 0, y: 0 };
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = vectors[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var v = _step.value;

      resultVec.x += v.x;
      resultVec.y += v.y;
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return resultVec;
};

var equals = function equals(a, b) {
  return a.x == b.x && a.y == b.y;
};

// NOTE: see vectorTheta note if subtracting vectors to find the angle between them
var subtract = function subtract() {
  for (var _len2 = arguments.length, vectors = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    vectors[_key2] = arguments[_key2];
  }

  var resultVec = _extends({}, vectors[0]);
  for (var i = 1; i < vectors.length; i++) {
    resultVec.x -= vectors[i].x;
    resultVec.y -= vectors[i].y;
  }
  return resultVec;
};

var makeVector = function makeVector(theta, magnitude) {
  var x = magnitude * cos(theta);
  var y = magnitude * sin(theta);
  return { x: x, y: y };
};

var dist = function dist(vecA, vecB) {
  return magnitude(subtract(vecA, vecB));
};

var scale = function scale(vec, scalar) {
  return { x: vec.x * scalar, y: vec.y * scalar };
};

var magnitude = function magnitude(vector) {
  var x = vector.x,
      y = vector.y;

  return Math.sqrt(x * x + y * y);
};

// what is the angle of this vector
// NOTE: that when subtracting two vectors in order to compute the theta
// between them, the target should be the first argument
var vectorTheta = function vectorTheta(vector) {
  // shift domain from [-Math.PI, Math.PI] to [0, 2 * Math.PI]
  return (2 * Math.PI + Math.atan2(vector.y, vector.x)) % (2 * Math.PI);
};

var multiply = function multiply() {
  for (var _len3 = arguments.length, vectors = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
    vectors[_key3] = arguments[_key3];
  }

  var resultVec = { x: 1, y: 1 };
  for (var i = 0; i < vectors.length; i++) {
    resultVec.x *= vectors[i].x;
    resultVec.y *= vectors[i].y;
  }
  return resultVec;
};

var floor = function floor(vector) {
  return {
    x: Math.floor(vector.x),
    y: Math.floor(vector.y)
  };
};

var round = function round(vector) {
  return {
    x: Math.round(vector.x),
    y: Math.round(vector.y)
  };
};

var ceil = function ceil(vector) {
  return {
    x: Math.ceil(vector.x),
    y: Math.ceil(vector.y)
  };
};

var containsVector = function containsVector(array, vec) {
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = array[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var vector = _step2.value;

      if (equals(vector, vec)) return true;
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  return false;
};

var abs = function abs(vector) {
  return {
    x: Math.abs(vector.x),
    y: Math.abs(vector.y)
  };
};

// given two positions, return a rectangle with the positions at opposite corners
var toRect = function toRect(posA, posB) {
  var rect = {
    position: { x: Math.min(posA.x, posB.x), y: Math.min(posA.y, posB.y) },
    width: Math.abs(posA.x - posB.x) + 1,
    height: Math.abs(posA.y - posB.y) + 1
  };
  return rect;
};

var rotate = function rotate(vector, theta) {
  var x = vector.x,
      y = vector.y;

  return {
    x: cos(theta) * x - sin(theta) * y,
    y: sin(theta) * x + cos(theta) * y
  };
};

module.exports = {
  add: add,
  subtract: subtract,
  equals: equals,
  makeVector: makeVector,
  scale: scale,
  dist: dist,
  magnitude: magnitude,
  vectorTheta: vectorTheta,
  multiply: multiply,
  floor: floor,
  round: round,
  ceil: ceil,
  containsVector: containsVector,
  toRect: toRect,
  rotate: rotate,
  abs: abs
};
},{}]},{},[16]);
