// @flow

import type {State, Action} from '../types';

const modalReducer = (state: State, action: Action): State=> {
  switch (action.type) {
    case 'DISMISS_MODAL':
      return {
        ...state,
        modal: null,
      };
    case 'SET_MODAL': {
      const {modal} = action;
      return {
        ...state,
        modal,
      };
    }
  }
  return state;
}

module.exports = {modalReducer};
