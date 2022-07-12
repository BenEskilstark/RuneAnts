// @flow

const React = require('react');
const InfoHUD = require('./InfoHUD.react');

const BottomBar = (props): React.Node => {
  const {isExperimental, dispatch, game, mousePos} = props;

  const height = 150;
  const bottomPadding = 8;
  return (
    <div
      style={{
        position: 'absolute',
        top: window.innerHeight - height - bottomPadding,
        height,
        width: '100%',
        zIndex: 2,
        pointerEvents: 'none',
        // textShadow: '-1px -1px 0 #FFF, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff',
      }}
    >
    <InfoHUD game={game} mousePos={mousePos} />
    </div>
  );
};

module.exports = BottomBar;
