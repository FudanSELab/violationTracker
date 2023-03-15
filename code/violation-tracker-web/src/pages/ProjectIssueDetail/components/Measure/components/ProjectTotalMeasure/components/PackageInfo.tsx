import { MenuOutlined } from '@ant-design/icons';
import { Modal, Table } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import React, { Fragment } from 'react';
import intl from 'react-intl-universal';
import { ProjectMeasureItem } from './ModalTable';

interface IProps {
  repoId: string;
  commitId: string;
}
interface IState {
  visible: boolean;
  data: ProjectMeasureItem[];
  densityArray: string[];
}

export default class PackageInfo extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      visible: false,
      data: [],
      densityArray: [],
    };
  }

  showModal = () => {
    // this.getInfo();
    this.setState({
      visible: true,
    });
  };

  handleOk = () => {
    this.setState({
      visible: false,
    });
  };

  handleCancel = () => {
    this.setState({
      visible: false,
    });
  };

  render() {
    const columns: ColumnsType<ProjectMeasureItem> = [
      {
        title: intl.get('package-name'),
        className: 'packageInfoName',
        dataIndex: 'name',
      },
      {
        title: intl.get('CCN'),
        width: '70',
        dataIndex: 'ccn',
        className: 'packageInfo',
        render: (text) => {
          return parseFloat(text).toFixed(2);
        },
      },
      {
        title: intl.get('CLASSES'),
        dataIndex: 'classes',
        className: 'packageInfo',
      },
      {
        title: intl.get('FUNCTIONS'),
        dataIndex: 'functions',
        className: 'packageInfo',
      },
      {
        title: intl.get('NCSS'),
        dataIndex: 'ncss',
        className: 'packageInfo',
      },
      {
        title: intl.get('Java Docs'),
        dataIndex: 'javaDocs',
        className: 'packageInfo',
      },
      {
        title: intl.get('Java Doc Lines'),
        className: 'packageInfo',
        dataIndex: 'javaDocsLines',
      },
      {
        title: intl.get('Single Comment Lines'),
        className: 'packageInfo',
        dataIndex: 'singleCommentLines',
      },
      {
        title: intl.get('Multi Comment Lines'),
        className: 'packageInfo',
        dataIndex: 'multiCommentLines',
      },
    ];
    let densityArray = [];
    if (this.state.densityArray) {
      for (let key in this.state.densityArray) {
        let element = { name: key, key: this.state.densityArray[key] };
        densityArray.push(element);
      }
    }
    return (
      <Fragment>
        <span onClick={this.showModal}>
          <MenuOutlined />
        </span>
        <Modal
          title={intl.get('Basic Modal')}
          visible={this.state.visible}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
          width={'60%'}
        >
          <Table<ProjectMeasureItem>
            columns={columns}
            dataSource={this.state.data}
            size="middle"
          />
        </Modal>
      </Fragment>
    );
  }
}
