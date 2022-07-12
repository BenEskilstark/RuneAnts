// @flow

const globalConfig = require('../config');
const {thetaToDir} = require('../utils/helpers');
const {
  add, multiply, subtract, equals, floor, containsVector
} = require('../utils/vectors');

import type {Grid, Game, Vector, EntityID, PheromoneType} from '../types';

const initGrid = (gridWidth: number, gridHeight: number, numPlayers: number): Grid => {
  const grid = [];
  for (let x = 0; x < gridWidth; x++) {
    const col = [];
    for (let y = 0; y < gridHeight; y++) {
      const cell = {
        entities: [],
      };
      for (let i = 0; i < numPlayers; i++) {
        cell[i] = {};
        for (const pheromoneType in globalConfig.pheromones) {
          cell[i][pheromoneType] = 0;
        }
      }
      col.push(cell);
    }
    grid.push(col);
  }
  return grid;
};

const insideGrid = (grid: Grid, position: Vector): boolean => {
  if (position == null) return false;
  const {x, y} = position;
  return grid[x] != null && (
    x >= 0 && y >= 0 &&
    x < grid.length && y < grid[x].length
  );
}
const entityInsideGrid = (game: Game, entity: Entity): boolean => {
  const {gridWidth, gridHeight} = game;
  const {position, width, height} = entity;
  if (position == null) return false;
  const {x, y} = position;

  return x >= 0 &&
    y  >= 0 &&
    (x + width) <= gridWidth &&
    (y + height) <= gridHeight;
};


const lookupInGrid = (grid: Grid, position: Vector): Array<EntityID> => {
  if (!insideGrid(grid, position)) return [];
  return grid[position.x][position.y].entities;
}


const getPheromonesInCell = (
  grid: Grid, position: Vector, playerID: PlayerID,
): {[PheromoneType]: number} => {
  if (!insideGrid(grid, position)) return [];
  return grid[position.x][position.y][playerID];
};


const insertInCell = (grid: Grid, position: Vector, entityID: EntityID): boolean => {
  if (!insideGrid(grid, position)) return false;

  grid[position.x][position.y].entities.push(entityID);
  return true;
}


const deleteFromCell = (grid: Grid, position: Vector, entityID: EntityID): boolean => {
  if (!insideGrid(grid, position)) return true;

  const {x, y} = position;
  const oldLength = grid[x][y].entities.length;
  grid[x][y].entities = grid[x][y].entities
    .filter(id => id != entityID);

  return oldLength != grid[x][y].entities.length;
}

const canvasToGrid = (game: GameState, canvasPos: Vector): Vector => {
  const config = globalConfig.config;
  const scaleVec = {
    x: game.viewWidth / config.canvasWidth,
    y: game.viewHeight / config.canvasHeight,
  };

  const gridCoord = floor(
    add(
      {x: game.viewPos.x, y: game.viewPos.y},
      multiply(canvasPos, scaleVec)
    )
  );
  return floor(gridCoord);
};


const getEntityPositions = (game: Game, entity: Entity): Array<Vector> => {
  if (entity.segmented) {
    return [entity.position, ...(entity.segments.map(s => s.position))];
  }
  const width = entity.width != null ? entity.width : 1;
  const height = entity.height != null ? entity.height : 1;
  const dir = thetaToDir(entity.theta);
  const positions = [];
  for (let x = 0; x < entity.width; x++) {
    for (let y = 0; y < entity.height; y++) {
      let pos = {x, y};
      if ((dir == 'left' || dir == 'right') && entity.type != 'BACKGROUND') {
        pos = {x: y, y: x};
      }
      positions.push(add(entity.position, pos));
    }
  }
  return positions;
}

module.exports = {
  initGrid, // TODO: move gridHelpers out of utils/
  insideGrid,
  lookupInGrid,
  insertInCell,
  deleteFromCell,
  getPheromonesInCell,
  canvasToGrid,
  getEntityPositions,
  entityInsideGrid,
};
