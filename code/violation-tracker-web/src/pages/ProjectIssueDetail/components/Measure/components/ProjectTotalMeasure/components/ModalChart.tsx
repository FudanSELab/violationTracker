import { Select, Tooltip } from 'antd';
import React, { Fragment } from 'react';
import intl from 'react-intl-universal';
import { Axis, Chart, Geom } from 'bizcharts';

const Option = Select.Option;

interface IProps {
  projectMeasure: any[];
}
interface IState {
  columns: any;
  type: string;
  titleText: string;
}

export default class ModelChart extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      columns: {},
      type: 'files',
      titleText: 'FILES',
    };
  }

  handleChange = (e: string) => {
    let titleText = '';
    switch (e) {
      case 'files':
        titleText = 'FILES';
        break;
      case 'ccn':
        titleText = 'CCN';
        break;
      case 'classes':
        titleText = 'CLASSES';
        break;
      case 'functions':
        titleText = 'FUNCTIONS';
        break;
      case 'ncss':
        titleText = 'NCSS';
        break;
      case 'java_docs':
        titleText = 'Java Docs';
        break;
      case 'java_doc_lines':
        titleText = 'Java Doc Lines';
        break;
      case 'single_comment_lines':
        titleText = 'Single Comment Lines';
        break;
      case 'multi_comment_lines':
        titleText = 'Multi Comment Lines';
        break;
      default:
        titleText = '';
        break;
    }
    this.setState({
      type: e,
      titleText,
    });
  };

  render() {
    let { type, columns, titleText } = this.state;
    return (
      <Fragment>
        <Select
          value={intl.get(titleText)}
          style={{ width: 150 }}
          onChange={this.handleChange}
        >
          <Option value="files">{intl.get('FILES')}</Option>
          <Option value="ccn">{intl.get('CCN')}</Option>
          <Option value="classes">{intl.get('CLASSES')}</Option>
          <Option value="functions">{intl.get('FUNCTIONS')}</Option>
          <Option value="ncss">{intl.get('NCSS')}</Option>
          <Option value="java_docs">{intl.get('Java Docs')}</Option>
          <Option value="java_doc_lines">
            <Tooltip title={intl.get('Java Doc Lines')}>
              {intl.get('Java Doc Lines')}
            </Tooltip>
          </Option>
          <Option value="single_comment_lines">
            <Tooltip title={intl.get('Single Comment Lines')}>
              {intl.get('Single Comment Lines')}
            </Tooltip>
          </Option>
          <Option value="multi_comment_lines">
            <Tooltip title={intl.get('Multi Comment Lines')}>
              {intl.get('Multi Comment Lines')}
            </Tooltip>
          </Option>
        </Select>
        <Chart
          height={400}
          width={952}
          scale={columns}
          data={this.props.projectMeasure}
        >
          <Axis
            name="commit_time"
            title={{ text: intl.get('Commit Time') } as G2.AxisTitle}
          />
          <Axis name={type} />
          <Geom type="line" position={'commit_time*' + type} color={type} />
        </Chart>
      </Fragment>
    );
  }
}
