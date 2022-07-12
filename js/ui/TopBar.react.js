
const React = require('react');
const AudioWidget = require('./Components/AudioWidget.react');
const Button = require('./Components/Button.react');
const Divider = require('./Components/Divider.react');
const Modal = require('./Components/Modal.react');
const QuitButton = require('../ui/components/QuitButton.react');
const globalConfig = require('../config');
const {getDisplayTime, isElectron} = require('../utils/helpers');
const InfoCard = require('../ui/components/InfoCard.react');
const PlacementPalette = require('../ui/PlacementPalette.react');
const {memo} = React;
const {Entities} = require('../entities/registry');

function TopBar(props) {
  const {
    dispatch,
    isExperimental,
    modal,
    tickInterval,
    canvasWidth,
    isMuted,
    totalPowerGenerated,
    powerMargin,
    totalPowerNeeded,
    base,
    placeType,
    game,
  } = props;

  if (isExperimental && tickInterval == null) {
    return null
  }

  const height = 100;
  const topPadding = 8;
  const leftPadding = canvasWidth / 2 - 100;
  let powerStuff = (
    <div>
      <div><b>Power Generated: </b>{(totalPowerGenerated || 0).toFixed(1)}</div>
      <div><b>Power Consumed: </b>{(totalPowerNeeded || 0).toFixed(1)}</div>
      <div><b>Power Available: </b>
        <span style={{color: powerMargin > 0 ? 'green' : 'red'}}>{(powerMargin || 0).toFixed(1)}</span>
      </div>
    </div>
  );


  return (
    <div
      id="topBar"
      style={{
        position: 'absolute',
        top: topPadding,
        height,
        width: '100%',
        zIndex: 2,
        textShadow: '-1px -1px 0 #FFF, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff',
      }}
    >
      <div
        style={{
          // float: 'left',
          paddingLeft: 8,
          display: 'inline-block',
          color: 'black',
        }}
      >
        <QuitButton isInGame={true} dispatch={dispatch} />
        <div>
          <Button
            label="Instructions"
            onClick={() => {
              instructionsModal(dispatch);
            }}
          />
        </div>
        <div>
          <Button
            label={tickInterval ? 'Pause' : 'Play'}
            disabled={modal != null}
            onClick={() => {
              if (tickInterval != null) {
                dispatch({type: 'STOP_TICK'});
              } else {
                dispatch({type: 'START_TICK'});
              }
            }}
          />
        </div>
        {game.difficulty == 'EASY' ?
          (<div>
            <Button
              label={game.pauseMissiles ? 'Send Missiles' : 'Pause Missiles'}
              onClick={() => dispatch({type: 'PAUSE_MISSILES', pauseMissiles: !game.pauseMissiles})}
            />
          </div>) : null
        }
      </div>
      <div
        style={{
          display: 'inline-block',
          verticalAlign: 'top',
        }}
      >
        <PlacementPalette
          game={game}
          dispatch={dispatch}
          base={base}
          placeType={placeType}
        />
      </div>
      <div
        style={{
          // left: leftPadding,
          width: 200,
          marginLeft: 10,
          display: 'inline-block',
          // position: 'absolute',
        }}
      >
        {powerStuff}
      </div>
      <div
        style={{
          width: 200,
          marginLeft: 10,
          fontSize: '1.5em',
          display: 'inline-block',
        }}
      >
        <b>Missiles Survived</b>: {game.missilesSurvived}
      </div>
    </div>
  );
}

function instructionsModal(dispatch) {
  dispatch({type: 'STOP_TICK'});
  dispatch({
    type: 'SET_HOTKEY', press: 'onKeyUp',
    key: 'enter',
    fn: (s) => dismissModal(s.dispatch),
  });
  dispatch({
    type: 'SET_MODAL',
    modal: (<Modal
      title="Instructions"
      body={(<span style={{textAlign: 'initial'}}>
        <div>
          <div style={{textAlign: 'center'}}><b>Controls:</b></div>
          <div>Arrow Keys: move screen</div>
          <div>Left Click: collect non-fluid resource</div>
          <div>Right Click: place selected resource or building</div>
          <div>NOTE: resources can only be collected/placed if there is a path
              to the base. A red cursor means collection/placement is blocked, green
              cursor means it is possible</div>
        </div>
        <div>
          <div style={{textAlign: 'center'}}><b>Goal:</b></div>
          <div>Survive as long as you can!</div>
        </div>
        <Divider style={{
          marginTop: 6,
          marginBottom: 6,
        }} />
        <div>
          Additional information about how resources interact can be displayed
          by hovering over each resource in the selector at the top of the screen
        </div>
      </span>)}
      buttons={[{label: 'Dismiss (Enter)', onClick: () => {
        dismissModal(dispatch);
      }}]}
    />),
  });
}

function dismissModal(dispatch) {
  dispatch({type: 'DISMISS_MODAL'});
  dispatch({
    type: 'SET_HOTKEY', press: 'onKeyUp',
    key: 'enter',
    fn: (s) => {},
  });
  dispatch({type: 'START_TICK'});
}


module.exports = TopBar;
