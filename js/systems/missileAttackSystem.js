// @flow

const {randomIn, normalIn} = require('../utils/stochastic');
const globalConfig = require('../config');
const {Entities} = require('../entities/registry');

const initMissileAttackSystem = (store) => {
  const {dispatch} = store;
  let time = -1;
  store.subscribe(() => {
    const state = store.getState();
    const {game} = state;
    if (!game) return;
    if (game.time == time) return;
    time = game.time;

    const config = globalConfig.config.difficulty[game.difficulty];

    if (game.pauseMissiles) {
      return;
    }

    const gameSeconds = game.totalGameTime / 1000;
    let shouldLaunch = false;
    let altProb = 0;
    let nukeProb = 0;
    let busterProb = 0;
    let missileFrequency = game.missileFrequency;
    let inWave = false;

    // see if we're in a wave
    if (game.waveIndex < config.waves.length) {
      // if done with current wave, go up to the next wave index
      if (
        gameSeconds >
        config.waves[game.waveIndex].start + config.waves[game.waveIndex].duration
      ) {
        inWave = false;
        missileFrequency = config.startFrequency;
        doWaveOver(dispatch, game, missileFrequency);

        // else check if we're in the current wave
      } else if (gameSeconds > config.waves[game.waveIndex].start) {
        inWave = true;
        missileFrequency = config.waves[game.waveIndex].frequency;
        doStartWave(dispatch, game, missileFrequency);
      }

      // else check if we're on the infinite final waves
    } else {
      const finalWave = config.waves[config.waves.length - 1];
      const index = game.waveIndex - config.waves.length + 1;
      // finished current infinite wave
      if (
        gameSeconds >
        finalWave.start + (config.finalWaveDelay * index) + finalWave.duration
      ) {
        inWave = false;
        missileFrequency = config.startFrequency;
        doWaveOver(dispatch, game, missileFrequency);

        // else check if we're in the current infinite wave
      } else if (gameSeconds > finalWave.start + config.finalWaveDelay * index) {
        inWave = true;
        missileFrequency = finalWave.frequency;
        doStartWave(dispatch, game, missileFrequency);
      }
    }

    if (gameSeconds > config.nukeTime) {
      if (!game.sentNukeWarning) {
        dispatch({type: 'SET_SENT_WARNING', warning: 'sentNukeWarning'});
        dispatch({type: 'SET_TICKER_MESSAGE',
          time: 4000,
          message: 'NUCLEAR MISSILES INCOMING',
        });
      }
      nukeProb = 0.1;
    }
    if (gameSeconds > config.busterTime) {
      if (!game.sentBusterWarning) {
        dispatch({type: 'SET_SENT_WARNING', warning: 'sentBusterWarning'});
        dispatch({type: 'SET_TICKER_MESSAGE',
          time: 4000,
          message: 'BUNKER BUSTER MISSILES INCOMING',
        });
      }
      busterProb = 0.5;
    }

    let alternateSide = Math.random() < altProb;
    let isNuke = Math.random() < nukeProb;
    let isBuster = Math.random() < busterProb && !isNuke;

    if (
      gameSeconds > config.startTime &&
      gameSeconds > game.lastMissileLaunchTime + missileFrequency
    ) {
      shouldLaunch = true;
    }

    if (shouldLaunch) {
      const playerID = 2;
      let pos = {x: randomIn(2, 5), y: randomIn(25, 45)};
      let theta = -1 * randomIn(25, 75) / 100;
      const velocity = randomIn(30, 90);

      if (alternateSide) {
        pos.x = game.gridWidth - pos.x - 1;
        theta += Math.PI;
      }

      const warhead = Entities[isNuke ? 'NUKE' : 'DYNAMITE'].make(game, null, playerID);
      const missile = Entities.MISSILE.make(game, pos, playerID, warhead, theta, velocity);
      if (isBuster) {
        missile.PIERCING = true;
      }
      dispatch({type: 'SET_LAST_MISSILE_TIME'});
      dispatch({type: 'CREATE_ENTITY', entity: missile});
    }

  });
};

function doWaveOver(dispatch, game, missileFrequency) {
  if (game.inWave) {
    dispatch({type: 'SET_IN_WAVE', inWave: false});
    dispatch({type: 'SET_WAVE_INDEX', waveIndex: game.waveIndex + 1});
    dispatch({type: 'SET_MISSILE_FREQUENCY', missileFrequency});
  }
}

function doStartWave(dispatch, game, missileFrequency) {
  if (!game.inWave) {
    dispatch({type: 'SET_IN_WAVE', inWave: true});
    dispatch({type: 'SET_MISSILE_FREQUENCY', missileFrequency});
    dispatch({type: 'SET_TICKER_MESSAGE',
      time: 4000,
      message: 'WAVE OF MISSILES INCOMING',
    });
  }
}

module.exports = {initMissileAttackSystem};
