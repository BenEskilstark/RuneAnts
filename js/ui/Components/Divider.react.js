// @flow

const React = require('react');

type Props = {

};

function Divider(props: Props): React.Node {
  const {style} = props;
  return (
    <div
      style={{
        width: '100%',
        height: '0px',
        border: '1px solid black',
        ...style,
      }}
    >
    </div>
  );
}

module.exports = Divider;
