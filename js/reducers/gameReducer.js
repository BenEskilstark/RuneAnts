// @flow

const {
  addEntity, removeEntity, markEntityAsStale,
  changeEntitySize, changeEntityType,
} = require('../simulation/entityOperations');
const {
  entityInsideGrid, lookupInGrid, getEntityPositions,
} = require('../utils/gridHelpers');
const {
  queueAction, makeAction, isActionTypeQueued,
} = require('../simulation/actionQueue');
const {add, subtract, round, floor, ceil, equals} = require('../utils/vectors');
const {render} = require('../render/render');
const {fillPheromone, clearPheromone, setPheromone} = require('../simulation/pheromones');
const {clamp, encodePosition, decodePosition} = require('../utils/helpers');
const {getEntityPheromoneSources} = require('../selectors/pheromones');
const {Entities} = require('../entities/registry');
const globalConfig = require('../config');

import type {Game, Action} from '../types';

const gameReducer = (game: Game, action: Action): Game => {
  switch (action.type) {
    case 'SET': {
      const {property, value} = action;
      game[property] = value;
      return game;
    }
    case 'ENQUEUE_ENTITY_ACTION': {
      const {entityAction, entity} = action;
      queueAction(game, entity, entityAction);
      return game;
    }
    case 'SPAWN_FOOD': {
      const {pos, size} = action;
      game.timeSinceLastFoodSpawn = 0;
      for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
          addEntity(game, Entities.FOOD.make(game, add(pos, {x, y})));
        }
      }
      return game;
    }
    case 'SET_SCORE': {
      const {score} = action;
      game.score = score;
      return game;
    }
    case 'SPAWN_SCORPION': {
      const {pos} = action;
      game.numScorpionsSpawned++;
      addEntity(game, Entities.SCORPION.make(game, pos, 0));
      game.ticker = {
        message: 'Scorpion Attack!',
        time: 3000,
        max: 3000,
      };
      return game;
    }
    case 'USE_EXPLOSIVE': {
      const {score, gridPos} = action;
      game.explosiveUses[score] = true;
      addEntity(game, Entities.DYNAMITE.make(game, gridPos, game.playerID));
      game.explosiveReady = false;
      game.ticker = null;
      return game;
    }
    case 'SET_VIEW_POS': {
      const {viewPos, viewWidth, viewHeight} = action;
      game.viewPos = viewPos;
      if (viewWidth != null) {
        game.viewWidth = viewWidth;
      }
      if (viewHeight != null) {
        game.viewHeight = viewHeight;
      }
      if (action.rerender) {
        render(game);
      }
      return game;
    }
    case 'INCREMENT_ZOOM': {
      const {zoom} = action;
      const ratio = game.viewWidth / game.viewHeight;
      const widthInc = Math.round(zoom * ratio * 10);
      const heightInc = Math.round(zoom * ratio * 10);

      const nextWidth = game.viewWidth + widthInc;
      const nextHeight = game.viewHeight + heightInc;

      // don't allow zooming out too far
      if (nextWidth > 100 || nextHeight > 95) return game;

      const oldWidth = game.viewWidth;
      const oldHeight = game.viewHeight;
      game.viewWidth = clamp(nextWidth, Math.round(5 * ratio), game.gridWidth + 50);
      game.viewHeight = clamp(nextHeight, Math.round(5 * ratio), game.viewHeight + 50);
      game.viewPos = floor({
        x: (oldWidth - game.viewWidth) / 2 + game.viewPos.x,
        y: (oldHeight - game.viewHeight) / 2 + game.viewPos.y,
      });
      render(game); // HACK: for level editor
      return game;
    }
    case 'SET_PHEROMONE_VISIBILITY': {
      const {pheromoneType, isVisible} = action;
      game.pheromoneDisplay[pheromoneType] = isVisible;
      return game;
    }
    case 'SET_TICKER_MESSAGE': {
      const {message, time, isMini} = action;
      if (!isMini) {
        game.ticker = {
          message,
          time,
          max: time,
        };
      } else {
        game.miniTicker = {
          message,
          time,
          max: time,
        };
      }
      return game;
    }
    case 'CREATE_ENTITY': {
      const {entity, position} = action;
      if (position != null) {
        game.prevInteractPosition = position;
      }
      return addEntity(game, entity);
    }
    case 'DELETE_ENTITY': {
      const {entity} = action;
      removeEntity(game, entity);
      return game;
    }
    case 'CREATE_ENTITIES': {
      return createEntitiesReducer(game, action);
    }
    case 'SET_ON_FIRE': {
      const {entityID} = action;
      game.entities[entityID].onFire = true;
      return game;
    }
    case 'UPDATE_TURBINE': {
      const {entityID, thetaSpeed} = action;
      const turbine = game.entities[entityID];
      turbine.thetaSpeed = clamp(
        thetaSpeed,
        -1 * Entities[turbine.type].config.maxThetaSpeed,
        Entities[turbine.type].config.maxThetaSpeed,
      );
      return game;
    }
    case 'SET_FOCUSED': {
      const {entityID} = action;
      game.focusedEntity = game.entities[entityID];
      return game;
    }
    case 'SET_CONTROLLED': {
      const {entityID} = action;
      game.controlledEntity = game.entities[entityID];
      return game;
    }
    case 'COPY_ENTITIES': {
      const {rect} = action;
      game.clipboard = rect;
      return game;
    }
    case 'PASTE_ENTITIES': {
      const {pastePos} = action;
      const {position, width, height} = game.clipboard;
      game.viewImage.isStale = true;

      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          const entities = lookupInGrid(game.grid, add(position, {x, y}))
            .map(id => game.entities[id])
            .filter(e => equals(e.position, add(position, {x, y})));
          for (const copyEntity of entities) {
            const pos = add(pastePos, {x, y});
            const key = encodePosition(pos);
            game.viewImage.stalePositions[key] = pos;

            const entity = {...copyEntity, position: pos};
            if (!entityInsideGrid(game, entity)) continue;
            addEntity(game, entity);
          }
        }
      }

      return game;
    }
    case 'FILL_PHEROMONE': {
      const {gridPos, pheromoneType, playerID, quantity, rect} = action;
      if (rect != null) {
        const {position, width, height} = rect;
          for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
              const pos = add(position, {x, y});
              fillPheromone(game, pos, pheromoneType, playerID, quantity);
            }
          }
      } else if (gridPos != null) {
        fillPheromone(game, gridPos, pheromoneType, playerID, quantity);
      }
      return game;
    }
    case 'UPDATE_ALL_PHEROMONES': {
      const {pheromones} = action;
      // console.log('received pheromone update', pheromones, game.time);
      let allWaterQuantity = 0;
      let shouldUpdateWaterQuantity = false;
      for (const positionHash of pheromones) {
        for (const encodedPosition in positionHash) {
          const position = decodePosition(encodedPosition);
          const {pheromoneType, quantity, playerID} = positionHash[encodedPosition];
          setPheromone(game, position, pheromoneType, quantity, playerID, true /*no worker*/);
          if (pheromoneType == 'WATER' || pheromoneType == 'STEAM') {
            shouldUpdateWaterQuantity = true;
            allWaterQuantity++;
          }
        }
      }
      if (shouldUpdateWaterQuantity) {
        game.allWaterQuantity = allWaterQuantity;
      }
      return game;
    }
    case 'SHOW_DEBUG': {
      const {shouldShow, showType} = action;
      game[showType] = shouldShow;
      return game;
    }
    case 'DELETE_ENTITIES': {
      const {rect} = action;
      const {position, width, height} = rect;
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          const pos = add(position, {x, y});
          const ids = lookupInGrid(game.grid,  pos);
          for (const id of ids) {
            const entity = game.entities[id];
            removeEntity(game, entity);
            if (entity.NOT_ANIMATED) {
              game.viewImage.allStale = true;
            }
          }
        }
      }
      return game;
    }
    case 'SET_SPRITE_SHEET': {
      const {name, img} = action;
      game.sprites[name] = img;
      game.viewImage.isStale = true;
      game.viewImage.allStale = true;
      return game;
    }
    case 'SET_TUTORIAL_FLAG': {
      const {flag} = action;
      game.tutorialFlags[flag] = game.time;
      return game;
    }
    case 'SET_IS_RAINING': {
      const {rainTicks} = action;
      game.rainTicks = rainTicks;
      game.timeSinceLastRain = 0;
      return game;
    }
    case 'SET_DIFFICULTY': {
      const {difficulty} = action;
      game.difficulty = difficulty;
      return game;
    }
    case 'SET_LAST_MISSILE_TIME': {
      game.lastMissileLaunchTime = game.totalGameTime / 1000;
      return game;
    }
    case 'SET_IN_WAVE': {
      const {inWave} = action;
      game.inWave = inWave;
      return game;
    }
    case 'SET_MISSILE_FREQUENCY': {
      const {missileFrequency} = action;
      game.missileFrequency = missileFrequency;
      return game;
    }
    case 'SET_WAVE_INDEX': {
      const {waveIndex} = action;
      game.waveIndex = waveIndex;
      return game;
    }
    case 'SET_SENT_WARNING': {
      const {warning} = action;
      game[warning] = true;
      return game;
    }
    case 'COLLECT_ENTITIES': {
      const {entities, position} = action;
      if (position != null) {
        game.prevInteractPosition = position;
      }
      for (const entity of entities) {
        entity.collectedAs = entity.type;
        changeEntityType(game, entity, entity.type, 'AGENT');
        delete entity.NOT_ANIMATED;
        delete game.NOT_ANIMATED[entity.id];
        entity.AGENT = true;
        entity.blockingTypes = [...Entities.AGENT.config.blockingTypes];
        entity.actions = [];
        // entity.playerID = entity.playerID != null ? entity.playerID : game.playerID;
        entity.MOVE = {
          duration: 4,
          spriteOrder: [1],
        };
        entity.MOVE_TURN = {
          duration: 2,
          spriteOrder: [1],
        };
        entity.TURN =  {
          duration: 1,
          spriteOrder: [1],
        };
        entity.task = 'RETURN';
        entity.RETURN = {
          base: 0,
          forwardMovementBonus: 0,
          prevPositionPenalty: -100,
          COLONY: 1000,
        }
      }
      return game;
    }
    case 'SET_PLACE_TYPE': {
      const {placeType} = action;
      game.placeType = placeType;
      return game;
    }
    case 'SWAP_MINI_MAP': {
      game.maxMinimap = !game.maxMinimap;
      game.viewImage.allStale = true;
      return game;
    }
    case 'SUBTRACT_BASE_RESOURCES': {
      const {subtractResources} = action;
      for (const resource in subtractResources) {
        game.bases[game.playerID].resources[resource] -= subtractResources[resource];
      }
      return game;
    }
    case 'SET_MOUSE_MODE': {
      const {mouseMode} = action;
      game.mouseMode = mouseMode;
      return game;
    }
    case 'SET_KEEP_MARQUEE': {
      const {keepMarquee} = action;
      game.keepMarquee = keepMarquee;
      return game;
    }
    case 'PAUSE_MISSILES': {
      const {pauseMissiles} = action;
      game.pauseMissiles = pauseMissiles;
      return game;
    }
    case 'PAUSE_POWER_CONSUMPTION': {
      const {pausePowerConsumption} = action;
      game.pausePowerConsumption = pausePowerConsumption;
      return game;
    }
    case 'SET_GAME_OVER': {
      /**
       * false | 'win' | 'lose'
       */
      const {gameOver} = action;
      game.gameOver = gameOver;
      return game;
    }
  }
  return game;
};

function createEntitiesReducer(game: Game, action): Game {
  const {entityType, args, rect} = action;
  const {position, width, height} = rect;

  if (!Entities[entityType]) return game;
  const {make, config} = Entities[entityType];

  if (config.onlyMakeOne) {
    const occupied = lookupInGrid(game.grid,  position)
      .map(id => game.entities[id])
      .filter(e => !e.notOccupying)
      .length > 0;
    const entity = make(game, position, ...args);
    if (!occupied && entityInsideGrid) {
      addEntity(game, entity);
    }
  } else {
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const pos = add(position, {x, y});
        const occupied = lookupInGrid(game.grid,  pos)
          .map(id => game.entities[id])
          .filter(e => !e.notOccupying)
          .length > 0;
        if (occupied) continue;
        const entity = make(game, pos, ...args);
        if (!entityInsideGrid(game, entity)) continue;
        addEntity(game, entity);
      }
    }
  }
  if (Entities[entityType].config.NOT_ANIMATED) {
    game.viewImage.allStale = true;
  }
  return game;
}

module.exports = {gameReducer};
