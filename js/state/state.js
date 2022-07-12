// @flow

import type {State} from '../types';

const initState = (): State => {
  return {
    screen: 'LOBBY',
    game: null,
    isMuted: true,
    // players: [],
    modal: null,
    sprites: {},
  };
};

module.exports = {initState};
