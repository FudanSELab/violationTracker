import { LockOutlined } from '@ant-design/icons';
import { Input, Progress } from 'antd';
import React, { ChangeEventHandler } from 'react';
import intl from 'react-intl-universal';

interface IProps {
  value?: string;
  onChange?: ChangeEventHandler<any>;
}

const ColorMap = {
  N: '#eee',
  L: '#FF4D4D',
  M: '#FF9900',
  H: '#52c41a',
};
const ProgressMap = {
  N: 0,
  L: 33,
  M: 67,
  H: 100,
};
const TextMap = {
  N: '无',
  L: '低',
  M: '中',
  H: '高',
};

const InputPassword: React.FC<IProps> = ({ value, onChange }) => {
  const [strength, setStrength] = React.useState<'L' | 'M' | 'H' | 'N'>('N');
  // Password strength meter
  const charMode = (iN: number) => {
    if (iN >= 48 && iN <= 57)
      // 数字
      return 1;
    if (iN >= 65 && iN <= 90)
      // 大写
      return 2;
    if (iN >= 97 && iN <= 122)
      // 小写
      return 4;
    else return 8;
  };

  // bitTotal函数，计算密码模式
  const bitTotal = (num: number) => {
    var modes = 0;
    for (let i = 0; i < 4; i++) {
      if (num & 1) modes++;
      num >>>= 1;
    }
    return modes;
  };
  // 返回强度级别
  const checkStrong = (sPW: string) => {
    if (sPW.length < 6) return 0;
    var Modes = 0;
    for (let i = 0; i < sPW.length; i++) {
      // 密码模式
      Modes |= charMode(sPW.charCodeAt(i));
    }
    return bitTotal(Modes);
  };
  // 更新密码强度
  const updateStrength = (
    e:
      | React.KeyboardEvent<HTMLInputElement>
      | React.FocusEvent<HTMLInputElement>,
  ) => {
    // @ts-ignore
    const value = e.target.value;
    if (value === null || value === '') {
      setStrength('N');
    } else {
      var S_level = checkStrong(value);
      switch (S_level) {
        case 0:
          setStrength('N');
          break;
        case 1:
          setStrength('L');
          break;
        case 2:
          setStrength('M');
          break;
        case 3:
          setStrength('H');
          break;
        default:
          setStrength('N');
      }
    }
  };
  return (
    <div>
      <Input.Password
        prefix={<LockOutlined className="site-form-item-icon" />}
        placeholder={intl.get('Password')}
        value={value}
        onChange={onChange}
        onBlur={updateStrength}
        onKeyUp={updateStrength}
        autoComplete="off"
      />
      <div style={{ textAlign: 'center', margin: '3px 0' }}>
        <Progress
          percent={ProgressMap[strength]}
          steps={15}
          strokeColor={ColorMap[strength]}
          format={() => TextMap[strength]}
        />
      </div>
    </div>
  );
};

export default InputPassword;
