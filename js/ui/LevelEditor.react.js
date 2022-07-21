// @flow

const React = require('react');
const globalConfig = require('../config');
const Button = require('./components/Button.react');
const Checkbox = require('./components/Checkbox.react');
const Divider = require('./components/Divider.react');
const Dropdown = require('./components/Dropdown.react');
const Slider = require('./components/Slider.react');
const NumberField = require('./components/NumberField.react');
const {render} = require('../render/render');
const {initMouseControlsSystem} = require('../systems/mouseControlsSystem');
const {
  add, subtract, equals, makeVector, floor, round, ceil, toRect,
} = require('../utils/vectors');
const {useEffect, useState, useMemo} = React;
const {Entities} = require('../entities/registry');

import type {Action, State} from '../types';

type Props = {
  dispatch: (action: Action) => Action,
  state: State,
  store:  Object,
};

function LevelEditor(props: Props): React.Node {
  const {dispatch, state} = props;
  const {game} = state;

  // position level editor to the right of the canvas
  const canvasDiv = document.getElementById('canvasWrapper');
  let left = 0;
  if (canvasDiv != null) {
    const rect = canvasDiv.getBoundingClientRect();
    left = rect.left + rect.width + 4;
  }

  // editor state:
  const [editor, setEditor] = useState({
    version: 0, // just a way to force the effect to redo
    started: false,
    importedLevel: {},

    numPlayers: 3,
    gridWidth: game.gridHeight,
    gridHeight: game.gridWidth,
    playerID: 0,
    paletteMode: 'NONE',

    // entity creation mode
    deleteMode: false,
    entityType: 'FOOD',
    subdividing: false,
    pheromoneType: 'HEAT',
    background: 'SKYLINE',
    numSegments: 8,
    doodad: 'QUESTION',
    stoneSubType: 'STONE',

    // missiles and towers
    theta: -0.6,
    velocity: 70,
    warheadType: 'DYNAMITE',
    fireRate: 0,
    projectileType: 'BULLET',
    explosionRadiusType: 'CIRCULAR',

    // copy-paste mode
    clipboardMode: 'COPY',

    // pheromone mode
    selectedPheromone: 'WATER',
    pheromoneQuantity: globalConfig.pheromones.WATER.quantity,
  });

  useEffect(() => {
    const handlers = {
      scroll: (state, dispatch, zoom) => {
        dispatch({type: 'INCREMENT_ZOOM', zoom});
      },
    };
    let shouldInit = true;
    if (editor.paletteMode == 'CREATE ENTITIES') {
      dispatch({type: 'SET_MOUSE_MODE', mouseMode: 'NONE'});
      handlers.mouseMove = () => {}; // placeholder
      handlers.leftUp = (state, dispatch, gridPos) =>  {
        const rect = toRect(state.game.mouse.downPos, gridPos);
        if (editor.deleteMode == false) {
          createEntities(state.game, dispatch, editor, rect);
        } else {
          dispatch({type: 'DELETE_ENTITIES', rect});
        }
        setEditor({...editor, version: editor.version + 1});
      };
    } else if (editor.paletteMode == 'PHEROMONES') {
      dispatch({type: 'SET_MOUSE_MODE', mouseMode: 'NONE'});
      handlers.mouseMove = () => {}; // placeholder
      handlers.leftUp = (state, dispatch, gridPos) => {
        const rect = toRect(state.game.mouse.downPos, gridPos);
        dispatch({
          type: 'FILL_PHEROMONE',
          gridPos,
          rect,
          pheromoneType: editor.selectedPheromone,
          playerID: editor.playerID,
          quantity: editor.pheromoneQuantity,
        });
      };
    } else if (editor.paletteMode == 'COPY-PASTE') {
      dispatch({type: 'SET_MOUSE_MODE', mouseMode: 'NONE'});
      handlers.mouseMove = () => {}; // placeholder
      handlers.leftUp = (state, dispatch, gridPos) =>  {
        const rect = toRect(state.game.mouse.downPos, gridPos);
        if (editor.clipboardMode == 'COPY') {
          dispatch({type: 'COPY_ENTITIES', rect});
        } else if (editor.clipboardMode == 'PASTE') {
          dispatch({type: 'PASTE_ENTITIES', pastePos: gridPos});
        }
        setEditor({...editor, version: editor.version + 1});
      };
    } else if (editor.paletteMode == 'MARQUEE') {
      shouldInit = false;
      dispatch({type: 'SET_MOUSE_MODE', mouseMode: 'COLLECT'});
    } else {
      shouldInit = false;
    }
    if (shouldInit) {
      initMouseControlsSystem(store, handlers);
    }
    registerHotkeys(dispatch, editor, setEditor);
    render(game);
  }, [editor, editor.paletteMode]);

  // re-render when mouse is down and moving to draw marquee
  useEffect(() => {
    if (game.mouse.isLeftDown) {
      render(game);
    }
  }, [game.mouse.curPos])

  // do this one time to re-render on load
  useEffect(() => {
    setTimeout(
      () => {
        console.log("re-rendering");
        const nextState = {};
        let anyChanged = false;
        if (state.game.numPlayers != editor.numPlayers) {
          nextState.numPlayers = state.game.numPlayers;
        }
        if (state.game.gridWidth != editor.gridWidth) {
          nextState.gridWidth = state.game.gridWidth;
        }
        if (state.game.gridHeight != editor.gridHeight) {
          nextState.gridHeight = state.game.gridHeight;
        }
        setEditor({...editor, version: editor.version + 1, ...nextState});
      },
      500,
    );
  }, []);

  let palette = null;
  switch (editor.paletteMode) {
    case 'CREATE ENTITIES':
      palette = createEntitiesPalette(dispatch, state, editor, setEditor);
      break;
    case 'PHEROMONES':
      palette = pheromonePalette(dispatch, state, editor, setEditor);
      break;
    case 'COPY-PASTE':
      palette = copyPastePalette(dispatch, state, editor, setEditor);
      break;
    case 'MARQUEE':
      palette = marqueePalette(dispatch, state, editor, setEditor);
      break;
  }

  return (
    <div
      id="levelEditor"
      style={{
        position: 'absolute',
        height: '100%',
        width: 500,
        left,
        top: 0,
      }}
    >
    <b>Global Parameters:</b>
    <div>
      Number of Players:
      <NumberField
        value={editor.numPlayers}
        onChange={(numPlayers) => setEditor({...editor, numPlayers})}
      />
    </div>
    <div>
      Grid Width:
      <NumberField
        value={editor.gridWidth}
        onChange={(gridWidth) => setEditor({...editor, gridWidth})}
      />
    </div>
    <div>
      Grid Height:
      <NumberField
        value={editor.gridHeight}
        onChange={(gridHeight) => setEditor({...editor, gridHeight})}
      />
    </div>
    <div>
      <Button
        label="Submit Changes"
        onClick={() => {
          dispatch({
            type: 'SET_PLAYERS_AND_SIZE',
            numPlayers: editor.numPlayers,
            gridWidth: editor.gridWidth,
            gridHeight: editor.gridHeight,
          });
          setEditor({
            ...editor,
            playerID: editor.playerID > editor.numPlayers
              ? editor.numPlayers
              : editor.playerID,
            version: editor.version + 1,
          });
        }}
      />
    </div>
    <Divider />
    <div>
      <Dropdown
        options={['CREATE ENTITIES', 'PHEROMONES', 'COPY-PASTE', 'MARQUEE', 'NONE']}
        selected={editor.paletteMode}
        onChange={(paletteMode) => {
          setEditor({...editor, paletteMode});
          if (paletteMode == 'COPY-PASTE') {
            dispatch({type: 'SET_KEEP_MARQUEE', keepMarquee: true});
          } else {
            dispatch({type: 'SET_KEEP_MARQUEE', keepMarquee: false});
          }
        }}
      />
    </div>
    {palette}
    <Divider />
    <Divider />
    <b>Simulation Controls:</b>
    <div>
      <Button
        label={editor.started || game.time > 0 ? "Reset" : "Start"}
        disabled={false}
        onClick={() => {
          if (editor.started || game.time > 0) {
            setEditor({...editor, started: false});
            dispatch({type: 'STOP_TICK'});
            dispatch({type: 'SET_PLAYERS_AND_SIZE', reset: true});
          } else {
            setEditor({...editor, started: true});
            dispatch({type: 'START_TICK'});
          }
        }}
      />
      <Button
        label={
          state.game.tickInterval == null && state.game.time > 1
            ? 'Play' : 'Pause'
        }
        disabled={state.game.time <= 1}
        onClick={() => {
          if (state.game.tickInterval == null) {
            dispatch({type: 'START_TICK'});
          } else {
            dispatch({type: 'STOP_TICK'});
            setEditor({...editor, version: editor.version + 1});
          }
        }}
      />
      <Button
        label='Step (M)'
        disabled={state.game.time <= 1}
        onClick={() => {
          dispatch({type: 'TICK'});
        }}
      />
      <Button
        label='Step x10 (J)'
        disabled={state.game.time <= 1}
        onClick={() => {
          for (let i = 0; i < 10; i++) {
            dispatch({type: 'TICK'});
          }
        }}
      />
      <div>
        <Checkbox
          label="Show True Positions"
          checked={!!state.game.showTruePositions}
          onChange={shouldShow => dispatch({
            type: 'SHOW_DEBUG', shouldShow, showType: 'showTruePositions'
          })}
        />
      </div>
      <div>
        <Checkbox
          label="Show Ant Decision Weights"
          checked={!!state.game.showAgentDecision}
          onChange={shouldShow => dispatch({
            type: 'SHOW_DEBUG', shouldShow, showType: 'showAgentDecision'
          })}
        />
      </div>
      <div>
        <Checkbox
          label="Show Hitboxes"
          checked={!!state.game.showHitboxes}
          onChange={shouldShow => dispatch({
            type: 'SHOW_DEBUG', shouldShow, showType: 'showHitboxes'
          })}
        />
      </div>
      <div>
        <Checkbox
          label="Show True Hitboxes (slow)"
          checked={!!state.game.showTrueHitboxes}
          onChange={shouldShow => dispatch({
            type: 'SHOW_DEBUG', shouldShow, showType: 'showTrueHitboxes'
          })}
        />
      </div>
      <div>
        <Checkbox
          label="Show Positions In Front"
          checked={!!state.game.showPositionsInFront}
          onChange={shouldShow => dispatch({
            type: 'SHOW_DEBUG', shouldShow, showType: 'showPositionsInFront'
          })}
        />
      </div>
      <div>
        <Checkbox
          label="Show Entity IDs"
          checked={!!state.game.showEntityIDs}
          onChange={shouldShow => dispatch({
            type: 'SHOW_DEBUG', shouldShow, showType: 'showEntityIDs'
          })}
        />
      </div>
      <div>
        <Checkbox
          label="Pause Missiles"
          checked={!!state.game.pauseMissiles}
          onChange={pauseMissiles => dispatch({
            type: 'PAUSE_MISSILES', pauseMissiles,
          })}
        />
      </div>
      <div>
        <Checkbox
          label="Pause Power Consumption"
          checked={!!state.game.pausePowerConsumption}
          onChange={pausePowerConsumption => dispatch({
            type: 'PAUSE_POWER_CONSUMPTION', pausePowerConsumption,
          })}
        />
      </div>
      <div>
        <Checkbox
          label="Focus Controlled Entity"
          checked={!!state.game.focusedEntity}
          onChange={shouldShow => {
            if (state.game.focusedEntity) {
              dispatch({type: 'SET', value: null, property: 'focusedEntity'});
            } else {
              dispatch({
                type: 'SET', value: state.game.controlledEntity, property: 'focusedEntity',
              });
            }
          }}
        />
      </div>
      <div>
        <Button
          label='Reset View'
          onClick={() => {
            const focusedEntity = state.game.focusedEntity;
            if (focusedEntity != null) {
              const viewWidth = globalConfig.config.viewWidth;
              const viewHeight = globalConfig.config.viewHeight;
              const viewPos = {
                x: focusedEntity.position.x - viewWidth / 2,
                y: focusedEntity.position.y - viewHeight /2,
              };
              dispatch({type: 'SET_VIEW_POS', viewPos, viewWidth, viewHeight});
              setEditor({...editor, version: editor.version + 1});
            }
          }}
        />
        <Button
          label="Re-render"
          onClick={() => {
            game.viewImage.allStale = true;
            render(game);
          }}
        />
      </div>
    </div>
    <Divider />
    <b>Export:</b>
    <div>
      <Button
        label="Export as JSON"
        onClick={() => {
          const json = {
            numPlayers: state.game.numPlayers,
            gridWidth: state.game.gridWidth,
            gridHeight: state.game.gridHeight,
            // only export named upgrades
            upgrades: [],
            actions: state.editor.actions.slice(0, state.editor.index),
          };
          console.log(JSON.stringify(json));
        }}
      />
    </div>
    <div>
      <Button
        label="Import from JSON"
        onClick={() => {
          dispatch({type: 'SET_LEVEL', level: editor.importedLevel});
          dispatch({type: 'SET_PLAYERS_AND_SIZE'});
          setEditor({
            ...editor,
            numPlayers: editor.importedLevel.numPlayers,
            gridWidth: editor.importedLevel.gridWidth,
            gridHeight: editor.importedLevel.gridHeight,
          });
          setTimeout(
            () => setEditor({
              ...editor,
              numPlayers: editor.importedLevel.numPlayers,
              gridWidth: editor.importedLevel.gridWidth,
              gridHeight: editor.importedLevel.gridHeight,
              version: editor.version + 1,
            }),
            1000,
          );
        }}
      />
      <input type="text"
        value={JSON.stringify(editor.importedLevel)}
        onChange={(ev) => {
          const json = JSON.parse(ev.target.value);
          setEditor({...editor, importedLevel: json});
        }}
      />
    </div>

    </div>
  );
}

