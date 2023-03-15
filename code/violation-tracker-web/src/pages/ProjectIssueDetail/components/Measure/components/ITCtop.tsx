import { Component } from 'react';
import { Spin } from 'antd';
import { Chart, Geom, Axis, Tooltip, Coord, Label } from 'bizcharts';
import intl from 'react-intl-universal';
import DataSet from '@antv/data-set';
import { getIssueTypeCountData } from '../../../../../services/measure';
import { handleIssueTypeCountData } from '../util';
import transformIssueName from '../../../../../utils/transformIssueName';

interface IProps {
  repoUuid: string;
  signal?: AbortSignal;
}
interface IState {
  itcData: any;
  itcLoading: any;
}

class ITCTopDount extends Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      itcData: [],
      itcLoading: true,
    };
  }

  UNSAFE_componentWillMount() {
    // 点击项目进入时，等待获取repoId再发送请求
    if (this.props.repoUuid) {
      this.getIssueTypeCount(this.props.repoUuid);
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps: { repoUuid: string }) {
    if (this.props.repoUuid !== nextProps.repoUuid) {
      this.getIssueTypeCount(nextProps.repoUuid);
    }
  }

  getIssueTypeCount(repoUuid: string) {
    this.setState({ itcLoading: true });
    getIssueTypeCountData(
      {
        tool: sessionStorage.getItem('type') ?? '',
        repo_uuids: repoUuid,
      },
      sessionStorage.getItem('userToken') ?? '',
      this.props.signal,
    ).then((issueTypeCount) => {
      this.setState({ itcLoading: false });
      if (!issueTypeCount) return;
      const ds = new DataSet();
      let dv = ds.createView().source(handleIssueTypeCountData(issueTypeCount));
      dv.transform({
        type: 'sort-by',
        fields: ['Default'], // 根据指定的字段集进行排序，与lodash的sortBy行为一致
        order: 'DESC',
      });
      let itcData = [];
      if (dv.rows.length !== 0) {
        for (let i = Math.min(2, dv.rows.length - 1); i >= 0; i--) {
          dv.rows[i].Issue_Type = transformIssueName(dv.rows[i].Issue_Type);
          itcData.push(dv.rows[i]);
        }
      }
      this.setState({
        itcData,
      });
    });
  }

  render() {
    const { itcData, itcLoading } = this.state;
    return (
      <div>
        <Spin spinning={itcLoading}>
          <Chart
            placeholder
            height={300}
            width={450}
            data={itcData}
            padding={[100, 40, 'auto', 'auto']}
          >
            <Coord transpose />
            <Axis
              name="Issue_Type"
              label={{
                offset: 5,
                formatter(text) {
                  let arr =
                    intl.getInitOptions().currentLocale === 'en-US'
                      ? text.replace(/(\S+\s*){1,4}/g, '$&\n')
                      : // 中文匹配规则：匹配七个双字节符号或匹配一到四个单字节符号
                        transformIssueName(text).replace(
                          // eslint-disable-next-line no-control-regex
                          /([^\x00-\xff]{7}|([@'"a-zA-Z0-9_]+\s*){1,4})/g,
                          '$&\n',
                        );
                  return `${arr}`;
                },
              }}
            />
            <Axis name={'Default'} visible={false} />
            <Tooltip showTitle={false} />
            <Geom
              type="interval"
              position={'Issue_Type*Default'}
              color={['Issue_Type', ['green', '#fd4659', '#64bfa4']]}
            >
              <Label content={'Default'} offset={5} />
            </Geom>
          </Chart>
        </Spin>
      </div>
    );
  }
}

export default ITCTopDount;
