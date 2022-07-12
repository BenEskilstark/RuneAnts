// @flow

const React = require('react');
const Button = require('./Button.react');
const {isMobile} = require('../../utils/helpers');

type Props = {
  title: ?string,
  body: ?string,
  buttons: Array<{
    label: string,
    onClick: () => void,
  }>,
  height: ?number,
};

function Modal(props: Props): React.Node {
  const {content, title, body, buttons} = props;
  const height = props.height ? props.height : 450;

  // using 2 rects to properly position width and height
  const rect = document.getElementById('container').getBoundingClientRect();
  let canvasRect = null;
  const canvas = document.getElementById('canvas');
  if (canvas != null) {
    canvasRect = canvas.getBoundingClientRect();
  } else {
    canvasRect = rect;
  }

  const buttonHTML = buttons.map(b => {
    return (<Button
      key={"b_" + b.label}
      disabled={!!b.disabled}
      label={b.label} onClick={b.onClick}
    />);
  });

  const width = props.width ? props.width : Math.min(rect.width * 0.8, 350);
  return (
    <div
      style={{
        position: 'absolute',
        backgroundColor: 'whitesmoke',
        border: '1px solid black',
        padding: 4,
        boxShadow: '2px 2px #666666',
        borderRadius: 3,
        color: '#46403a',
        textAlign: 'center',
        width,
        top: isMobile() ? 0 : (canvasRect.height - height) / 2,
        left: (rect.width - width) / 2,
      }}
    >
      <h3><b>{title}</b></h3>
      {body}
      <div
        style={{

        }}
      >
        {buttonHTML}
      </div>
    </div>
  );
}

module.exports = Modal;
