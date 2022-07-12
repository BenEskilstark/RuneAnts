// @flow

const {initState} = require('../state/state');
const {
  initGameState, initBaseState,
} = require('../state/gameState');
const {tickReducer} = require('./tickReducer');
const {gameReducer} = require('./gameReducer');
const {mouseReducer} = require('./mouseReducer');
const {hotKeysReducer} = require('./hotKeysReducer');
const {modalReducer} = require('./modalReducer');
const {addEntity} = require('../simulation/entityOperations');
const {sameArray} = require('../utils/helpers');
const levels = require('../levels/levels');

import type {State, Action} from '../types';

const rootReducer = (state: State, action: Action): State => {
  if (state === undefined) return initState();

  switch (action.type) {
    case 'START': {
      const {screen, isExperimental} = action;
      const game = initBaseState({x: 25, y: 25}, 1);
      game.isExperimental = isExperimental;
      game.sprites = {...state.sprites}
      return {
        ...state,
        // isMuted: !state.interactedWithIsMuted ? false : state.isMuted,
        isMuted: !state.interactedWithIsMuted ? true : state.isMuted,
        screen,
        game,
        campaign: {
          upgrades: [],
          currency: 0,

          level: 0,
          levelName: '',
          levelsCompleted: [],
        },
        editor: {
          actions: [],
          index: 0,
          clipboard: {}, // Rectangle
        },
      };
    }
    case 'SET_CURRENT_LEVEL_WON': {
      state.campaign.levelsCompleted.push(state.campaign.levelName);
      return state;
    }
    case 'SET_CURRENT_LEVEL_NAME': {
      state.campaign.levelName = action.levelName;
      return state;
    }
    case 'SET_SCREEN': {
      const {screen} = action;
      const nextState = {...state, screen};
      if (screen == 'EDITOR' && state.game != null) {
        nextState.game.isExperimental = true;
      }
      if (screen == 'GAME' || screen == 'EDITOR') {
        nextState.game.sprites = {...state.sprites};
      }
      return nextState;
    }
    case 'SET_IS_MUTED': {
      return {
        ...state,
        isMuted: action.isMuted,
        interactedWithIsMuted: true,
      };
    }
    case 'SET_LEVEL': {
      const {numPlayers, gridWidth, gridHeight, actions, upgrades} = action.level;
      const game = initBaseState({x: gridWidth, y: gridHeight}, numPlayers);
      // const nextState = loadLevelReducer(state, action);
      const nextState = {...state, game};
      nextState.editor.actions = [...action.level.actions];
      nextState.editor.index = nextState.editor.actions.length;
      nextState.game.isExperimental = !!action.isExperimental || state.screen == 'EDITOR';
      nextState.campaign.level += 1;
      return nextState;
    }
    case 'REDO':
      // HACK: it's about to get subtracted 1
      state.editor.index = Math.min(
        state.editor.index + 2,
        state.editor.actions.length + 1,
      );
      // Fall-through
    case 'UNDO':
      // state.editor.actions.pop();
      state.editor.index -= 1;
      // Fall-through
    case 'SET_PLAYERS_AND_SIZE': {
      const level = action;
      level.actions = state.editor.actions.slice(0, state.editor.index);
      if (action.numPlayers == null && state.game != null) {
        level.numPlayers = Object.keys(state.game.players).length;
        level.gridWidth = state.game.gridWidth;
        level.gridHeight = state.game.gridHeight;
        level.upgrades = [...state.campaign.upgrades];
      }
      if (action.numPlayers != null || level.reset) {
        const {numPlayers, gridWidth, gridHeight, actions, upgrades} = level;
        const game = initBaseState({x: gridWidth, y: gridHeight}, numPlayers);
        if (state.screen == 'EDITOR') {
          game.isExperimental = true;
        }
        let sprites = null;
        if (state.game != null && state.game.sprites != null && state.game.sprites['EGG1'] != null) {
          sprites = state.game.sprites;
        } else {
          sprites = state.sprites;
        }
        let viewPos = {x: 0, y: 0};
        let viewWidth = 32;
        let viewHeight = 18;
        if (state.game != null && state.game.viewPos != null) {
          viewPos = state.game.viewPos;
          viewWidth = state.game.viewWidth;
          viewHeight = state.game.viewHeight;
        }
        state.game = game;
        state.game.sprites = sprites;
        state.game.viewPos = viewPos;
        state.game.viewWidth = viewWidth;
        state.game.viewHeight = viewHeight;
      }
      // keep track of these across level reload
      const {viewPos, viewWidth, viewHeight, isExperimental, sprites, keepMarquee} = state.game;
      // re-load level
      state = loadLevelReducer(state, {level});
      state.game.keepMarquee = keepMarquee;
      state.game.viewPos = viewPos;
      state.game.viewWidth = viewWidth;
      state.game.viewHeight = viewHeight;
      state.game.isExperimental = isExperimental;
      state.game.sprites = sprites;
      if (state.screen == 'EDITOR') {
        state.game.isExperimental = true;
      }
      // HACK: have to not copy here in order for async level loading to work!
      return state;
    }
    case 'RETURN_TO_LOBBY':
      return {
        ...state,
        screen: 'LOBBY',
        game: null,
        editor: {},
        campaign: {},
      };
    case 'START_TICK':
    case 'STOP_TICK':
    case 'TICK': {
      if (!state.game) return state;
      return {
        ...state,
        game: tickReducer(state.game, action),
      };
    }
    case 'SET_MOUSE_POS':
    case 'SET_MOUSE_DOWN': {
      if (!state.game) return state;
      return {
        ...state,
        game: {
          ...state.game,
          mouse: mouseReducer(state.game.mouse, action),
        }
      }
    }
    case 'SET_MODAL':
    case 'DISMISS_MODAL':
      return modalReducer(state, action);
    case 'SET_HOTKEY':
    case 'SET_KEY_PRESS': {
      if (!state.game) return state;
      return {
        ...state,
        game: {
          ...state.game,
          hotKeys: hotKeysReducer(state.game.hotKeys, action),
        }
      }
    }
    case 'SET_SPRITE_SHEET':
      state.sprites[action.name] = action.img;
    case 'CREATE_ENTITIES':
    case 'DELETE_ENTITIES':
    case 'FILL_PHEROMONE':
    case 'COPY_ENTITIES':
    case 'PASTE_ENTITIES':
      if (state.screen == 'EDITOR' && action.type != 'SET_SPRITE_SHEET') {
        state.editor.actions = state.editor.actions.slice(0, state.editor.index);
        state.editor.actions.push(action);
        state.editor.index += 1;
      }
    case 'SET':
    case 'UPDATE_ALL_PHEROMONES':
    case 'SET_GAME_OVER':
    case 'CREATE_ENTITY':
    case 'DELETE_ENTITY':
    case 'SHOW_DEBUG':
    case 'SET_VIEW_POS':
    case 'SET_ON_FIRE':
    case 'UPDATE_TURBINE':
    case 'INCREMENT_ZOOM':
    case 'SET_PHEROMONE_VISIBILITY':
    case 'SET_FOCUSED':
    case 'SET_CONTROLLED':
    case 'MARK_FOR_DRILLING':
    case 'MARK_FOR_PICKUP':
    case 'MARK_FOR_PUTDOWN':
    case 'MARK_BLUEPRINT':
    case 'MARK_DIRT':
    case 'MARK_DIRT_PUTDOWN':
    case 'SWAP_MINI_MAP':
    case 'SET_TUTORIAL_FLAG':
    case 'SET_IS_RAINING':
    case 'SET_MOUSE_MODE':
    case 'SET_PLACE_TYPE':
    case 'COLLECT_ENTITIES':
    case 'SET_KEEP_MARQUEE':
    case 'PAUSE_MISSILES':
    case 'PAUSE_POWER_CONSUMPTION':
    case 'SET_TICKER_MESSAGE':
    case 'SET_DIFFICULTY':
    case 'SET_LAST_MISSILE_TIME':
    case 'SET_MISSILE_FREQUENCY':
    case 'SET_WAVE_INDEX':
    case 'SET_SENT_WARNING':
    case 'SET_IN_WAVE':
    case 'SUBTRACT_BASE_RESOURCES':
    case 'ENQUEUE_ENTITY_ACTION': {
      if (!state.game) return state;
      return {
        ...state,
        game: gameReducer(state.game, action),
      };
    }
    case 'SET_SPECIES': {
      const {species} = action;
      return {
        ...state,
        campaign: {
          ...state.campaign,
          species,
        },
      };
    }
    case 'UPGRADE': {
      return upgradeReducer(state, action);
    }
    case 'CLEAR_UPGRADES': {
      return {
        ...state,
        campaign: {
          ...state.campaign,
          upgrades: [],
        },
      };
    } case 'CLEAR_LEVEL_ONLY_UPGRADES': {
      return {
        ...state,
        campaign: {
          ...state.campaign,
          upgrades: state.campaign.upgrades.filter(u => u.levelOnly != true),
        },
      };
    }
  }
};