// ---------------------------------------------------------------
// Palettes
// ---------------------------------------------------------------

function createEntitiesPalette(dispatch, state, editor, setEditor) {
  const game = state.game;
  return (<div>
    <div>
      <Checkbox
        label="Delete"
        checked={editor.deleteMode}
        onChange={deleteMode => setEditor({...editor, deleteMode})}
      />
    </div>
    <div>
      Editing Player:
      <Dropdown
        options={Object.keys(state.game.players).map(p => parseInt(p))}
        selected={editor.playerID}
        onChange={(playerID) => setEditor({...editor, playerID})}
      />
    </div>
    Create Entity: <Dropdown
      options={Object.keys(Entities)}
      selected={editor.entityType}
      onChange={(entityType) => setEditor({...editor, entityType})}
    />
    {createEntityOptions(game, editor, setEditor)}
    <Button
      label="Undo (U)"
      disabled={game.tickInterval != null || editor.started}
      onClick={() => {
        dispatch({type: 'UNDO', reset: true});
        setEditor({...editor, version: editor.version + 1});
      }}
    />
    <Button
      label="Redo (O)"
      disabled={game.tickInterval != null || editor.started}
      onClick={() => {
        dispatch({type: 'REDO', reset: true});
        setEditor({...editor, version: editor.version + 1});
      }}
    />
  </div>);
}


