// @flow

const React = require('react');
const axios = require('axios');
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
  store.subscribe(() => {
    const state = store.getState();
    const {game} = state;
    if (!game) return;
    if (game.time == time) return;
    if (game.time == 0) return;
    time = game.time;

    let {gameOver} = game;

    // handle win conditions
    if (false) {
      handleGameWon(store, dispatch, state, 'win');
    }

    // loss conditions
    if (false) {
      handleGameLoss(store, dispatch, state, 'loss');
    }

  });
};

const handleGameLoss = (store, dispatch, state, reason): void => {
  const {game} = state;
  dispatch({type: 'STOP_TICK'});

  const returnButton = {
    label: 'Back to Main Menu',
    onClick: () => {
      dispatch({type: 'DISMISS_MODAL'});
      dispatch({type: 'RETURN_TO_LOBBY'});
    }
  };
  const resetButton = {
    label: 'Reset',
    onClick: () => {
      dispatch({type: 'DISMISS_MODAL'});
      dispatch({type: 'SET_PLAYERS_AND_SIZE'});
      render(store.getState().game); // HACK for level editor
    },
  };
  const buttons = [returnButton];
  if (state.screen == 'EDITOR') {
    buttons.push(resetButton);
  }

  const body = (
    <div>
    {`Your base was destroyed! You survived ${game.missilesSurvived} missiles`}
    </div>
  );

  dispatch({type: 'SET_MODAL',
    modal: (<Modal
      title={'Game Over'}
      body={body}
      buttons={buttons}
    />),
  });
};

const handleGameWon = (store, dispatch, state, reason): void => {
  const {game} = state;
  dispatch({type: 'STOP_TICK'});

  // set screen size  to be zoomed out
  // let ratio = game.viewHeight / game.viewWidth;
  // let viewWidth = game.gridWidth;
  // let viewHeight = viewWidth * ratio;
  // dispatch({type: 'SET_VIEW_POS',
  //   viewPos: {x: 0, y: 0}, viewWidth, viewHeight, rerender: true,
  // });

  const contButton = {
    label: 'Continue',
    onClick: () => {
      dispatch({type: 'DISMISS_MODAL'});
      dispatch({type: 'START_TICK'});
    }
  };
  const returnButton = {
    label: 'Back to Main Menu',
    onClick: () => {
      dispatch({type: 'DISMISS_MODAL'});
      dispatch({type: 'RETURN_TO_LOBBY'});
    }
  };
  const resetButton = {
    label: 'Reset',
    onClick: () => {
      dispatch({type: 'DISMISS_MODAL'});
      dispatch({type: 'SET_PLAYERS_AND_SIZE'});
      render(store.getState().game); // HACK for level editor
    },
  };
  const buttons = [contButton, returnButton];
  if (state.screen == 'EDITOR') {
    buttons.push(resetButton);
  }

  dispatch({type: 'SET_MODAL',
    modal: (<Modal
      title={'Level Won'}
      body={'Level Won'}
      buttons={buttons}
    />),
  });
};

module.exports = {initGameOverSystem};