function loadLevelReducer(prevState: State, action: {level: mixed}): State {
  const {numPlayers, gridWidth, gridHeight, actions, upgrades} = action.level;
  let game = prevState.game;

  // apply upgrades
  let state = {...prevState, game};
  if (upgrades != null) {
    for (const upgrade of upgrades) {
      state = upgradeReducer(state, upgrade);
      let alreadyInCampaign = false;
      for (const up of state.campaign.upgrades) {
        if (up.name == upgrade.name) {
          alreadyInCampaign = true;
          break;
        }
      }
      if (!alreadyInCampaign) {
        state.campaign.upgrades.push(upgrade);
      }
    }
  }

  // apply game actions
  if (state.screen != 'EDITOR') {
    asyncApplyLevelActions(game, [...actions], actions.length);
  } else {
    for (let i = 0; i < actions.length; i++) {
      const levelAction = actions[i];
      const progress = ((i/actions.length) * 100).toFixed(1);
      console.log("loading: " + progress + "%");
      game = gameReducer(game, levelAction);
    }

    // NOTE: this is all moved to a callback of the asyncApplyLevelActions function
    // gameID incrementing tells Game UI components to refresh
    game.gameID = state != null && state.game != null && state.game.gameID != null
      ? state.game.gameID + 1 : 1;

  }

  return {
    ...state,
    game,
  };
}

function asyncApplyLevelActions(game, actions, totalActions) {
  if (actions.length == 0) {
    // gameID incrementing tells Game UI components to refresh
    // game.gameID = state != null && state.game != null && state.game.gameID != null
    //   ? state.game.gameID + 1 : 1;
    return;
  };
  game = gameReducer(game, actions.shift());
  const progress = (((totalActions - actions.length) / totalActions) * 100);
  game.loadingProgress = progress;
  setTimeout(() => asyncApplyLevelActions(game, actions, totalActions), 0);
}

function upgradeReducer(state: State, action): State {
  if (!state.game) return state;

  let updatedUpgrade = false;
  if (action.name != null) {
    for (const upgrade of state.campaign.upgrades) {
      if (upgrade.name == action.name && upgrade.path[0] == action.path[0]) {
        updatedUpgrade = true;
        upgrade.value = action.value;
        break;
      }
    }
  }
  if (!updatedUpgrade) {
    state.campaign.upgrades = [...state.campaign.upgrades, action];
  }
  return {
    ...state,
    game: gameReducer(state.game, action),
  };
}

module.exports = {rootReducer};