function pheromonePalette(dispatch, state, editor, setEditor) {
  const config = globalConfig.pheromones;
  const game = state.game;
  return (
    <div>
      Selected Pheromone:
      <Dropdown
        options={Object.keys(config)}
        selected={editor.selectedPheromone}
        onChange={selectedPheromone => setEditor({
          ...editor, selectedPheromone,
          pheromoneQuantity: config[selectedPheromone].quantity,
        })}
      />
      <Slider
        key={'pheromoneSlider_' + editor.selectedPheromone}
        min={0} max={config[editor.selectedPheromone].quantity}
        value={editor.pheromoneQuantity}
        label={'Quantity'}
        onChange={(pheromoneQuantity) => setEditor({...editor, pheromoneQuantity})}
      />
      <div />
      <Checkbox
        label="Render Pheromone"
        checked={!!game.pheromoneDisplay[editor.selectedPheromone]}
        onChange={(isVisible) => dispatch({
          type: 'SET_PHEROMONE_VISIBILITY',
          pheromoneType: editor.selectedPheromone,
          isVisible,
        })}
      />
      <div />
      <Checkbox
        label="Render Pheromones As Values"
        checked={!!state.game.showPheromoneValues}
        onChange={(shouldShow) => dispatch({
          type: 'SHOW_DEBUG', shouldShow, showType: 'showPheromoneValues',
        })}
      />
    </div>
  );
}

