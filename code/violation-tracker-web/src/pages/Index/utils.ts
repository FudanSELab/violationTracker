export function getFirstProject(projectSimpleList: API.ProjectSimpleItem[]) {
  const project = projectSimpleList.find(
    ({ projectName }) => projectName === '平台',
  );
  return project ?? projectSimpleList[0];
}

export function transformProjectName2Id(params: any) {
  // 转换传入参数语义
  params.projectIds = params.projectName;
  params.projectName = [];
  return params;
}
