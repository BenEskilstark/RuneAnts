const React = require('react');
const {useState, useMemo, useEffect} = React;

/**
 * props:
 * value: number
 * onChange: (number) => void,
 * onlyInt: boolean, // only allow ints instead of floats
 * width: number,
 * submitOnEnter: boolean, // TODO: not implemented
 * submitOnBlur: boolean,
 */
const NumberField = (props) => {
  const {
    value, onChange, onlyInt, submitOnEnter, submitOnBlur,
  } = props;

  const [stateValue, setValue] = useState(value);
  useEffect(() => {
    setValue(value);
  }, [value]);

  const [isFocused, setFocus] = useState(false);

  useEffect(() => {
    // document.onkeydown = (ev) => {
    //   if (ev.keyCode == 13)  { // Enter
    //     if (isFocused) {
    //       submitValue(onChange, stateValue, onlyInt);
    //     }
    //   }
    // };
  }, [isFocused, stateValue]);


  return (
    <input type='text'
      style={{
        width: props.width != null ? props.width : 40
      }}
      value={stateValue}
      onFocus={() => {
        setFocus(true)
      }}
      onBlur={() => {
        setFocus(false);
        if (submitOnBlur) {
          submitValue(onChange, stateValue, onlyInt);
        }
      }}
      onChange={(ev) => {
        const nextVal = ev.target.value;
        if (isNaN(Number(nextVal))) return; // don't allow non-numerical input
        setValue(nextVal);
        if (!submitOnEnter && !submitOnBlur) {
          submitValue(onChange, nextVal, onlyInt);
        }
      }}
    />
  );

};

const submitValue = (onChange, nextVal, onlyInt) => {
  if (nextVal === '') {
    onChange(0);
  } else if (!onlyInt && nextVal[nextVal.length - 1] === '.') {
    onChange(parseFloat(nextVal + '0'));
  } else if (isNaN(Number(nextVal))) {
    return; // ignore NaNs
  } else {
    const num = onlyInt ? parseInt(nextVal) : parseFloat(nextVal);
    onChange(num);
  }
};

module.exports = NumberField;
