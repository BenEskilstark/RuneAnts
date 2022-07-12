
const React = require('react');
const NumberField = require('./NumberField.react');
const {useState, useMemo, useEffect} = React;

/**
 *  props:
 *  min, max: number,
 *  value: ?number (min if null),
 *  onChange: (number) => void,
 *  step: ?number (1 if null),
 *  label: ?string,
 *  isFloat: ?boolean
 */
function Slider(props) {
  const {isFloat} = props;
  const label = (
    <div style={{display: 'inline-block'}}>
      {props.label}
    </div>
  );
  let value = props.value != null ? props.value : props.min;
  value = isFloat ? Math.floor(value * 10) : value;
  const displayValue = isFloat ? value / 10 : value;

  const min = isFloat ? props.min * 10 : props.min;
  const max = isFloat ? props.max * 10 : props.max;

  const originalValue = useMemo(() => {
    return displayValue;
  }, []);
  return (
    <div>
      {props.label != null ? label : null}
      <input type="range"
        id={'slider_' + label}
        min={min} max={max}
        value={value}
        onChange={(ev) => {
          const val = ev.target.value;
          props.onChange(parseFloat(isFloat ? val / 10 : val));
        }}
        step={props.step != null ? props.step : 1}
      />
      <div style={{display: 'inline-block'}}>
        <NumberField
          value={displayValue}
          onlyInt={!isFloat}
          onChange={val => {
            props.onChange(val);
          }}
          submitOnBlur={false}
        />
        ({originalValue})
      </div>
    </div>
  );
  // TODO slider originalValue should come from globalconfig
}

module.exports = Slider;
