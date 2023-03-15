import { Component } from 'react';
import { Table, Modal, Button } from 'antd';
import intl from 'react-intl-universal';
import { TablePaginationConfig } from 'antd/lib/table';
import {
  getSinceAndUntil,
  mergeDeveloperInfoList,
  queryDeveloperDataByField,
} from '../util';
import { getCommitStandardData } from '@/services/measure';
import {
  getCloneData,
  getCodeQualityData,
  getDeveloperListByRepoUuid,
  getChangeFileNumData,
  getSelfIssueLifeCycleForDevelopers,
  getLifeCycleData,
  getLineCountData,
  getWorkloadData,
} from '../../../../../services/measure';

import '../styles.less';
import UserStore from '../../../../../models/userStore';
import { inject } from 'mobx-react';
import { SorterResult } from 'antd/lib/table/interface';

interface IProps {
  date: string[];
  currentRepoUuid: string;
  lastScanTime: string;
  signal?: AbortSignal;
  userStore?: UserStore;
}
interface IState {
  visible: boolean;
  commitList: any[];
  currentCommiter: string;
  commitPage: number;
  commitTotal: number;
  page: number;
  total: number;
  developersData: any[];
  loading: boolean;
  loadingList: {
    workload: boolean;
    quality: boolean;
    lifeCycle: boolean;
    openIssue: boolean;
    commitStandard: boolean;
    clone: boolean;
    lineCount: boolean;
  };
}

interface DeveloperDetailInfoItem {
  developerName: string;
  clone: API.DeveloperAndRepoCloneMeasureItem;
  commitStandard: API.DeveloperCommitStandardItem;
  openIssue: API.DevelopersInfoInRepoUuidResponseItem;
  quality: API.DeveloperCodeQualityItem;
  workload: API.DeveloperWorkLoadItem & API.DeveloperChangeFileNumItem;
  lifeCycle: API.DeveloperCodeLifecycleItem;
  lineCount: API.DeveloperLineCountItem;
}

@inject('userStore')
class ProjectRank extends Component<IProps, IState> {
  controller?: AbortController;
  constructor(props: IProps) {
    super(props);
    if ('AbortController' in window) {
      this.controller = new window.AbortController();
    }
    this.state = {
      // codeQualityData: [],
      developersData: [],
      visible: false,
      commitList: [],
      currentCommiter: '',
      page: 1,
      total: 0,
      commitPage: 1,
      commitTotal: 0,
      loading: false,
      loadingList: {
        workload: false,
        quality: false,
        lifeCycle: false,
        openIssue: false,
        commitStandard: false,
        clone: false,
        lineCount: false,
      },
    };
  }

  componentWillUnmount() {
    // 若有未处理完的请求，则取消（适用于fetch）
    if ('AbortController' in window) {
      this.controller?.abort();
    }
  }

  componentDidMount() {
    const { page } = this.state;
    this.getDataSource({ page });
  }

  componentDidUpdate(prevProps: IProps) {
    const { page } = this.state;
    if (
      prevProps.date !== this.props.date ||
      prevProps.currentRepoUuid !== this.props.currentRepoUuid
    ) {
      this.getDataSource({ page });
    }
  }

  getDataSource(params: { order?: string; asc?: boolean; page: number }) {
    this.getDeveloperNamesForDataSource(params).then((data) => {
      if (!data) return;
      this.raceToGetDeveloperDetailRawInfo(data);
    });
  }

  // 分页排序 获取数据
  async getDeveloperNamesForDataSource({
    order,
    asc,
    page,
  }: {
    order?: string;
    asc?: boolean;
    page: number;
  }) {
    this.setState({
      loading: true,
      loadingList: {
        workload: true,
        quality: true,
        lifeCycle: true,
        openIssue: true,
        commitStandard: true,
        clone: true,
        lineCount: true,
      },
    });
    const { date, currentRepoUuid, lastScanTime, userStore } = this.props;
    const userToken = userStore?.userToken ?? '';
    const signal = this.controller?.signal;
    // 计算时间段
    const [since, until] = getSinceAndUntil(date, lastScanTime);
    // 数据
    const data: API.DevelopersInfoInRepoUuidRequestParams = {
      repo_uuids: currentRepoUuid,
      order,
      asc,
      since,
      until,
      page,
      ps: 5,
    };
    let resp;
    if (!order || order === '') {
      resp = await getDeveloperListByRepoUuid(data, userToken, signal);
    } else {
      resp = await queryDeveloperDataByField(order, data, userToken, signal);
    }
    if (!resp || typeof resp === 'boolean') return;
    if (resp.rows.length === 0) {
      console.warn('未查找到数据');
      this.setState({
        loading: false,
      });
      return;
    }
    this.setState({
      loading: false,
      page,
      total: resp.records,
      developersData: resp.rows,
    });
    const developerNames = resp.rows.map(({ developerName }) => developerName);
    const dataForDeveloperNames = {
      repo_uuids: currentRepoUuid,
      since,
      until,
      developers: developerNames.join(','),
    };
    return dataForDeveloperNames;
  }

