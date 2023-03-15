import { Component } from 'react';
import intl from 'react-intl-universal';
import { Button, Modal, Table, Tooltip } from 'antd';
import { getCommitList, postCommitScan } from '@/services/commit';
import { ColumnsType } from 'antd/lib/table';

interface IProps {
  data: any;
  record: any;
  onReload: () => void;
}
interface IState {
  visible: boolean;
  confirmLoading: boolean;
  commitData: any[];
  updateTag: number;
  isWhole: boolean;
  totalCount: number;
  currentPage: number;
  defaultPage: number;
  refreshLoading: boolean;
}

class OverStockButton extends Component<IProps, IState> {
  controller?: AbortController;
  columns: ColumnsType<API.CommitItem>;
  constructor(props: IProps) {
    super(props);
    if ('AbortController' in window) {
      this.controller = new window.AbortController();
    }
    this.state = {
      visible: false,
      confirmLoading: false,
      commitData: [],
      updateTag: 1,
      isWhole: false,
      totalCount: 0,
      currentPage: 1,
      defaultPage: 1,
      refreshLoading: true,
    };
    this.columns = [
      {
        title: 'Commit',
        dataIndex: 'commitId',
      },
      {
        title: intl.get('description'),
        dataIndex: 'message',
      },
      {
        title: intl.get('time'),
        dataIndex: 'commitTime',
      },
      {
        title: intl.get('status'),
        dataIndex: 'scanned',
        width: 80,
        render: (_, { scanned }) => (scanned ? '已扫描' : '未扫描'),
      },
      {
        title: intl.get('committer'),
        dataIndex: 'developer',
      },
      {
        title: '操作',
        key: 'action',
        render: (_, { scanned, commitId }) => {
          return (
            <>
              <Button
                type="link"
                size="small"
                disabled={scanned}
                onClick={() => {
                  this.handleCommitChange({
                    commitId,
                  });
                }}
              >
                开始扫描
              </Button>
            </>
          );
        },
      },
    ] as ColumnsType<API.CommitItem>;
  }

  shouldComponentUpdate() {
    if (this.state.updateTag === 0) return false;
    else return true;
  }

  componentWillUnmount() {
    // 若有未处理完的请求，则取消（适用于fetch）
    if ('AbortController' in window) {
      this.controller?.abort();
    }
  }

  showModal = () => {
    this.setState(() => ({
      commitData: [],
      defaultPage: 1,
      currentPage: 1,
    }));
    this.getCommit();
    this.setState({
      visible: true,
    });
  };

  // TODO，commit前端调用工具进行扫描
  handleCommitChange = (commitValue: any) => {
    if (commitValue.commitId) {
      postCommitScan(
        {
          projectId: this.props.record.uuid,
          category: this.props.record.type,
          commitId: commitValue.commitId,
        },
        sessionStorage.getItem('userToken') ?? '',
      ).then(() => {
        this.props.onReload();
        this.setState({
          visible: false,
          updateTag: 1,
          currentPage: 1,
          refreshLoading: true,
        });
      });
    } else console.error(intl.get('Please choose commit!'));
  };

  handleCancel = () => {
    this.setState(
      {
        visible: false,
        updateTag: 1,
        currentPage: 1,
        refreshLoading: true,
      },
      this.forceUpdate,
    );
  };

  getCommit = () => {
    this.setState({
      refreshLoading: true,
    });
    getCommitList(
      {
        repo_uuids: this.props.record.repoUuid,
        page: this.state.currentPage,
        ps: 10,
        is_whole: this.state.isWhole,
      },
      sessionStorage.getItem('userToken') ?? '',
    ).then((data) => {
      this.setState({
        refreshLoading: false,
      });
      if (typeof data !== 'boolean' && data !== null) {
        this.setState({
          commitData: data?.commitList ?? [],
          updateTag: 0,
          totalCount: data.total,
        });
      }
    });
  };

  changeIsWhole = () => {
    this.state.isWhole
      ? this.setState(
          () => ({
            isWhole: false,
            updateTag: 1,
            currentPage: 1,
          }),
          () => {
            this.getCommit();
          },
        )
      : this.setState(
          () => ({
            isWhole: true,
            updateTag: 1,
          }),
          () => {
            this.getCommit();
          },
        );
  };

  afterClose = () => {
    this.setState(() => ({
      currentPage: 1,
    }));
  };

  render() {
    const {
      visible,
      confirmLoading,
      refreshLoading,
      commitData,
      defaultPage,
      currentPage,
      totalCount,
    } = this.state;
    let displayOption = '';
    this.state.isWhole
      ? (displayOption = intl.get('display not scanned'))
      : (displayOption = intl.get('display all'));
    return (
      <div id="scanmodal">
        <Button
          className={'overStock'}
          type="link"
          size="small"
          onClick={() => {
            this.showModal();
          }}
        >
          <Tooltip title={intl.get('detail')}>{this.props.data}</Tooltip>
        </Button>
        <Modal
          width="80%"
          visible={visible}
          confirmLoading={confirmLoading}
          onCancel={this.handleCancel}
          wrapClassName={'scanModal'}
          afterClose={this.afterClose}
          footer={null}
        >
          <Button onClick={this.changeIsWhole}>{displayOption}</Button>
          <Table<API.CommitItem>
            rowKey="commitId"
            size="small"
            loading={refreshLoading}
            dataSource={commitData}
            columns={this.columns}
            pagination={{
              showSizeChanger: false,
              size: 'small',
              current: currentPage,
              defaultCurrent: defaultPage,
              pageSize: 10,
              total: totalCount,
              onChange: (current) => {
                this.setState(
                  {
                    currentPage: current,
                    defaultPage: current,
                    updateTag: 1,
                  },
                  () => {
                    this.getCommit();
                  },
                );
              },
            }}
          />
        </Modal>
      </div>
    );
  }
}

export { OverStockButton };
