import { Component } from 'react';
import intl from 'react-intl-universal';
import { LoadingOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';

interface IProps {
  cloneLineData: API.RepoCloneLineData;
  currentRepoName?: string;
  projectDetailData: any;
  measureLoading: boolean;
}

export default class TotalStatistics extends Component<IProps> {
  render() {
    const { projectDetailData, cloneLineData, measureLoading } = this.props;
    const cloneLines = cloneLineData.cloneLines;
    return (
      <div>
        <div style={{ marginBottom: 15, marginTop: 15, fontSize: '12px' }}>
          <span style={{ marginRight: 20 }}>
            {intl.get('last commit')}: {projectDetailData.commit_time ?? '未知'}
          </span>
          <span>
            {intl.get('commit by') + ': ' + projectDetailData.developer_name ??
              '未知'}
          </span>
        </div>
        <div id={'statusModules'}>
          <div>
            <div className="statusTitle">
              <Tooltip
                placement="topLeft"
                title={intl.get('Files Total Count')}
              >
                {intl.get('FILES')}
              </Tooltip>
            </div>
            <div>
              {measureLoading ? (
                <LoadingOutlined />
              ) : (
                projectDetailData.files ?? '-'
              )}
            </div>
          </div>
          <div>
            <div className="statusTitle">
              <Tooltip
                placement="topLeft"
                title={intl.get('Classes Total Count')}
              >
                {intl.get('CLASSES')}
              </Tooltip>
            </div>
            <div>
              {measureLoading ? (
                <LoadingOutlined />
              ) : (
                projectDetailData.classes ?? '-'
              )}
            </div>
          </div>
          <div>
            <div className="statusTitle">
              <Tooltip
                placement="topLeft"
                title={intl.get('Functions Total count')}
              >
                {intl.get('FUNCTIONS')}
              </Tooltip>
            </div>
            <div>
              {measureLoading ? (
                <LoadingOutlined />
              ) : (
                projectDetailData.functions ?? '-'
              )}
            </div>
          </div>
          <div>
            <div className="statusTitle">
              <Tooltip
                placement="topLeft"
                title={intl.get('Cyclomatic Complexity Number')}
              >
                {intl.get('CCN')}
              </Tooltip>
            </div>
            <div>
              {measureLoading ? (
                <LoadingOutlined />
              ) : (
                projectDetailData.ccn ?? '-'
              )}
            </div>
          </div>
          <div>
            <div className="statusTitle">
              <Tooltip
                placement="topLeft"
                title={intl.get('Non Commenting Source Statements')}
              >
                {intl.get('NCSS')}
              </Tooltip>
            </div>
            <div>
              {measureLoading ? (
                <LoadingOutlined />
              ) : (
                projectDetailData.ncss ?? '-'
              )}
            </div>
          </div>
          <div>
            <div className="statusTitle">
              <Tooltip
                placement="topLeft"
                title={intl.get('Multi Comment Lines')}
              >
                {intl.get('MULTICL')}
              </Tooltip>
            </div>
            <div>
              {measureLoading ? (
                <LoadingOutlined />
              ) : (
                projectDetailData.multi_comment_lines ?? '-'
              )}
            </div>
          </div>
          <div>
            <div className="statusTitle">
              <Tooltip
                placement="topLeft"
                title={intl.get('Single Comment Lines')}
              >
                {intl.get('SINGLECL')}
              </Tooltip>
            </div>
            <div>
              {measureLoading ? (
                <LoadingOutlined />
              ) : (
                projectDetailData.single_comment_lines ?? '-'
              )}
            </div>
          </div>
          <div>
            <div className="statusTitle">
              <Tooltip
                placement="topLeft"
                title={intl.get('Duplicated Source Statements')}
              >
                {intl.get('DSS')}
              </Tooltip>
            </div>
            <div>
              {measureLoading ? <LoadingOutlined /> : cloneLines ?? '-'}
            </div>
          </div>
          <div>
            <div className="statusTitle">
              <Tooltip
                placement="topLeft"
                title={intl.get('Duplicated Rate of Source Statements')}
              >
                {intl.get('D/NC')}
              </Tooltip>
            </div>
            <div>
              {measureLoading ? (
                <LoadingOutlined />
              ) : projectDetailData &&
                projectDetailData.ncss &&
                cloneLines / projectDetailData.ncss ? (
                (cloneLines / projectDetailData.ncss).toFixed(2)
              ) : (
                '-'
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
