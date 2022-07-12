// @flow

const React = require('react');
const {config} = require('../config');
const {useEffect, useState, useMemo, Component} = React;

type Props = {
  dispatch: (action: Action) => void,
};

function Canvas(props: Props): React.Node {
  const {
    dispatch,
    innerWidth, innerHeight,
    isExperimental,
    focusedEntity,
  } = props;

  // calculate max canvas width (allows canvas sizing DOWN)
  let maxHeight = Math.min(2000, innerHeight, innerWidth * 1.33);
  let maxWidth = maxHeight * 0.75;

  if (config.useFullScreen && !isExperimental) {
    maxWidth = innerWidth;
    maxHeight = innerHeight;
    let sizeMult = 0.9;
    if (maxWidth < 600 || maxHeight < 800) {
      sizeMult = 0.75;
    }
    if (maxWidth > 1000 || maxHeight > 1000) {
      sizeMult = 1.25;
    }
    if (maxWidth > 1200 || maxHeight > 1200) {
      sizeMult = 1.3;
    }
    useEffect(() => {
      let viewPos = {x:0, y: 0};
      const viewWidth = maxWidth / (config.cellWidth * sizeMult);
      const viewHeight = maxHeight / (config.cellHeight * sizeMult);
      if (focusedEntity != null) {
        viewPos = {
          x: focusedEntity.position.x - viewWidth / 2,
          y: focusedEntity.position.y - viewHeight /2,
        };
      }
      dispatch({type: 'SET_VIEW_POS',
        viewPos, viewWidth, viewHeight,
      });
    }, [maxWidth, maxHeight]);

    if (maxWidth != config.canvasWidth) {
      config.canvasWidth = maxWidth;
    }
    if (maxHeight != config.canvasHeight) {
      config.canvasHeight = maxHeight;
    }
  } else if (isExperimental) {
    // HACK: for when opening up the editor UI in game mode
    config.canvasWidth = Math.min(config.canvasWidth, 1200);
  }

  const defaultStyle = {
    height: '100%',
    width: '100%',
    maxWidth,
    maxHeight,
    margin: 'auto',
    position: 'relative',
  };
  const experimentalStyle = {
    height: config.canvasHeight,
    width: config.canvasWidth,
    maxWidth: config.canvasWidth,
    maxHeight: config.canvasHeight,
    position: 'absolute',
    top: 0,
    left: 0,
  };

  return (
    <div id="canvasWrapper"
      style={isExperimental ? experimentalStyle : defaultStyle}
    >
      <canvas
        id="canvas" style={{
          backgroundColor: 'white',
          cursor: 'pointer',
        }}
        width={config.canvasWidth} height={config.canvasHeight}
      />
    </div>
  );
}

function withPropsChecker(WrappedComponent) {
  return class PropsChecker extends Component {
    componentWillReceiveProps(nextProps) {
      Object.keys(nextProps)
        .filter(key => {
          return nextProps[key] !== this.props[key];
        })
        .map(key => {
          console.log(
            'changed property:',
            key,
            'from',
            this.props[key],
            'to',
            nextProps[key]
          );
        });
    }
    render() {
      return <WrappedComponent {...this.props} />;
    }
  };
}

module.exports = React.memo(Canvas);
