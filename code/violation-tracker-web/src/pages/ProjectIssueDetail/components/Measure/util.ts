import {
  getCloneData,
  getCodeQualityData,
  getCommitStandardData,
  getDeveloperListByRepoUuid,
  getSelfIssueLifeCycleForDevelopers,
  getLifeCycleData,
  getLineCountData,
  getWorkloadData,
} from '../../../../services/measure';

export const getSinceAndUntil = (
  dateRange: string[],
  lastScanTime: string,
): string[] => {
  const since = dateRange[0];
  const lastTime =
    lastScanTime !== '' ? new Date(Date.parse(lastScanTime)) : '';
  const until =
    lastScanTime !== '' && lastTime < new Date(Date.parse(dateRange[1]))
      ? lastScanTime
      : dateRange[1];
  return [since, until];
};

export function mergeDeveloperInfoList<
  T extends API.DevelopersInfoInRepoUuidResponseItem,
  U extends API.DevelopersInfoInRepoUuidResponseItem
>(listA: T[], listB: U[]) {
  return listA.map((a) => ({
    ...a,
    ...listB.find(({ developerName }) => developerName === a.developerName),
  }));
}

export function handleIssueTypeCountData(data: any) {
  let newData = [];
  for (let item of data) {
    let object = {} as any;
    object['Issue_Type'] = Object.keys(item)[0];
    object['Default'] = item[Object.keys(item)[0]]['Default'];
    newData.push(object);
  }
  return newData;
}

export async function queryDeveloperDataByField(
  field: string,
  data: API.DevelopersInfoInRepoUuidRequestParams,
  userToken: string,
  signal?: AbortSignal,
) {
  switch (field) {
    case 'developerName': {
      return await getDeveloperListByRepoUuid(data, userToken, signal);
    }
    case 'clone': {
      return await getCloneData<
        API.TableListResponse<API.DeveloperAndRepoCloneMeasureItem>
      >(data, userToken, signal);
    }
    case 'commitStandard': {
      return await getCommitStandardData<
        API.TableListResponse<API.DeveloperCommitStandardItem>
      >(data, userToken, signal);
    }
    case 'openIssue': {
      return await getSelfIssueLifeCycleForDevelopers<
        API.TableListResponse<API.DeveloperSelfIssueLifeCycleItem>
      >(
        {
          ...data,
          tool: 'sonarqube',
          percent: -2,
          status: 'living',
          target: 'self',
        },
        userToken,
        signal,
      );
    }
    case 'quality': {
      return await getCodeQualityData<
        API.TableListResponse<API.DeveloperCodeQualityItem>
      >(data, false, userToken, signal);
    }
    case 'workload': {
      return await getWorkloadData<
        API.TableListResponse<API.DeveloperWorkLoadItem>
      >(data, userToken, signal);
    }
    case 'lifeCycle': {
      return await getLifeCycleData(data, 'live', userToken, signal);
    }
    case 'lineCount': {
      return await getLineCountData<API.DeveloperLineCountItem>(
        data,
        'developer',
        userToken,
        signal,
      );
    }
    default:
      console.error(`未知排序字段 ${field}`);
      return await null;
  }
}
