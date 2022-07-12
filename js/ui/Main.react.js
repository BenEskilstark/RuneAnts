// @flow

const React = require('react');
const Game = require('./Game.react');
const LevelEditor = require('./LevelEditor.react');
const Lobby = require('./Lobby.react');

import type {State, Action} from '../types';

type Props = {
  state: State, // Game State
  dispatch: (action: Action) => Action,
  store: Object,
  modal: Object,
};

function Main(props: Props): React.Node {
  const {state, modal} = props;
  let content = null;
  if (state.screen === 'LOBBY') {
    content = <Lobby dispatch={props.dispatch} store={props.store} />;
  } else if (state.screen === 'GAME') {
    content = (
      <Game
        dispatch={props.dispatch} store={props.store}
        gameID={state.game.gameID}
        tickInterval={state.game.tickInterval}
      />
    );
  } else if (state.screen == 'EDITOR') {
    content = (
      <span>
      <Game
        dispatch={props.dispatch} store={props.store}
        gameID={state.game.gameID}
        tickInterval={state.game.tickInterval}
        isInLevelEditor={true}
      />
        <LevelEditor
          state={state}
          dispatch={props.dispatch} store={props.store}
        />
      </span>
    );
  }

  return (
    <React.Fragment>
      {content}
      {state.modal}
    </React.Fragment>
  )
}

module.exports = Main;
