// @flow

const {equals} = require('../utils/vectors');
const {Entities} = require('../entities/registry');
const {decodePosition, encodePosition} = require('../utils/helpers');

const initPheromoneWorkerSystem = (store) => {
  const {dispatch} = store;
  let {game} = store.getState();

  game.pheromoneWorker.onmessage = (data) => {
    const message = data.data;
    switch (message.type) {
      case 'PHEROMONES':
        dispatch({type: 'UPDATE_ALL_PHEROMONES', pheromones: message.result});
        break;
      case 'TURBINES': {
        const {thetaSpeed, entityID} = message;
        dispatch({type: 'UPDATE_TURBINE', thetaSpeed, entityID});
        break;
      }
      case 'ENTITIES': {
        game = store.getState().game;
        const {entities} = message;
        for (const encodedPosition in entities) {
          const pos = decodePosition(encodedPosition);
          const {type, quantity} = entities[encodedPosition];
          if (!Entities[type]) {
            console.log('no entity of type', type);
          }
          const config = Entities[type].config;
          let leftoverQuantity = quantity;
          for (const id of game[type]) {
            const e = game.entities[id];
            if (encodePosition(e.position) == encodedPosition) {
              if (e.hp < config.hp) {
                const prevHP = e.hp;
                e.hp = Math.min(config.hp, e.hp + quantity);
                leftoverQuantity -= (e.hp - prevHP);
              }
            }
          }
          if (leftoverQuantity > 0) {
            const entity = Entities[type].make(game, pos, 1, 1, leftoverQuantity);
            dispatch({type: 'CREATE_ENTITY', entity});
          }
        }
        break;
      }
    }
  };
};

module.exports = {initPheromoneWorkerSystem};
