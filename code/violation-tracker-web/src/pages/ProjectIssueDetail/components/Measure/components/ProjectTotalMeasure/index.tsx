import React from 'react';
import MeasureCommitOption from './components/MeasureCommitOption';
import '../../styles.less';

interface IProps {
  handleCancel: () => void;
  projectMeasure: any[];
  currentRepoName: string;
  visible: boolean;
}

interface IState {
  currentCommit: number;
  measureCommitID: string;
  currentRepoName: string;
  visible: boolean;
}

export default class ProjectTotalMeasure extends React.Component<
  IProps,
  IState
> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      currentCommit: -1,
      measureCommitID: '',
      currentRepoName: this.props.currentRepoName,
      visible: this.props.visible,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps: IProps) {
    if (nextProps !== this.props) {
      this.setState({
        currentCommit: nextProps.projectMeasure
          ? nextProps.projectMeasure.length - 1
          : -1,
        currentRepoName: nextProps.currentRepoName,
        visible: nextProps.visible,
      });
    }
  }

  render() {
    let { visible, projectMeasure } = this.props;
    let index = this.state.currentCommit;
    return (
      <div id={'projectTotalMeasure'}>
        {projectMeasure &&
        projectMeasure.length > 0 &&
        projectMeasure[index] ? (
          <MeasureCommitOption
            visible={visible}
            currentRepoName={this.state.currentRepoName}
            handleCancel={this.props.handleCancel}
            projectMeasure={this.props.projectMeasure}
          />
        ) : null}
        {/*<ProjectModuleMeasure index={index} projectMeasure={this.props.projectMeasure}/>*/}
      </div>
    );
  }
} //项目度量模块
