// @flow

const React = require('react');
const Button = require('./Components/Button.react');
// const Canvas = require('./Canvas.react');
const {AudioWidget, Canvas} = require('bens_ui_components');
const Checkbox = require('./Components/Checkbox.react');
const RadioPicker = require('./Components/RadioPicker.react');
const TopBar = require('./TopBar.react');
const BottomBar = require('./BottomBar.react');
const {config, pheromones} = require('../config');
const {fillPheromone} = require('../simulation/pheromones');
const {initMouseControlsSystem} = require('../systems/mouseControlsSystem');
const {initGameOverSystem} = require('../systems/gameOverSystem');
const {initFoodSpawnSystem} = require('../systems/foodSpawnSystem');
const {initSpriteSheetSystem} = require('../systems/spriteSheetSystem');
const {initRainSystem} = require('../systems/rainSystem');
const {initMissileAttackSystem} = require('../systems/missileAttackSystem');
const {initPheromoneWorkerSystem} = require('../systems/pheromoneWorkerSystem');
const {
  initKeyboardControlsSystem
} = require('../systems/keyboardControlsSystem');
const ExperimentalSidebar = require('./ExperimentalSidebar.react');
const {handleCollect, handlePlace} = require('../thunks/mouseInteractions');
const {useEffect, useState, useMemo, Component, memo} = React;
const {equals, add, subtract} = require('../utils/vectors');
const {lookupInGrid, getPheromonesInCell} = require('../utils/gridHelpers');
const {clamp, isMobile} = require('../utils/helpers');
const {
  getControlledEntityInteraction,
  getManningAction,
} = require('../selectors/misc');
const {isActionTypeQueued} = require('../simulation/actionQueue');
const {render} = require('../render/render');

import type {Action, State} from '../types';

type Props = {
  dispatch: (action: Action) => Action,
  store:  Object,
  isInLevelEditor: boolean,
  topBar: mixed,
  controlButtons: mixed,
  gameID: mixed,
  tickInterval: mixed,
};

function Game(props: Props): React.Node {
  const {dispatch, store, isInLevelEditor, gameID, tickInterval} = props;
  const state = store.getState();

  // init systems
  useEffect(() => {
    // trying to prevent pinch zoom
    document.addEventListener('touchmove', function (ev) {
      if (ev.scale !== 1) { ev.preventDefault(); }
    }, {passive: false});
    document.addEventListener('gesturestart', function (ev) {
      ev.preventDefault();
    }, {passive: false});
  }, []);
  useEffect(() => {
    initKeyboardControlsSystem(store);
    // initSpriteSheetSystem(store);
    const unGameOver = initGameOverSystem(store);
    const unFoodSpawn = initFoodSpawnSystem(store);
    initPheromoneWorkerSystem(store);
    registerHotkeys(dispatch);
    initMouseControlsSystem(store, configureMouseHandlers(state.game));
    return () => {
      unGameOver();
      unFoodSpawn();
    }
  }, [gameID]);

  // ---------------------------------------------
  // memoizing UI stuff here
  // ---------------------------------------------
  const {game} = state;

  const elem = document.getElementById('background');
  const dims = useMemo(() => {
    const dims = {width: window.innerWidth, height: window.innerHeight};
    if (isInLevelEditor && elem != null) {
      const slider = document.getElementById('sliderBar');
      const editor = document.getElementById('levelEditor');
      let sliderWidth = slider != null ? slider.getBoundingClientRect().width : 0;
      let editorWidth = editor != null ? editor.getBoundingClientRect().width : 0;
      dims.width = dims.width - sliderWidth - editorWidth;
    }
    return dims;
  }, [window.innerWidth, window.innerHeight, elem != null]);

  return (
    <div
      className="background" id="background"
      style={{
        position: 'relative',
      }}
    >
      {
        state.screen == 'EDITOR'
          ? <ExperimentalSidebar state={state} dispatch={dispatch} />
          : null
      }
      <Canvas useFullScreen={state.screen != 'EDITOR'} />
      <h3
        style={{
          position: 'absolute',
          top: 10,
          left: 0,
          width: '100%',
          pointerEvents: 'none',
          textAlign: 'center',
          textShadow: '-1px -1px 0 #FFF, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff',
        }}
      >
        <div>Collected: {game.collected}</div>
        <div>Score: {game.score}</div>
      </h3>
      <Ticker ticker={game.ticker} />
      <AudioWidget
        isShuffled={true}
        audioFiles={config.audioFiles}
        isMuted={false}
        style={{
          position: 'absolute',
          top: 4,
          left: 4,
          display: 'none',
        }}
      />
    </div>
  );
}

      // <Canvas
      //   dispatch={dispatch}
      //   tickInterval={tickInterval}
      //   innerWidth={dims.width}
      //   innerHeight={dims.height}
      //   isExperimental={state.screen == 'EDITOR'}
      //   focusedEntity={game.focusedEntity}
      // />