  raceToGetDeveloperDetailRawInfo(
    dataForDeveloperNames: API.DevelopersInfoInRepoUuidRequestParams,
  ) {
    const userToken = this.props.userStore?.userToken ?? '';
    const signal = this.controller?.signal;
    getCloneData<API.DeveloperAndRepoCloneMeasureItem[]>(
      dataForDeveloperNames,
      userToken,
      signal,
    ).then((clone) =>
      this.updateDataSource(Array.isArray(clone) ? clone : [], 'clone'),
    );
    getCommitStandardData<API.DeveloperCommitStandardItem[]>(
      dataForDeveloperNames,
      userToken,
      signal,
    ).then((commitStandard) =>
      this.updateDataSource(
        Array.isArray(commitStandard) ? commitStandard : [],
        'commitStandard',
      ),
    );
    getSelfIssueLifeCycleForDevelopers<API.DeveloperSelfIssueLifeCycleItem[]>(
      {
        ...dataForDeveloperNames,
        tool: 'sonarqube',
        percent: -2,
        status: 'living',
        target: 'self',
      },
      userToken,
      signal,
    ).then((openIssue) =>
      this.updateDataSource(
        Array.isArray(openIssue) ? openIssue : [],
        'openIssue',
      ),
    );
    getCodeQualityData<API.DeveloperCodeQualityItem[]>(
      dataForDeveloperNames,
      false,
      userToken,
      signal,
    ).then((quality) =>
      this.updateDataSource(Array.isArray(quality) ? quality : [], 'quality'),
    );
    Promise.all([
      getWorkloadData<API.DeveloperWorkLoadItem[]>(
        dataForDeveloperNames,
        userToken,
        signal,
      ),
      getChangeFileNumData<API.DeveloperChangeFileNumItem[]>(
        dataForDeveloperNames,
        userToken,
        signal,
      ),
    ])
      .then(([workloadData, changeFileNumData]) =>
        mergeDeveloperInfoList(
          Array.isArray(workloadData) ? workloadData : [],
          Array.isArray(changeFileNumData) ? changeFileNumData : [],
        ),
      )
      .then((workload) =>
        this.updateDataSource(
          Array.isArray(workload) ? workload : [],
          'workload',
        ),
      );
    getLifeCycleData(
      dataForDeveloperNames,
      'live',
      userToken,
      signal,
    ).then((table) =>
      this.updateDataSource(
        typeof table !== 'boolean' &&
          table !== null &&
          Array.isArray(table.rows)
          ? table.rows
          : [],
        'lifeCycle',
      ),
    );
    getLineCountData<API.DeveloperLineCountItem>(
      dataForDeveloperNames,
      'developer',
      userToken,
      signal,
    ).then((table) =>
      this.updateDataSource(
        typeof table !== 'boolean' &&
          table !== null &&
          Array.isArray(table.rows)
          ? table.rows
          : [],
        'lineCount',
      ),
    );
  }

  updateDataSource(
    rawInfo: API.DevelopersInfoInRepoUuidResponseItem[],
    field:
      | 'workload'
      | 'quality'
      | 'lifeCycle'
      | 'openIssue'
      | 'commitStandard'
      | 'clone'
      | 'lineCount',
  ) {
    const { loadingList, developersData } = this.state;
    const dataSource = this.processDataSource(developersData, rawInfo, field);
    this.setState({
      loadingList: {
        ...loadingList,
        [field]: false,
      },
      developersData: dataSource,
    });
  }

