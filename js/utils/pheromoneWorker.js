// @flow

// NOTE: requires are relative to current directory and not parent
// directory like every other file because this worker is not required by
// any other module and so does not go through the normal babel/browserify transforms.
// See the make file for how it works
const {
  add, multiply, subtract, equals, floor, containsVector,
  vectorTheta,
} = require('./utils/vectors');
const {isDiagonalMove} = require('./utils/helpers');
const {oneOf} = require('./utils/stochastic');
const {getNeighborPositions} = require('./selectors/neighbors');
const {
  lookupInGrid, getEntityPositions,
} = require('./utils/gridHelpers');
const {
  getPheromoneAtPosition, getQuantityForStalePos, getTemperature,
  isPositionBlockingPheromone,
} = require('./selectors/pheromones');
const {
  encodePosition, decodePosition, clamp,
} = require('./utils/helpers');
const {setPheromone, getBiggestNeighborVal} = require('./simulation/pheromones');
const {insertEntityInGrid, removeEntityFromGrid} = require('./simulation/entityOperations');
const globalConfig = require('./config');

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

let game = null
let floodFillQueue = [];
let reverseFloodFillQueue = [];

onmessage = function(ev) {
  const action = ev.data;
  switch (action.type) {
    case 'INIT': {
      // console.log("worker inited");
      game = {
        grid: action.grid,
        entities: action.entities,
        PHEROMONE_EMITTER: {...action.PHEROMONE_EMITTER},
        TURBINE: [...action.TURBINE],

        floodFillQueue: [],
        reverseFloodFillQueue: [],
        dispersingPheromonePositions: {},
      };
      for (const pherType in globalConfig.pheromones) {
        const pheromone = globalConfig.pheromones[pherType];
        if (pheromone.isDispersing) {
          game.dispersingPheromonePositions[pherType] = {};
        }
      }
      break;
    }
    case 'FLOOD_FILL': {
      // console.log("worker received flood fill request", action.floodFillSources);
      if (!game) break;
      game.floodFillQueue.push(...action.floodFillSources);
      startFloodFill();
      break;
    }
    case 'REVERSE_FLOOD_FILL': {
      // console.log("worker received reverse flood fill request");
      if (!game) break;
      game.reverseFloodFillQueue.push(...action.reverseFloodFillSources);
      startReverseFloodFill();
      break;
    }
    case 'DISPERSE_PHEROMONES': {
      if (!game) break;
      startDispersePheromones();
      break;
    }
    case 'SET_PHEROMONE': {
      const {position, pheromoneType, quantity, playerID} = action;
      if (!game) break;
      setPheromone(game, position, pheromoneType, quantity, playerID);
      break;
    }
    case 'INSERT_IN_GRID': {
      const {entity} = action;
      if (!game) break;
      insertEntityInGrid(game, entity);
      game.entities[entity.id] = entity; // need to re-up this in case of
                                         // entity type change
      break;
    }
    case 'REMOVE_FROM_GRID': {
      const {entity} = action;
      if (!game) break;
      removeEntityFromGrid(game, entity);
      break;
    }
    case 'ADD_ENTITY': {
      const {entity} = action;
      if (!game) break;
      game.entities[entity.id] = entity;
      if (entity.PHEROMONE_EMITTER) {
        game.PHEROMONE_EMITTER[entity.id] = true;
      }
      if (entity.type == 'TURBINE') {
        game.TURBINE.push(entity.id);
      }
      break;
    }
    case 'REMOVE_ENTITY': {
      const {entity} = action;
      if (!game) break;
      delete game.entities[entity.id];
      if (entity.PHEROMONE_EMITTER) {
        delete game.PHEROMONE_EMITTER[entity.id];
      }
      if (entity.type == 'TURBINE') {
        game.TURBINE = game.TURBINE.filter(id => id != entity.id);
      }
      break;
    }
    case 'SET_EMITTER_QUANTITY': {
      const {entityID, quantity} = action;
      if (!game) break;
      const entity = game.entities[entityID];
      game.entities[entityID].quantity = quantity;
      if (quantity == 0) {
        const revQuantity = globalConfig.pheromones[entity.pheromoneType].quantity;
        setPheromone(
          game, entity.position, entity.pheromoneType, revQuantity + 1, entity.playerID || 0,
        );
        game.reverseFloodFillQueue.push({
          id: entity.id,
          playerID: entity.playerID || 0,
          pheromoneType: entity.pheromoneType,
          position: entity.position,
          quantity: revQuantity,
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
    case 'CHANGE_EMITTER_TYPE': {
      const {entityID, pheromoneType} = action;
      if (!game) break;
      game.entities[entityID].pheromoneType = pheromoneType;
      break;
    }
  }
}

const startFloodFill = () => {
  let result = [];
  for (const source of game.floodFillQueue) {
    if (source.stale) {
      source.quantity = getQuantityForStalePos(
        game, source.position, source.pheromoneType, source.playerID,
      ).quantity;
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
    const positions = floodFillPheromone(
      game, source.pheromoneType, source.playerID, [source], {},
    );
    if (Object.keys(positions).length > 0) {
      result.push(positions);
    }
  }
  game.floodFillQueue = [];
  postMessage({type: 'PHEROMONES', result});
}

const startReverseFloodFill = () => {
  let result = [];
  for (const source of game.reverseFloodFillQueue) {
    const positions = reverseFloodFillPheromone(
      game, source.pheromoneType, source.playerID, [source.position]
    );
    if (Object.keys(positions).length > 0) {
      result.push(positions);
    }
  }
  game.reverseFloodFillQueue = [];
  postMessage({type: 'PHEROMONES', result});
}

const startDispersePheromones = () => {
  const result = [];
  const nextDispersingPheromones = updateDispersingPheromones(game);
  for (const pherType in nextDispersingPheromones) {
    if (Object.keys(nextDispersingPheromones[pherType]).length > 0) {
      result.push(nextDispersingPheromones[pherType]);
    }
  }
  // console.log(result);
  if (result.length > 0) {
    postMessage({type: 'PHEROMONES', result});
  }
}

/**
 * use queue to continuously find neighbors and set their pheromone
 * value to decayAmount less, if that is greater than its current value
 */
const floodFillPheromone = (
  game, pheromoneType, playerID,
  posQueue,
  partialResults,
) => {
  const resultPositions = {...partialResults};
  const config = globalConfig.pheromones[pheromoneType];

  while (posQueue.length > 0) {
    const {position, quantity} = posQueue.shift();
    const isOccupied = isPositionBlockingPheromone(game, pheromoneType, position);
    if (
      (!isOccupied  || config.canInhabitBlocker) &&
      getPheromoneAtPosition(game, position, pheromoneType, playerID) < quantity
    ) {
      setPheromone(game, position, pheromoneType, quantity, playerID);
      resultPositions[encodePosition(position)] = {pheromoneType, quantity, playerID};

      const neighborPositions = getNeighborPositions(game, {position}, false /* internal */);
      const decayAmount = config.decayAmount;
      const amount = Math.max(0, quantity - decayAmount);

      for (const neighbor of neighborPositions) {
        if (isDiagonalMove(position, neighbor)) continue;
        const neighborAmount = getPheromoneAtPosition(game, neighbor, pheromoneType, playerID);
        const occupied = isPositionBlockingPheromone(game, pheromoneType, neighbor);
        if (amount > 0 && amount > neighborAmount && !occupied) {
          posQueue.push({position: neighbor, quantity: amount});
        }
      }
    }

    // dispersing pheromones decay separately
    if (config.isDispersing) {
      const encodedPos = encodePosition(position);
      const quantity = getPheromoneAtPosition(game, position, pheromoneType, playerID);
      if (
        quantity > 0 &&
        game.dispersingPheromonePositions[pheromoneType][encodedPos] == null
      ) {
        game.dispersingPheromonePositions[pheromoneType][encodedPos] = {
          position, playerID, pheromoneType, quantity,
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
const reverseFloodFillPheromone = (
  game, pheromoneType, playerID,
  posQueue
) => {
  const config = globalConfig.pheromones[pheromoneType];

  const resultPositions = [];
  const floodFillQueue = [];
  while (posQueue.length > 0) {
    const position = posQueue.shift();
    const amount = getPheromoneAtPosition(game, position, pheromoneType, playerID);
    const neighborAmount = getBiggestNeighborVal(game, position, pheromoneType, playerID);
    const maxAmount = config.quantity;
    const decayAmount = config.decayAmount;
    let shouldFloodFill = true;
    if (neighborAmount <= amount) {
      shouldFloodFill = false;
      setPheromone(game, position, pheromoneType, 0, playerID);
      resultPositions[encodePosition(position)] = {pheromoneType, quantity: 0, playerID};
      const neighborPositions = getNeighborPositions(game, {position}, false /* internal */);
      for (const neighbor of neighborPositions) {
        if (isDiagonalMove(position, neighbor)) continue;
        const neighborAmount = getPheromoneAtPosition(game, neighbor, pheromoneType, playerID);
        if (neighborAmount > 0 && neighborAmount < maxAmount) {
          posQueue.push(neighbor);
        } else if (neighborAmount == maxAmount) {
          // neighboring a pheromone source, so flood fill from here,
          // simpler than the block below this that computes neighbor positions for flood fill
          floodFillQueue.push({position, quantity: maxAmount - decayAmount});
        }
      }
    }
    if (shouldFloodFill) {
      // if you aren't bigger than your biggest neighbor, then your value
      // is actually fine. So then add this position to the floodFillQueue
      // since it's right on the edge of the area that needs to be re-filled in
      const neighborPositions = getNeighborPositions(game, {position}, false /* internal */);
      for (const neighbor of neighborPositions) {
        if (isDiagonalMove(position, neighbor)) continue;
        const occupied = isPositionBlockingPheromone(game, pheromoneType, neighbor);
        const quantity = Math.max(0, amount - decayAmount);
        if (quantity > 0 && !occupied) {
          floodFillQueue.push({position: neighbor, quantity});
        }
      }
    }
  }
  return floodFillPheromone(game, pheromoneType, playerID, floodFillQueue, resultPositions);
};

// fade pheromones that disperse
const updateDispersingPheromones = (game) => {
  const nextDispersingPheromones = {};
  for (const pherType in globalConfig.pheromones) {
    const pheromone = globalConfig.pheromones[pherType];
    if (pheromone.isDispersing) {
      nextDispersingPheromones[pherType] = {};
    }
  }

  const rate = globalConfig.config.dispersingPheromoneUpdateRate;
  const nextTurbines = {}; // as fluid pheromones move, update turbines here
                           // map of entityID --> thetaSpeed
  const nextEntities = {}; // if fluids freeze into entities, record them here
                           // map of encoded position --> {type, quantity}
  for (const pherType in game.dispersingPheromonePositions) {
    let nextFluid = {}; // the algorithm for gravity with fluids will try to push
                        // the same source position multiple times, so don't let it
    for (const encodedPosition in game.dispersingPheromonePositions[pherType]) {
      const source = game.dispersingPheromonePositions[pherType][encodedPosition];
      let {position, playerID, pheromoneType} = source;
      const config = globalConfig.pheromones[pheromoneType];

      let pheromoneQuantity = getPheromoneAtPosition(game, position, pheromoneType, playerID);

      //////////////////////////////////////////////////////////////////////////////
      // check for phase change
      const heat = getTemperature(game, position);
      let sendToOtherPhase = 0;
      let phaseChangeTo = null;
      let changedPhase = false;
      let cooled = false;
      const originalPosition = {...source.position};
      if (config.combustionPoint && heat >= config.combustionPoint && pheromoneQuantity > 0) {
        phaseChangeTo = config.combustsTo;
        if (pheromoneQuantity < 1) {
          sendToOtherPhase = pheromoneQuantity;
        } else {
          sendToOtherPhase = config.combustionRate * pheromoneQuantity;
        }
        changedPhase = true;

        // add heat:
        const heatQuantity = globalConfig.pheromones['HEAT'].quantity;
        setPheromone(
          game, position, 'HEAT',
          heatQuantity,
          playerID,
        );
        game.floodFillQueue.push({
          playerID: 0,
          pheromoneType: 'HEAT',
          position: position,
          quantity: heatQuantity,
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
              quantity: Math.round(sendToOtherPhase),
            };
          }
        } else {
          setPheromone(
            game, source.position, phaseChangeTo,
            sendToOtherPhase, playerID,
          );
          nextDispersingPheromones[phaseChangeTo][encodePosition(source.position)] =
            {...source, pheromoneType: phaseChangeTo,  quantity: sendToOtherPhase};
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
      let decayRate = config.decayRate;
      if (decayRate == null) {
        decayRate = config.decayAmount;
      }
      // since we're only computed once every rate ticks, multiply here as if we had been
      // computing on every tick
      decayRate *= rate;

      //////////////////////////////////////////////////////////////////////////////
      // Update fluids
      if (config.isFluid && (pheromoneQuantity > 0 || !changedPhase)) {
        let y = 1;
        if (config.isRising) {
          y = -1;
        }
        let positionBelow = add(position, {x: 0, y});
        let occupied = isPositionBlockingPheromone(game, pheromoneType, positionBelow);
        let diagonal = false;
        let leftOrRight = false;
        let pherBotLeft = 0;
        let pherBotRight = 0;
        if (
          occupied ||
          getPheromoneAtPosition(game, positionBelow, pheromoneType, playerID) >
          config.quantity - 1
        ) {
          const botLeft = add(position, {x: -1, y});
          const botRight = add(position, {x: 1, y});
          const botLeftOccupied = isPositionBlockingPheromone(game, pheromoneType, botLeft);
          const botRightOccupied = isPositionBlockingPheromone(game, pheromoneType, botRight);
          if (!botLeftOccupied && !botRightOccupied) {
            const leftPher = getPheromoneAtPosition(game, botLeft, pheromoneType, playerID);
            const rightPher = getPheromoneAtPosition(game, botRight, pheromoneType, playerID);
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
          pherBotLeft =
            getPheromoneAtPosition(game, botLeft, pheromoneType, playerID);
          pherBotRight =
            getPheromoneAtPosition(game, botRight, pheromoneType, playerID);
          if (pherBotLeft > config.quantity - 1 &&  pherBotRight > config.quantity - 1) {
            occupied = true;
          }
        }
        const pheromoneDiag = getPheromoneAtPosition(
          game, positionBelow, pheromoneType, playerID,
        );
        if (
          occupied && (
            !diagonal || pherBotLeft > config.quantity - 1 || pherBotRight > config.quantity - 1
          )
        ) {
          const left = add(position, {x: -1, y: 0});
          const right = add(position, {x: 1, y: 0});
          const leftOccupied = isPositionBlockingPheromone(game, pheromoneType, left);
          const rightOccupied = isPositionBlockingPheromone(game, pheromoneType, right);
          if (!leftOccupied && !rightOccupied) {
            const leftPher = getPheromoneAtPosition(game, left, pheromoneType, playerID);
            const rightPher = getPheromoneAtPosition(game, right, pheromoneType, playerID);
            positionBelow = leftPher > rightPher ? right : left;
            positionBelow = leftPher == rightPher ? oneOf([left, right]) : positionBelow;
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
          const pheromoneBelow = getPheromoneAtPosition(
            game, positionBelow, pheromoneType, playerID,
          );
          const maxQuantity = config.quantity;

          let targetPercentLeft = config.viscosity.verticalLeftOver;
          if (diagonal) {
            targetPercentLeft = config.viscosity.diagonalLeftOver;
          }
          if (leftOrRight) {
            targetPercentLeft = config.viscosity.horizontalLeftOver;
          }

          let pherToGive = pheromoneQuantity * (1 - targetPercentLeft);
          if (pheromoneBelow + pherToGive > maxQuantity) {
            pherToGive = maxQuantity - pheromoneBelow;
          }

          // check for turbines that should be spun
          if (!diagonal) {
            for (const turbineID of game.TURBINE) {
              const turbine = game.entities[turbineID];
              // if source.position and positionBelow are both inside the turbine
              // then set its speed to be pherToGive / maxQuantity * maxThetaSpeed
              const turbinePositions = getEntityPositions(game, turbine);
              let positionBelowInside = false;
              let positionInside = false;
              for (const pos of turbinePositions) {
                if (equals(pos, positionBelow)) positionBelowInside = true;
                if (equals(pos, source.position)) positionInside = true;
              }
              if (!positionBelowInside || !positionInside) continue;

              if (!nextTurbines[turbineID]) nextTurbines[turbineID] = 0;
              const dirTheta = vectorTheta(subtract(source.position, positionBelow));
              let dir = dirTheta > 0 ? 1 : -1;

              // decrease amount of pheromone travelling in this direction
              if (pherToGive > 1) {
                pherToGive = pherToGive - (pherToGive * 0.2);
              } else {
                dir = 0;
              }
              nextTurbines[turbineID] += dir * pherToGive / maxQuantity * turbine.maxThetaSpeed;
            }
          }

          let leftOverPheromone = pheromoneQuantity - pherToGive;
          // fluids only decay in very small concentrations
          if (leftOverPheromone > 1) {
            decayRate = 0;
          }

          // set pheromone at this position to the left over that couldn't fall down
          setPheromone(
            game, position, pheromoneType,
            leftOverPheromone - decayRate,
            playerID,
          );

          // if (!nextFluid[encodePosition(position)]) {
            const nextQuantity = Math.max(0, leftOverPheromone - decayRate);
            if (nextQuantity != 0 || (source.quantity != 0)) {
              nextDispersingPheromones[pheromoneType][encodePosition(position)] = {
                ...source,
                position: {...position},
                quantity: nextQuantity,
              };
              nextFluid[encodePosition(position)] = true;
            }
          // }

          pheromoneQuantity = (pheromoneQuantity - leftOverPheromone) + pheromoneBelow;
          // update the source to be the next position
          source.position = positionBelow;
        }
      }
      //////////////////////////////////////////////////////////////////////////////


      // fluids only decay in very small concentrations
      if (config.isFluid && pheromoneQuantity > 0.5 && pheromoneType != 'HOT_OIL') {
        decayRate = 0;
      }

      let finalPherQuantity = Math.max(0, pheromoneQuantity - decayRate);
      setPheromone(
        game, source.position, pheromoneType,
        finalPherQuantity,
        playerID,
      );

      if (config.isFluid && !changedPhase) {
        if (finalPherQuantity - decayRate > 0) {
          nextFluid[encodePosition(source.position)] = true;
          nextDispersingPheromones[pheromoneType][encodePosition(source.position)] =
            {...source, quantity: finalPherQuantity};
        }
      } else {
        nextDispersingPheromones[pheromoneType][encodePosition(source.position)] =
          {...source, quantity: finalPherQuantity};
      }
    }
  }
  // console.log(nextDispersingPheromones);
  game.dispersingPheromonePositions = nextDispersingPheromones;

  // send turbines messages
  for (const turbineID of game.TURBINE) {
    if (nextTurbines[turbineID] != null) {
      postMessage({
        type: 'TURBINES',
        entityID: turbineID,
        thetaSpeed: nextTurbines[turbineID],
      });
    }
  }

  // send entity messages
  if (Object.keys(nextEntities).length > 0) {
    postMessage({
      type: 'ENTITIES',
      entities: nextEntities,
    });
  }

  return nextDispersingPheromones;
}
