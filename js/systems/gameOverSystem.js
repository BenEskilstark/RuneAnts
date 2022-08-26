// @flow

const React = require('react');
const Divider = require('../ui/components/Divider.react');
const Modal = require('../ui/components/Modal.react');
const Button = require('../ui/components/Button.react');
const {lookupInGrid} = require('../utils/gridHelpers');
const {add} = require('../utils/vectors');
const {render} = require('../render/render');
const {getDisplayTime} = require('../utils/helpers');
const {useState} = React;

/**
 * Checks the state every tick for game-over conditions, then orchestrates
 * transition out of the level on win or loss
 *
 * Can short-circuit the game-over checks by setting the gameOver flag on the
 * game directly or with the SET_GAME_OVER action
 */
const initGameOverSystem = (store) => {
  const {dispatch} = store;
  let time = -1;
  return store.subscribe(() => {
    const state = store.getState();
    const {game} = state;
    if (!game) return;
    if (game.time == time) return;
    if (game.time == 0) return;
    time = game.time;

    let {gameOver} = game;

    // handle win conditions
    if (game.BASE.length == 1) {
      const survivingBase = game.entities[game.BASE[0]];
      if (survivingBase.playerID == game.playerID) {
        handleGameWon(store, dispatch, state, 'win');
      }

      // loss conditions
      if (survivingBase.playerID != game.playerID) {
        handleGameLoss(store, dispatch, state, 'loss');
      }
    }

  });
};

const handleGameLoss = (store, dispatch, state, reason): void => {
  const {game} = state;
  dispatch({type: 'STOP_TICK'});
  Rune.gameOver();

  // const returnButton = {
  //   label: 'Restart',
  //   onClick: () => {
  //     dispatch({type: 'DISMISS_MODAL'});
  //     dispatch({type: 'RETURN_TO_LOBBY'});
  //   }
  // };
  // const resetButton = {
  //   label: 'Reset',
  //   onClick: () => {
  //     dispatch({type: 'DISMISS_MODAL'});
  //     dispatch({type: 'SET_PLAYERS_AND_SIZE'});
  //     render(store.getState().game); // HACK for level editor
  //   },
  // };
  // const buttons = [returnButton];
  // if (state.screen == 'EDITOR') {
  //   buttons.push(resetButton);
  // }

  // const body = (
  //   <div>
  //   {`Your colony was destroyed!`}
  //   </div>
  // );

  // dispatch({type: 'SET_MODAL',
  //   modal: (<Modal
  //     title={'Game Over'}
  //     body={body}
  //     buttons={buttons}
  //   />),
  // });
};

const handleGameWon = (store, dispatch, state, reason): void => {
  const {game} = state;
  dispatch({type: 'STOP_TICK'});
  // give a bonus to score based on how fast you won
  // where winning faster gives an exponentially bigger bonus
  dispatch({type: 'SET_SCORE',
    score: Math.min(
      Math.ceil(game.score * (1 + 100000000 ** (1000 / game.time))),
      // 1000000000,
      999999999,
    ),
  });
  Rune.gameOver();

  // const returnButton = {
  //   label: 'Restart',
  //   onClick: () => {
  //     dispatch({type: 'DISMISS_MODAL'});
  //     dispatch({type: 'RETURN_TO_LOBBY'});
  //   }
  // };
  // const resetButton = {
  //   label: 'Reset',
  //   onClick: () => {
  //     dispatch({type: 'DISMISS_MODAL'});
  //     dispatch({type: 'SET_PLAYERS_AND_SIZE'});
  //     render(store.getState().game); // HACK for level editor
  //   },
  // };
  // const buttons = [returnButton];
  // if (state.screen == 'EDITOR') {
  //   buttons.push(resetButton);
  // }

  // dispatch({type: 'SET_MODAL',
  //   modal: (<Modal
  //     title={'Level Won'}
  //     body={`You destroyed the enemy colony and scored: ${game.score}`}
  //     buttons={buttons}
  //   />),
  // });
};

module.exports = {initGameOverSystem};