function copyPastePalette(dispatch, state, editor, setEditor) {
  return (
    <div>
      Clipboard Mode:
      <Dropdown
        options={['COPY', 'PASTE']}
        selected={editor.clipboardMode}
        onChange={clipboardMode=> setEditor({
          ...editor, clipboardMode,
        })}
      />
    </div>
  );
}

function marqueePalette(dispatch, state, editor, setEditor) {
  return (
    <div>

    </div>
  );
}

// ---------------------------------------------------------------
// Hotkeys
// ---------------------------------------------------------------

function registerHotkeys(dispatch, editor, setEditor) {
  // dispatch({
  //   type: 'SET_HOTKEY', press: 'onKeyDown',
  //   key: 'O',
  //   fn: (s) => {
  //     const game = s.getState().game;
  //     dispatch({type: 'INCREMENT_ZOOM', zoom: 1});
  //     setEditor({...editor, version: editor.version + 1});
  //   }
  // });
  // dispatch({
  //   type: 'SET_HOTKEY', press: 'onKeyDown',
  //   key: 'M',
  //   fn: (s) => {
  //     dispatch({type: 'TICK'});
  //   }
  // });
  dispatch({
    type: 'SET_HOTKEY', press: 'onKeyDown',
    key: 'J',
    fn: (s) => {
      for (let i = 0; i < 8; i++) {
        dispatch({type: 'TICK'});
      }
    }
  });
  dispatch({
    type: 'SET_HOTKEY', press: 'onKeyDown',
    key: 'I',
    fn: (s) => {
      const game = s.getState().game;
      dispatch({type: 'INCREMENT_ZOOM', zoom: -1});
      setEditor({...editor, version: editor.version + 1});
    }
  });
  dispatch({
    type: 'SET_HOTKEY', press: 'onKeyDown',
    key: 'U',
    fn: (s) => {
      if (editor.started) return;
      const game = s.getState().game;
      dispatch({type: 'UNDO'});
      setEditor({...editor, version: editor.version + 1});
    }
  });
  dispatch({
    type: 'SET_HOTKEY', press: 'onKeyUp',
    key: 'O',
    fn: (s) => {
      setTimeout(() => {
        if (editor.started) return;
        const game = s.getState().game;
        dispatch({type: 'REDO'});
        setEditor({...editor, version: editor.version + 1});
      }, 10);
    }
  });
}

