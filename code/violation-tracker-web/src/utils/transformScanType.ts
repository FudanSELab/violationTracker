export type ScanServiceType =
  | 'issue'
  | 'clone'
  | 'codeTracker'
  | 'measure'
  | 'dependency'
  | 'taskManage'
  | 'tripartiteDependency';

export function transformScanType(scanType: string) {
  switch (scanType) {
    case 'issue':
    case 'sonarqube':
      return 'issue';
    case 'clone':
    case 'saga-cpu':
      return '克隆服务扫描';
    case 'codeTracker':
      return '追溯服务扫描';
    case 'javancss':
      return '基础度量扫描';
    case 'jira':
      return 'jira扫描';
    case 'measure':
      return 'measure服务扫描';
    case 'block':
      return 'block服务扫描';
    case 'dependency':
      return '依赖服务扫描';
    case 'taskManage':
      return 'taskManage扫描';
    case 'tripartiteDependency':
      return '三方依赖扫描';
    default:
      return scanType;
  }
}