  // 处理获得的developer数据
  processDataSource(
    dataSource: DeveloperDetailInfoItem[],
    rawInfo: API.DevelopersInfoInRepoUuidResponseItem[],
    field:
      | 'workload'
      | 'quality'
      | 'lifeCycle'
      | 'openIssue'
      | 'commitStandard'
      | 'clone'
      | 'lineCount',
  ) {
    if (dataSource.length <= 0) return [];
    return dataSource.map((item) => {
      const findUniqueDeveloperName = (w: { developerName: string }) =>
        w.developerName === item.developerName;
      return {
        ...item,
        [field]: rawInfo.find(findUniqueDeveloperName),
      };
    });
  }

  // 不规范提交明细
  showCommit(developer: string) {
    const { date, currentRepoUuid, lastScanTime, signal } = this.props;
    const [since, until] = getSinceAndUntil(date, lastScanTime);
    this.setState({
      currentCommiter: developer,
      visible: true,
      commitPage: 1,
    });
    getCommitStandardData<API.DeveloperCommitStandardItem[]>(
      {
        repo_uuids: currentRepoUuid,
        since,
        until,
        developers: developer,
        page: 1,
        ps: 10,
      },
      this.props.userStore?.userToken ?? '',
      signal,
    ).then((data) => {
      if (!data || !Array.isArray(data) || data.length <= 0) return;
      this.setState({
        commitList: data[0].developerInvalidCommitInfo,
        commitTotal: data[0].developerInvalidCommitCount,
      });
    });
  }

  // 关闭不规范提交明细
  handleCancel = () => {
    this.setState({
      visible: false,
    });
  };

  // 不规范提交明细分页
  changeCommit(current: number) {
    const { currentCommiter } = this.state;
    const { date, currentRepoUuid, lastScanTime, signal } = this.props;
    const [since, until] = getSinceAndUntil(date, lastScanTime);
    getCommitStandardData<API.DeveloperCommitStandardItem[]>(
      {
        repo_uuids: currentRepoUuid,
        since,
        until,
        developers: currentCommiter,
        page: 1,
        ps: 10,
      },
      this.props.userStore?.userToken ?? '',
      signal,
    ).then((data) => {
      if (!data || !Array.isArray(data) || data.length <= 0) return;
      this.setState({
        commitPage: current,
        commitList: data[0].developerInvalidCommitInfo,
        commitTotal: data[0].developerInvalidCommitCount,
      });
    });
  }

  onTableChange = (
    pagination: TablePaginationConfig,
    _: Record<string, (string | number | boolean)[] | null>,
    sorter: SorterResult<any> | SorterResult<any>[],
  ) => {
    let order: string = ''; // 字段
    let asc: boolean = true; // 是否正序排序
    if (!Array.isArray(sorter)) {
      order = sorter.field as string;
      asc = sorter.order === 'ascend' ? true : false;
    } else {
      order = sorter[0].field as string;
      asc = sorter[0].order === 'ascend' ? true : false;
    }
    this.getDataSource({
      page: pagination.current ?? 1,
      order,
      asc,
    });
  };

  render() {
    const { date } = this.props;
    const { visible, commitList, commitPage, commitTotal } = this.state;
    const commitPagination: TablePaginationConfig = {
      current: commitPage,
      size: 'small',
      showQuickJumper: true,
      onChange: (current: number) => this.changeCommit(current),
      pageSize: 10,
      total: commitTotal,
      showTotal: (total: number) =>
        intl.get('total:') + `${total}` + intl.get('items'),
    };
    return (
      <div id="ProjectRank">
        <div style={{ marginTop: 10, fontSize: '12px' }}>
          {date[0] && date[1]
            ? date[0] + ' ' + intl.get('time to') + ' ' + date[1]
            : ''}
        </div>
        <div id={'developerTableBlock'}>
          <Modal
            title={intl.get('not standard commit')}
            visible={visible}
            onCancel={this.handleCancel}
            footer={[
              <Button onClick={this.handleCancel}>{intl.get('cancel')}</Button>,
            ]}
          >
            commitList: {JSON.stringify(commitList)}
            <Table<API.DeveloperCommitInfoItem>
              dataSource={commitList}
              pagination={commitPagination}
            />
          </Modal>
        </div>
      </div>
    );
  }
}

export default ProjectRank;