// ---------------------------------------------------------------
// Entity Creation
// ---------------------------------------------------------------

function createEntities(game, dispatch, editor, rect): void {
  let args = [];
  switch (editor.entityType) {
    case 'DIRT':
    case 'FOOD':
    case 'IRON':
    case 'STEEL':
    case 'COAL':
    case 'GLASS':
    case 'SILICON':
    case 'ICE':
    case 'SULPHUR':
      if (editor.subdividing) {
        args = [rect.width, rect.height];
      } else {
        args = [1, 1]; // width and height
      }
      break;
    case 'STONE':
      args = [editor.stoneSubType, 1, 1]; // width and height
      break;
    case 'DOODAD':
      args = [rect.width, rect.height, editor.doodad];
      break;
    case 'BACKGROUND':
      args = [rect.width, rect.height, editor.background]; // width and height
      break;
    case 'SOLAR_PANEL':
    case 'TURBINE':
    case 'AGENT':
    case 'PLAYER':
    case 'ANT':
    case 'BASE':
      args = [editor.playerID];
      break;
    case 'DYNAMITE':
      args = [editor.playerID, editor.explosionRadiusType];
      break;
    case 'MISSILE': {
      let warhead = null;
      if (editor.warheadType != 'NONE') {
        warhead = Entities[editor.warheadType].make(game, null, editor.playerID);
      }
      args = [editor.playerID, warhead, editor.theta, editor.velocity];
      break;
    }
    case 'BULLET': {
      args = [editor.playerID, editor.theta, editor.velocity];
      break;
    }
    case 'LASER_TURRET':
    case 'BASIC_TURRET':
    case 'MISSILE_TURRET':
      args = [editor.playerID];
      break;
    case 'FAST_TURRET': {
      args = [editor.playerID, editor.projectileType, editor.fireRate];
      break;
    }
    case 'WORM':
      // create initial segments:
      const randNeighbor = (pos) => {
        return Math.random() < 0.5
          ? add(pos, {x: 1, y: 0}) : add(pos, {x: 0, y: 1});
      };
      const segments = [];
      let position = {...rect.position};
      for (let i = 0; i < editor.numSegments - 1; i++) {
        const segmentPos = randNeighbor(position);
        segments.push(segmentPos);
        position = segmentPos;
      }
      args = [segments, editor.playerID];
      break;
    case 'TOKEN':
      args = [editor.playerID, editor.pheromoneType];
      break;
    case 'BULLDOZER':
    case 'DRILL':
    case 'DUMPTRUCK':
      args = [];
      break;
    default:
      console.error("no entity palette for ", editor.entityType);
  }
  dispatch({
    type: 'CREATE_ENTITIES',
    entityType: editor.entityType,
    rect, args,
  });
}


