// @flow

import type {Mouse, Action} from '../types';

const mouseReducer = (mouse: Mouse, action: Action): Mouse => {
  switch (action.type) {
    case 'SET_MOUSE_DOWN': {
      const {isLeft, isDown, downPos} = action;
      return {
        ...mouse,
        isLeftDown: isLeft ? isDown : mouse.isLeftDown,
        isRightDown: isLeft ? mouse.isRightDOwn : isDown,
        downPos: isDown && downPos != null ? downPos : mouse.downPos,
      };
    }
    case 'SET_MOUSE_POS': {
      const {curPos, curPixel} = action;
      return {
        ...mouse,
        prevPos: {...mouse.curPos},
        curPos,
        prevPixel: {...mouse.curPixel},
        curPixel,
      };
    }
  }
};

module.exports = {mouseReducer};