function registerHotkeys(dispatch) {
  dispatch({
    type: 'SET_HOTKEY', press: 'onKeyDown',
    key: 'space',
    fn: (s) => {
      const game = s.getState().game;
      if (game.tickInterval) {
        s.dispatch({type: 'STOP_TICK'});
      } else {
        s.dispatch({type: 'START_TICK'});
      }
    }
  });
  dispatch({
    type: 'SET_HOTKEY', press: 'onKeyDown',
    key: 'P',
    fn: (s) => {
      const game = s.getState().game;
      s.dispatch({type: 'SET',
        property: 'showPheromoneValues',
        value: !game.showPheromoneValues,
      });
    }
  });
}

function configureMouseHandlers(game) {
  const handlers = {
    mouseMove: (state, dispatch, gridPos) => {
      const game = state.game;
      if (!game.mouse.isLeftDown) {
        return;
      }
      dispatch({type: 'SET', value: true, property: 'inMove'});
      // const prevPos = game.mouse.downPos;
      if (game.prevInteractPos) {
        const prevPos = game.prevInteractPos.pos;
        let quantity = game.prevInteractPos.quantity;
          // getPheromonesInCell(game.grid, prevPos, game.playerID).FOLLOW;
          // || pheromones.FOLLOW.quantity * 0.75;
        // console.log('quantity', quantity, prevPos, gridPos);
        let pos = prevPos;
        dispatch({type: 'FILL_PHEROMONE',
          gridPos: pos,
          pheromoneType: 'FOLLOW',
          playerID: state.game.playerID,
          quantity,
        });
        while (!equals(pos, gridPos)) {
          quantity += 1;
          const diff = subtract(pos, gridPos);
          pos = {
            x: diff.x == 0 ? pos.x : pos.x - diff.x / Math.abs(diff.x),
            y: diff.y == 0 ? pos.y : pos.y - diff.y / Math.abs(diff.y),
          };
          dispatch({type: 'FILL_PHEROMONE',
            gridPos: pos,
            pheromoneType: 'FOLLOW',
            playerID: state.game.playerID,
            quantity,
          });
        }
        dispatch({type: 'SET',
          property: 'prevInteractPos',
          value: {pos: gridPos, quantity},
        });
      } else {
        dispatch({type: 'FILL_PHEROMONE',
          gridPos,
          pheromoneType: 'FOLLOW',
          playerID: state.game.playerID,
          quantity: pheromones.FOLLOW.quantity * 0.75,
        });
        dispatch({type: 'SET',
          property: 'prevInteractPos',
          value: {pos: gridPos, quantity: pheromones.FOLLOW.quantity * 0.75},
        });
      }
    },
    // leftDown: (state, dispatch, gridPos) => {
    // },
    leftUp: (state, dispatch, gridPos) => {
      const game = state.game;
      if (!game.inMove && game.explosiveReady) {
        dispatch({type: 'USE_EXPLOSIVE', score: game.collected, gridPos});
      }
      dispatch({type: 'SET', value: false, property: 'inMove'});
      dispatch({type: 'SET',
        property: 'prevInteractPos',
        value: null,
      });
    },
    // scroll: (state, dispatch, zoom) => {
    //   dispatch({type: 'INCREMENT_ZOOM', zoom});
    // },
  }
  return handlers;
}

function inLine(pos, prevPos) {
  if (pos.x == prevPos.x && Math.abs(pos.y - prevPos.y) > 1) {
    return {dim: 'y', dist: Math.abs(pos.y - prevPos.y), mult: pos.y > prevPos.y ? 1 : -1};
  }
  if (pos.y == prevPos.y && Math.abs(pos.x - prevPos.x) > 1) {
    return {dim: 'x', dist: Math.abs(pos.x - prevPos.x), mult: pos.x > prevPos.x ? 1 : -1};
  }
  return false;
}

function Ticker(props) {
  const {ticker} = props;
  if (ticker == null) return null;
  const shouldUseIndex = ticker.time < 60 || ticker.max - ticker.time < 60;
  let index = ticker.time / 60;
  if (ticker.max - ticker.time < 60) {
    index = (ticker.max - ticker.time) / 60;
  }

  return (
    <h2
      style={{
        position: 'absolute',
        top: 100,
        left: 0,
        width: '100%',
        // opacity: shouldUseIndex ? index : 1,
        pointerEvents: 'none',
        textAlign: 'center',
        textShadow: '-1px -1px 0 #FFF, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff',
      }}
    >
      {ticker.message}
    </h2>
  );
}

function MiniTicker(props) {
  const {miniTicker} = props;
  if (miniTicker == null) return null;

  const shouldUseIndex = miniTicker.time < 60 || miniTicker.max - miniTicker.time < 60;
  let index = miniTicker.time / 60;
  if (miniTicker.max - miniTicker.time < 60) {
    index = (miniTicker.max - miniTicker.time) / 60;
  }

  return (
    <h2
      style={{
        padding: 0,
        margin: 0,
        position: 'absolute',
        top: window.innerHeight - 200,
        left: window.innerWidth - 420,
        opacity: shouldUseIndex ? index : 1,
        pointerEvents: 'none',
        color: 'red',
        textShadow: '-1px -1px 0 #FFF, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff',
      }}
    >
      {miniTicker.message}
    </h2>
  );
}

module.exports = Game;