function createEntityOptions(game, editor, setEditor): React.Node {
  const options = [];
  switch (editor.entityType) {
    case 'DIRT':
    case 'FOOD':
      options.push(
        <Checkbox
          label="Subdividing"
          checked={editor.subdividing}
          onChange={subdividing => setEditor({...editor, subdividing})}
        />
      );
      break;
    case 'STONE':
      options.push(<span>
        SubType:
        <Dropdown
          options={['STONE', 'BRICK', 'KITCHEN']}
          selected={editor.stoneSubType}
          onChange={(stoneSubType) => setEditor({...editor, stoneSubType})}
        />
      </span>);
      break;
    case 'BACKGROUND':
      options.push(<span>
        Background:
        <Dropdown
          options={['FLOOR_TILE', 'SKYLINE']}
          selected={editor.background}
          onChange={(background) => setEditor({...editor, background})}
        />
      </span>);
      break;
    case 'TOKEN':
      options.push(<span>
        Pheromone Type:
        <Dropdown
          options={Object.keys(globalConfig.pheromones)}
          selected={editor.pheromoneType}
          onChange={(pheromoneType) => setEditor({...editor, pheromoneType})}
        />
      </span>);
      break;
    case 'DOODAD':
      options.push(<span>
        Doodad Type:
        <Dropdown
          options={['QUESTION']}
          selected={editor.doodad}
          onChange={(doodad) => setEditor({...editor, doodad})}
        />
      </span>);
      break;
    case 'WORM':
      options.push(<span>
        Number of Segments:
        <NumberField
          value={editor.numSegments}
          onChange={(numSegments) => setEditor({...editor, numSegments})}
        />
      </span>);
      break;
    case 'FAST_TURRET': {
      const projectileTypes = [];
      for (const entityType in Entities) {
        if (Entities[entityType].config.BALLISTIC) {
          projectileTypes.push(entityType);
        }
      }
      options.push(<span>
        Projectile Type:
        <Dropdown
          options={projectileTypes}
          selected={editor.projectileType}
          onChange={(projectileType) => setEditor({...editor, projectileType})}
        />
        FireRate:
        <NumberField
          value={editor.fireRate}
          onChange={(fireRate) => setEditor({...editor, fireRate})}
        />
      </span>);
      break;
    }
    case 'DYNAMITE': {
      options.push(<span>
        Explosion Radius Type:
        <Dropdown
          options={['CIRCULAR', 'HORIZONTAL', 'VERTICAL']}
          selected={editor.explosionRadiusType}
          onChange={(explosionRadiusType) => setEditor({...editor, explosionRadiusType})}
        />
      </span>);
      break;
    }
    case 'BULLET': {
      options.push(<span>
        Theta:
        <NumberField
          value={editor.theta}
          onChange={(theta) => setEditor({...editor, theta})}
        />
        Velocity:
        <NumberField
          value={editor.velocity}
          onChange={(velocity) => setEditor({...editor, velocity})}
        />
      </span>);
      break;
    }
    case 'MISSILE': {
      const warheadTypes = [];
      for (const entityType in Entities) {
        if (Entities[entityType].config.EXPLOSIVE) {
          warheadTypes.push(entityType);
        }
      }
      options.push(<span>
        Warhead Type:
        <Dropdown
          options={['NONE', ...warheadTypes]}
          selected={editor.warheadType}
          onChange={(warheadType) => setEditor({...editor, warheadType})}
        />
        Theta:
        <NumberField
          value={editor.theta}
          onChange={(theta) => setEditor({...editor, theta})}
        />
        Velocity:
        <NumberField
          value={editor.velocity}
          onChange={(velocity) => setEditor({...editor, velocity})}
        />
      </span>);
      break;
    }
  }

  return (
    <div>
      {options}
    </div>
  );
}

module.exports = LevelEditor;
