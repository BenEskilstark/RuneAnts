// @flow

const {config} = require('../config');
const {
  add, subtract, equals, makeVector, vectorTheta, multiply, floor,
} = require('../utils/vectors');
const {canvasToGrid, lookupInGrid} = require('../utils/gridHelpers');
const {throttle} = require('../utils/helpers');

const initMouseControlsSystem = (store, handlers) => {
  const {dispatch} = store;
  // const {
  //   leftDown, leftUp, rightDown, rightUp, mouseMove, scroll
  // } = handlers;

  if (handlers.mouseMove) {
    document.onmousemove = throttle(moveHandler, [store, handlers], 12);
    document.ontouchmove = (ev) => {
      if (ev.target.id === 'canvas') {
        ev.preventDefault();
      }
      moveHandler(store, handlers, ev);
    }
  } else {
    document.onmousemove = null;
    document.ontouchmove = null;
  }


  document.ontouchstart = (ev) => {
    onMouseDown(store, ev, handlers);
  }

  document.ontouchend = (ev) => {
    onMouseUp(store, ev, handlers);
  }

  document.ontouchcancel = (ev) => {
    onMouseUp(store, ev, handlers);
  }

  // if (handlers.leftDown || handlers.rightDown) {
    document.onmousedown = (ev) => {
      onMouseDown(store, ev, handlers);
    }
  // }

  // if (handlers.leftUp || handlers.rightUp) {
    document.onmouseup = (ev) => {
      onMouseUp(store, ev, handlers);
    }
  // }

  if (handlers.scroll) {
    let scrollLocked = false;
    document.onwheel = (ev) => {
      if (!scrollLocked) {
        onScroll(store, ev, handlers);
        scrollLocked = true;
        setTimeout(() => {scrollLocked = false}, 150);
      }
    }
  }

};

/////////////////////////////////////////////////////////////////////
// Scroll
////////////////////////////////////////////////////////////////////
const onScroll = (store, ev, handlers): void => {
  const mouseData = validateMouse(store, ev);
  if (mouseData == null) return;
  handlers.scroll(
    store.getState(),
    store.dispatch,
    ev.wheelDelta < 0 ? 1 : -1,
  );
};

/////////////////////////////////////////////////////////////////////
// Click
////////////////////////////////////////////////////////////////////

const onMouseDown = (store, ev, handlers): void => {
  let canvas = document.getElementById('canvas');
  // don't open the normal right-click menu
  if (canvas != null) {
    canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());
  }
  let topBar = document.getElementById('topBar');
  if (topBar != null) {
    topBar.addEventListener('contextmenu', (ev) => ev.preventDefault());
  }

  const mouseData = validateMouse(store, ev);
  if (mouseData == null) return;
  const {gridPos, state, game} = mouseData;
  const {dispatch} = store;

  if (ev.button == 0) { // left click
    const {game} = state;
    dispatch({
      type: 'SET_MOUSE_DOWN',
      isLeft: true, isDown: true, downPos: gridPos,
    });
    if (handlers.leftDown != null) {
      handlers.leftDown(state, dispatch, gridPos);
    }
  }
  if (ev.button == 2) { // right click
    const {game} = state;
    dispatch({
      type: 'SET_MOUSE_DOWN',
      isLeft: false, isDown: true, downPos: gridPos,
    });
    if (handlers.rightDown != null) {
      handlers.rightDown(state, dispatch, gridPos);
    }
  }
};

const onMouseUp = (store, ev, handlers): void => {
  const mouseData = validateMouse(store, ev);
  if (mouseData == null) return;
  const {gridPos, state, game} = mouseData;
  const {dispatch} = store;

  if (ev.button == 0) { // left click
    dispatch({type: 'SET_MOUSE_DOWN', isLeft: true, isDown: false});
    if (handlers.leftUp != null) {
      handlers.leftUp(state, dispatch, gridPos);
    }
  }
  if (ev.button == 2) { // right click
    dispatch({type: 'SET_MOUSE_DOWN', isLeft: false, isDown: false});
    if (handlers.rightUp != null) {
      handlers.rightUp(state, dispatch, gridPos);
    }
  }
};

////////////////////////////////////////////////////////////////////////////
// Mouse move
////////////////////////////////////////////////////////////////////////////
const moveHandler = (store, handlers, ev): void => {
  let canvas = document.getElementById('canvas');
  const {dispatch} = store;
  const mouseData = validateMouse(store, ev);
  if (mouseData == null) return;
  const {gridPos, state, game} = mouseData;

  const canvasPos = getMousePixel(ev, canvas);
  dispatch({type: 'SET_MOUSE_POS', curPos: gridPos, curPixel: canvasPos});
  if (handlers.mouseMove != null) {
    handlers.mouseMove(state, dispatch, gridPos, canvasPos);
  }
}

////////////////////////////////////////////////////////////////////////////
// click -> position helpers
////////////////////////////////////////////////////////////////////////////

const validateMouse = (store, ev) => {
  if (ev.target.id != 'canvas') return null;
  const state = store.getState();
  if (state.game == null) return null;
  const gridPos = getMouseCell(state.game, ev, canvas);
  if (gridPos == null) return null;
  const {game} = state;

  return {state, game, gridPos};
};

const getMouseCell = (game, ev, canvas): ?Vector => {
  const pixel = getMousePixel(ev, canvas);
  if (pixel == null) return null;
  return canvasToGrid(game, pixel);
};

const getMousePixel = (ev, canvas): ?Vector => {
  if (!canvas) {
    return null;
  }
  const rect = canvas.getBoundingClientRect();
  let x = ev.clientX;
  let y = ev.clientY;
  if (
    ev.type === 'touchstart' || ev.type === 'touchmove' || ev.type === 'touchend'
  ) {
    const touch = ev.touches[0];
    x = touch.clientX;
    y = touch.clientY;
  }
  const canvasPos = {
    x: x - rect.left,
    y: y - rect.top,
  };
  // return null if clicked outside the canvas:
  if (
    canvasPos.x < 0 || canvasPos.y < 0 ||
    canvasPos.x > config.canvasWidth || canvasPos.y > config.canvasHeight
  ) {
    return null;
  }
  return canvasPos;
};

module.exports = {initMouseControlsSystem};
