import { Table } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import React from 'react';
import intl from 'react-intl-universal';
import PackageInfo from './PackageInfo';

export interface ProjectMeasureItem {
  repo_id: string;
  commit_id: string;
  commit_time: string;
  files: string;
  ccn: string;
  classes: string;
  functions: string;
  ncss: string;
  java_docs: string;
  java_doc_lines: string;
  single_comment_lines: string;
  multi_comment_lines: string;
}

interface IProps {
  projectMeasure: ProjectMeasureItem[];
}

export default class ModelTable extends React.Component<IProps> {
  render() {
    const columns: ColumnsType<ProjectMeasureItem> = [
      {
        title: intl.get('Commit Time'),
        dataIndex: 'commit_time',
        className: 'packageInfo',
      },
      {
        title: intl.get('FILES'),
        width: 55,
        className: 'packageInfo',
        dataIndex: 'files',
      },
      {
        title: intl.get('CCN'),
        width: 45,
        className: 'packageInfo',
        dataIndex: 'ccn',
        render: (text: string) => {
          return parseFloat(text).toFixed(2);
        },
      },
      {
        title: intl.get('CLASSES'),
        width: 70,
        className: 'packageInfo',
        dataIndex: 'classes',
      },
      {
        title: intl.get('FUNCTIONS'),
        width: 85,
        className: 'packageInfo',
        dataIndex: 'functions',
      },
      {
        title: intl.get('NCSS'),
        width: 60,
        className: 'packageInfo',
        dataIndex: 'ncss',
      },
      {
        title: intl.get('Java Docs'),
        width: 80,
        dataIndex: 'java_docs',
      },
      {
        title: intl.get('Java Doc Lines'),
        dataIndex: 'java_doc_lines',
      },
      {
        title: intl.get('Single Comment Lines'),
        dataIndex: 'single_comment_lines',
      },
      {
        title: intl.get('Multi Comment Lines'),
        dataIndex: 'multi_comment_lines',
      },
      {
        title: intl.get('package info'),
        className: 'packageInfo',
        width: 120,
        dataIndex: '',
        render: (_: any, record) => {
          return (
            <div>
              <PackageInfo
                repoId={record.repo_id}
                commitId={record.commit_id}
              />
            </div>
          );
        },
      },
    ];
    return (
      <Table<ProjectMeasureItem>
        columns={columns}
        dataSource={this.props.projectMeasure}
        size="middle"
      />
    );
  }
}
