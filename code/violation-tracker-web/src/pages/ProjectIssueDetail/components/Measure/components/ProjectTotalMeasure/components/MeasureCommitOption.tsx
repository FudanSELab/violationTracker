import { Modal } from 'antd';
import React, { Fragment } from 'react';
import intl from 'react-intl-universal';
import ModalChart from './ModalChart';
import ModalTable, { ProjectMeasureItem } from './ModalTable';

interface IProps {
  visible: boolean;
  currentRepoName: string;
  handleCancel: () => void;
  projectMeasure: ProjectMeasureItem[];
}

interface IState {
  visible: boolean;
  currentRepoName: string;
}

export default class MeasureCommitOption extends React.Component<
  IProps,
  IState
> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      visible: this.props.visible,
      currentRepoName: this.props.currentRepoName,
    };
  }

  showModal = () => {
    this.setState({
      visible: true,
    });
  };

  handleOk = () => {
    this.props.handleCancel();
    this.setState({
      visible: false,
    });
  };

  handleCancel = () => {
    this.props.handleCancel();
    this.setState({
      visible: false,
    });
  };

  UNSAFE_componentWillReceiveProps(nextProps: IProps) {
    if (
      nextProps.currentRepoName !== this.props.currentRepoName ||
      nextProps.visible !== this.props.visible
    ) {
      this.setState({
        currentRepoName: nextProps.currentRepoName,
        visible: nextProps.visible,
      });
    }
  }

  render() {
    let { visible } = this.state;
    return (
      <Fragment>
        <Modal
          title={intl.get('Basic Modal')}
          visible={visible}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
          width={'80%'}
        >
          <ModalChart projectMeasure={this.props.projectMeasure} />
          <ModalTable projectMeasure={this.props.projectMeasure} />
        </Modal>
      </Fragment>
    );
  }
} //度量标题及选项
