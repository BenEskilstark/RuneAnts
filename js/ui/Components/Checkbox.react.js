
const React = require('react');

/**
 * Props:
 *  label: ?string
 *  checked: boolean
 *  onChange: (value: boolean) => void
 */
function Checkbox(props) {
  const {checked, label, onChange} = props;
  const checkbox = (
    <input
      type='checkbox'
      checked={checked}
      onChange={() => {
        onChange(!checked);
      }}
    />
  );
  if (label == null) {
    return checkbox;
  } else {
    return (
      <div
        style={{
          display: 'inline-block',
        }}
      >
      {label}{checkbox}
      </div>
    );
  }
}

module.exports = Checkbox;
