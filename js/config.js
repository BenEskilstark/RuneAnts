// @flow

const config = {
  msPerTick: 16,

  canvasWidth: 1000,
  canvasHeight: 800,

  viewWidth: 25,
  viewHeight: 50,
  useFullScreen: true,
  cellWidth: 20,
  cellHeight: 16,

  audioFiles: [
    {path: 'audio/Song Oct. 9.wav', type: 'wav'},
  ],

  dispersingPheromoneUpdateRate: 6,
  gravity: -100,

  foodSpawnInterval: 1000 * 15,
  minFood: 50,

  explosiveScoreMultiple: 60,

};

const nonMoltenPheromoneBlockingTypes = [
  'DIRT',  'STONE', 'DOODAD',
];
const pheromoneBlockingTypes = [
  ...nonMoltenPheromoneBlockingTypes,
  'ICE',
  'STEEL', 'IRON',
];

const pheromones = {
  COLONY: {
    quantity: 350,
    decayAmount: 1,
    color: 'rgb(155, 227, 90)',
    tileIndex: 1,

    blockingTypes: [...pheromoneBlockingTypes],
    blockingPheromones: [],
  },
  FOOD: {
    quantity: 100,
    decayAmount: 40,
    isDispersing: true,
    decayRate: 0.03, // how much it decays per tick
    color: 'rgb(0, 255, 0)',
    tileIndex: 0,

    blockingTypes: [...pheromoneBlockingTypes],
    blockingPheromones: [],
  },
  ALERT: {
    quantity: 60,
    decayAmount: 10,
    isDispersing: true,
    decayRate: 0.5, // how much it decays per tick
    color: 'rgb(255, 0, 0)',
    tileIndex: 2,
    blockingTypes: [...pheromoneBlockingTypes],
    blockingPheromones: [],
  },
  FOLLOW: {
    quantity: 100,
    decayAmount: 100,
    isDispersing: true,
    decayRate: 0.1, // how much it decays per tick
    color: 'rgb(210, 105, 30)',
    tileIndex: 1,
    blockingTypes: [...pheromoneBlockingTypes],
    blockingPheromones: [],
  },






  LIGHT: {
    quantity: 350,
    decayAmount: 1,
    color: 'rgb(155, 227, 90)',
    tileIndex: 0,

    blockingTypes: [...pheromoneBlockingTypes, 'COAL', 'TURBINE'],
    blockingPheromones: [],
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
      horizontalLeftOver: 0.8,
    },
    isFluid: true,
  },
  STEAM: {
    quantity: 120,
    decayAmount: 120,
    decayRate: 0.0005,
    color: 'rgb(255, 255, 255)',
    tileIndex: 4,

    blockingTypes: [...pheromoneBlockingTypes],
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
      horizontalLeftOver: 0.66,
    },
    isRising: true,
  },
  OIL: {
    quantity: 120,
    decayAmount: 120,
    decayRate: 0.0005,
    color: 'rgb(0, 0, 0)',
    tileIndex: 4,

    blockingTypes: [...pheromoneBlockingTypes, 'COAL'],
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
      horizontalLeftOver: 0.9,
    },
    isFluid: true,
  },
  HOT_OIL: {
    quantity: 120,
    decayAmount: 120,
    decayRate: 1,
    color: 'rgb(150, 88, 101)',
    tileIndex: 4,

    blockingTypes: [...pheromoneBlockingTypes, 'COAL'],
    blockingPheromones: [],
    isDispersing: true,
    viscosity: {
      verticalLeftOver: 0,
      diagonalLeftOver: 0.5,
      horizontalLeftOver: 0.8,
    },
    isFluid: true,
  },
  SULPHUR_DIOXIDE: {
    quantity: 120,
    decayAmount: 120,
    decayRate: 0.0005,
    color: 'rgb(155, 227, 90)',
    tileIndex: 0,

    blockingTypes: [...pheromoneBlockingTypes],
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
      horizontalLeftOver: 0.66,
    },
    isRising: true,
  },
  SAND: {
    quantity: 120,
    decayAmount: 120,
    decayRate: 0.0005,
    color: 'rgb(250, 240, 70)',
    tileIndex: 3,

    blockingTypes: [...pheromoneBlockingTypes, 'COAL'],
    blockingPheromones: ['MOLTEN_SAND'],
    isDispersing: true,
    heatPoint: 100,
    heatsTo: 'MOLTEN_SAND',
    heatRate: 1,
    viscosity: {
      verticalLeftOver: 0,
      diagonalLeftOver: 0.5,
      horizontalLeftOver: 1,
    },
    isFluid: true,
  },
  MOLTEN_SAND: {
    quantity: 120,
    decayAmount: 120,
    decayRate: 0.0005,
    color: 'rgb(215, 88, 101)',
    tileIndex: 2,

    blockingTypes: [...pheromoneBlockingTypes],
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
      horizontalLeftOver: 0.8,
    },
    isFluid: true,
  },
  MOLTEN_IRON: {
    quantity: 120,
    decayAmount: 120,
    decayRate: 0.0005,
    color: 'rgb(100, 100, 100)',
    tileIndex: 5,

    blockingTypes: [...pheromoneBlockingTypes],
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
      horizontalLeftOver: 1,
    },
    // NOTE: not using this
    combinesTo: [{
      substance: 'PHEROMONE',
      type: 'MOLTEN_STEEL',
      ingredients: [
        {substance: 'ENTITY', type: 'COAL'},
      ],
    }],
  },
  MOLTEN_STEEL: {
    quantity: 240,
    decayAmount: 240,
    decayRate: 0.0005,
    color: 'rgb(220, 220, 220)',
    tileIndex: 4,

    blockingTypes: [...pheromoneBlockingTypes],
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
      horizontalLeftOver: 1,
    },
  },
  HEAT: {
    quantity: 150,
    decayAmount: 15,
    decayRate: 1, // how much it decays per tick
    color: 'rgb(255, 0, 0)',
    tileIndex: 2,

    blockingTypes: [...nonMoltenPheromoneBlockingTypes],
    blockingPheromones: [],
    isDispersing: true,
  },
  COLD: {
    quantity: 120,
    decayAmount: 12,
    decayRate: 1, // how much it decays per tick
    color: 'rgb(100, 205, 226)',
    tileIndex: 1,

    blockingTypes: [...nonMoltenPheromoneBlockingTypes],
    blockingPheromones: [],
    isDispersing: true,
  },
};

module.exports = {config, pheromones};
