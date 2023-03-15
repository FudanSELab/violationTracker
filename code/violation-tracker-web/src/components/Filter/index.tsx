import { Component } from 'react';
import { Select } from 'antd';
const { Option } = Select;

type ValueType = number | string;
interface IProps {
  array: any[];
  placeholder: string;
  defaultValue?: ValueType[];
  disabled?: boolean;
  value?: ValueType[];
  selectStyle?: object;
  onChange?: (value: ValueType[]) => void;
}

class Filter extends Component<IProps> {
  render() {
    return (
      <Select
        mode="multiple"
        allowClear={true}
        disabled={this.props.disabled}
        onChange={this.props.onChange}
        style={this.props.selectStyle}
        placeholder={this.props.placeholder}
        defaultValue={this.props.defaultValue}
        //@ts-ignore
        value={this.props.value}
        optionFilterProp="children"
        dropdownClassName="typedrop"
        dropdownMatchSelectWidth
        filterOption={(input, option) => {
          return (option?.props?.value ?? '')
            .toLowerCase()
            .includes(input.toLowerCase());
        }}
        maxTagCount={1}
        maxTagTextLength={9}
      >
        {this.props.array.length > 0
          ? this.props.array.map((element: string | number) => (
              <Option key={element} value={element} title={`${element}`}>
                {element}
              </Option>
            ))
          : null}
      </Select>
    );
  }
}

export default Filter;
