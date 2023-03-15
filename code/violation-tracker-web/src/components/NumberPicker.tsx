import { InputNumber } from 'antd';
import React, { useEffect } from 'react';

interface IProps {
  min?: number;
  max?: number;
  step?: number;
  formatter?: (value: number | undefined) => string;
  precision?: number;
  operator?: 'gt' | 'lt';
  // 可判断锁死最大最小值或者都锁死
  disabled?: 'Min' | 'Max' | 'Both';
  defaultValue?: number[];
  value?: number[];
  onChange?: (v: (number | undefined)[]) => void;
}

const NumberPicker: React.FC<IProps> = ({
  min,
  max,
  step,
  formatter,
  precision,
  operator,
  disabled,
  defaultValue,
  value,
  onChange,
}) => {
  const [first, setFirst] = React.useState<number | undefined>(
    value !== undefined ? value[0] : undefined,
  );
  const [last, setLast] = React.useState<number | undefined>(
    value !== undefined ? value[1] : undefined,
  );
  useEffect(() => {
    if (value !== undefined) {
      if (value[0] !== first) setFirst(value[0]);
      if (value[1] !== last) setLast(value[1]);
    }
  }, [last, first, value]);
  return (
    <>
      {/* {JSON.stringify({ value, first, last })} */}
      <InputNumber
        placeholder={operator === 'gt' ? '最大值' : '最小值'}
        defaultValue={defaultValue ? defaultValue[0] : undefined}
        disabled={disabled === 'Min' || disabled === 'Both'}
        min={min}
        max={max}
        formatter={formatter}
        value={first}
        step={step}
        precision={precision}
        onChange={(v) => {
          if (Number.isNaN(v)) return;
          setFirst(v !== undefined && v !== null ? +v : undefined);
          if (onChange)
            onChange([v !== undefined && v !== null ? +v : undefined, last]);
        }}
      />
      {operator === 'gt' ? ' > ' : ' < '}
      <InputNumber
        placeholder={operator === 'gt' ? '最小值' : '最大值'}
        defaultValue={defaultValue ? defaultValue[1] : undefined}
        disabled={disabled === 'Max' || disabled === 'Both'}
        value={last}
        step={step}
        min={min}
        max={max}
        formatter={formatter}
        precision={precision}
        onChange={(v) => {
          if (Number.isNaN(v)) return;
          setLast(v !== undefined && v !== null ? +v : undefined);
          if (onChange)
            onChange([first, v !== undefined && v !== null ? +v : undefined]);
        }}
      />
    </>
  );
};

export default NumberPicker;
