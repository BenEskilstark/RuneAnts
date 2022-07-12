// @flow

const React = require('react');
const Button = require('./Components/Button.react');
const Checkbox = require('./Components/Checkbox.react');
const Divider = require('./Components/Divider.react');
const Dropdown = require('./Components/Dropdown.react');
const Slider = require('./Components/Slider.react');
const {useState, useMemo, useEffect} = React;

import type {State, Action} from '../types';

type Props = {
  dispatch: (action: Action) => Action,
  state: State,
};

const globalConfig = {
  msPerTick: {min: 0, max: 5000, step: 10}, // need to restart tick interval

  // cpuMediaThreshold: {min: 5, max: 200, step: 5},
  // cpuMajorThreshold: {min: 5, max: 250, step: 5},
};

const playerConfig = {
};

const pherConfig = {
  quantity: {min: 0, max: 1000, step: 10},
  decayAmount: {min: 0, max: 10, step: 1, isFloat: true},
  dispersionRate: {min: 0, max: 1, step: 0.1, isFloat: true},
  dispersionThreshold: {min: 0, max: 1, step: 1, isFloat: true},
};

const taskConfig = {
};

function ExperimentalSidebar(props: Props): React.Node {
  const {dispatch, state} = props;
  const {game} = state;

  const [task, setTask] = useState('WANDER');
  const [pheromone, setPheromone] = useState('COLONY');

  return null;

  // const sliders = useMemo(() => {
  //   const sliders = [];
  //   for (const param in globalConfig) {
  //     const setting = globalConfig[param];
  //     const value = config[param];
  //     const label = param;
  //     sliders.push(
  //       <Slider
  //         key={'slider_' + param}
  //         min={setting.min} max={setting.max} step={setting.step}
  //         value={value} label={label}
  //         isFloat={setting.isFloat}
  //         onChange={(val) => {
  //           dispatch({type: 'UPGRADE', path: [param], value: val});
  //           if (param === 'msPerTick' && game.tickInterval != null) {
  //             dispatch({type: 'STOP_TICK'});
  //             dispatch({type: 'START_TICK'});
  //           }
  //         }}
  //       />
  //     );
  //   }
  //   return sliders;
  // }, []);

  // const playerID = game.playerID;

  // const pherSliders = useMemo(() => {
  //   const pherSliders = [];
  //   for (const param in pherConfig) {
  //     const setting = pherConfig[param];
  //     const value = config[playerID][pheromone][param];
  //     const label = param;
  //     pherSliders.push(
  //       <Slider
  //         key={'slider_' + pheromone + '_' + param}
  //         min={setting.min} max={setting.max} step={setting.step}
  //         value={value} label={label}
  //         isFloat={setting.isFloat}
  //         onChange={(val) => {
  //           dispatch({
  //             type: 'UPGRADE',
  //             path: [playerID, pheromone, param],
  //             value: val,
  //           });
  //         }}
  //       />
  //     );
  //   }
  //   return pherSliders;
  // }, [
  // ]);
  // return (
  //   <div
  //     id="sliderBar"
  //     style={{
  //       display: 'inline-block',
  //       float: 'left',
  //       height: config.canvasHeight,
  //     }}
  //   >
  //     <Button
  //       label="Reset All Sliders to Default Values"
  //       onClick={() => {
  //         dispatch({
  //           type: 'SET_CONFIG',
  //           config: makeConfig(
  //             {x: game.gridWidth, y: game.gridHeight},
  //             game.numPlayers,
  //           ),
  //         });
  //       }}
  //     />
  //     <Divider />
  //     {sliders}
  //     <Divider />
  //     {playerSliders}
  //     <Divider />
  //     <Dropdown
  //       options={[
  //         'COLONY', 'FOOD', 'EGG', 'LARVA', 'PUPA',
  //         'DIRT_DROP', 'ALERT', 'QUEEN_PHER', 'MOVE_LARVA_PHER',
  //         'CRITTER_PHER', 'MARKED_DIRT_PHER', 'QUEEN_ALERT',
  //         'QUEEN_FOLLOW',
  //       ]}
  //       selected={pheromone}
  //       onChange={setPheromone}
  //     />
  //     <Checkbox
  //       label="Render Pheromone"
  //       checked={!!game.pheromoneDisplay[pheromone]}
  //       onChange={(isVisible) => dispatch({
  //         type: 'SET_PHEROMONE_VISIBILITY',
  //         pheromoneType: pheromone,
  //         isVisible,
  //       })}
  //     />
  //     {pherSliders}
  //     <Divider />
  //     <Checkbox
  //       label="Color ants by task"
  //       checked={!!state.game.showTaskColors}
  //       onChange={(shouldShow) => dispatch({
  //         type: 'SHOW_DEBUG', shouldShow, showType: 'showTaskColors',
  //       })}
  //     />
  //     <Dropdown
  //       options={[
  //         'WANDER', 'EXPLORE', 'RETRIEVE', 'RETURN', 'DEFEND',
  //         'FEED_LARVA', 'MOVE_DIRT', 'MOVE_EGG', 'MOVE_LARVA',
  //         'MOVE_PUPA', 'GO_TO_DIRT', 'ATTACK', 'PATROL',
  //       ]}
  //       displayOptions={[
  //         'Wander (white)', 'Explore (purple)', 'Retrieve (brown)',
  //         'Return (black)', 'Defend (orange)', 'Feed Larva (blue)',
  //         'Move Dirt (yellow)', 'Move Egg (grey)', 'Move Larva (pink)',
  //         'Move Pupa (green)', 'Go to Dirt (steelblue)', 'Attack (orange)',
  //         'Patrol (red)',
  //       ]}
  //       selected={task}
  //       onChange={setTask}
  //     />
  //     {taskSliders}
  //   </div>
  // );
}

module.exports = ExperimentalSidebar;
