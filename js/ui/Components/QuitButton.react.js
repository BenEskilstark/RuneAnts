// @flow

const React = require('react');
const Button = require('./Button.react');
const Modal = require('./Modal.react');
const {isElectron} = require('../../utils/helpers');
let remote = null;
if (isElectron()) {
  remote = window.require('electron');
}
const {useState, useEffect, useMemo} = React;

const QuitButton = (props) => {
  const {isInGame, dispatch} = props;

  if (!isInGame && !isElectron()) return null;

  const buttonStyle = isInGame ? {} :
    {
      margin: 5,
      borderRadius: 8,
      left: 5,
    };
  return (
    <div
      style={buttonStyle}
    >
      <Button
        label="Quit"
        onClick={() => {
          if (!isInGame) {
            remote.webFrame.context.close();
          } else {
            quitGameModal(dispatch);
          }
        }}
      />
    </div>
  );
}

const quitGameModal = (dispatch) => {
  dispatch({type: 'STOP_TICK'});

  const returnToMainMenuButton = {
    label: 'Main Menu',
    onClick: () => {
      dispatch({type: 'DISMISS_MODAL'});
      dispatch({type: 'RETURN_TO_LOBBY'});
    }
  };
  const returnToGameButton = {
    label: 'Return to Game',
    onClick: () => {
      dispatch({type: 'DISMISS_MODAL'});
      dispatch({type: 'START_TICK'});
    }
  };
  const quitAppButton = {
    label: 'Quit Application',
    onClick: () => {
      remote.webFrame.context.close();
    },
  };
  const buttons = [returnToGameButton, returnToMainMenuButton];
  if (isElectron()) {
    buttons.push(quitAppButton);
  }

  const body = (
    <div>
    </div>
  );

  dispatch({type: 'SET_MODAL',
    modal: (<Modal
      title={'Quit Game?'}
      body={body}
      buttons={buttons}
    />),
  });
}

module.exports = QuitButton;
