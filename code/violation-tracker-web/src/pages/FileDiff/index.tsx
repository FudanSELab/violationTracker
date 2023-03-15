import React, { useEffect, useMemo, useState } from 'react';

import './styles.css';
import { Spin } from 'antd';
import { parse } from 'query-string';
import FileDiffViewer from '@/components/FileDiffViewer';
import { useStores } from '@/models';
import { IssueItem } from '@/models/issueStore';
import {
  compressLineRange,
  expandLineRange,
  LineRange,
  mergeLineRange,
} from '@/utils/line-range';
import { useLocation } from 'react-router-dom';
import BugMarkPlugin from '@/components/FileDiffViewer/plugin/BugMarkPlugin';
import { getLanguage } from '@/utils/conversion';

interface IProps {}
interface IHistorySearch {
  repo_uuid: string;
  file_path: string;
  cur_commit: string;
  pre_commit: string;
}

const reduceIssueLineRange = (acc: LineRange[], issue: IssueItem) => {
  issue.lines.sort((a, b) => a - b);
  acc.push({
    start: issue.lines[0],
    end: Math.max(issue.lines[issue.lines.length - 1], issue.lines[0] + 1),
  });
  return acc;
};

const FileDiff: React.FC<IProps> = () => {
  const location = useLocation();
  const { projectStore, issueStore, userStore } = useStores();
  const [loading, setLoading] = useState<boolean>(true);
  const [preIssues, setPreIssues] = useState<IssueItem[]>([]);
  const [curIssues, setCurIssues] = useState<IssueItem[]>([]);
  const [issueLineRangeList, setIssueLineRangeList] = useState<LineRange[]>([]);

  const historySearch = useMemo(
    () => (parse(location.search) as unknown) as IHistorySearch,
    [location.search],
  );

  useEffect(() => {
    if (projectStore.projects === undefined) {
      projectStore.getProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLoading(true);
    issueStore
      .getIssueDiffList(historySearch, userStore.userToken)
      .then(([pre, cur]) => {
        setLoading(false);
        setPreIssues(pre);
        setCurIssues(cur);
        const prelineRangeList = pre
          .reduce(reduceIssueLineRange, [])
          .map(expandLineRange)
          .sort(({ start: a }, { start: b }) => a - b);
        const curlineRangeList = cur
          .reduce(reduceIssueLineRange, [])
          .map(expandLineRange)
          .sort(({ start: a }, { start: b }) => a - b);
        const mergeLineRangeList = compressLineRange(
          mergeLineRange(prelineRangeList, curlineRangeList),
          10,
        );
        setIssueLineRangeList(mergeLineRangeList);
      });
  }, [historySearch, issueStore, userStore.userToken]);

  const repoName = useMemo(
    () =>
      projectStore.repoList.find(
        ({ repo_id }) => repo_id === historySearch.repo_uuid,
      )?.name ?? '未知库',
    [historySearch.repo_uuid, projectStore.repoList],
  );
  const projectName = useMemo(
    () =>
      projectStore.getProjectByRepoUuid(historySearch.repo_uuid) ?? '未知项目',
    [historySearch.repo_uuid, projectStore],
  );

  return (
    <div id="file-trace">
      <div className="issloca">
        <div className="input">
          {/* <BackButton /> */}
          <div>
            文件 <b style={{ fontFamily: 'fantasy' }}>Diff</b>（{repoName} /{' '}
            {projectName}）{' '}
            <i style={{ color: 'gray' }}>
              ISSUE 个数: 左：{preIssues.length} - 右：
              {curIssues.length}
            </i>
          </div>
        </div>
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
          <Spin />
        </div>
      ) : (
        <div style={{ flex: '1' }}>
          {Array.isArray(issueLineRangeList) &&
          issueLineRangeList.length > 0 ? (
            issueLineRangeList.map((initialLineRange, index) => (
              <div
                style={{
                  maxWidth: '100vw',
                  width: '100vw',
                  overflow: 'auto',
                }}
                key={index}
              >
                <FileDiffViewer
                  id={`s${initialLineRange.start}e${initialLineRange.end}-${index}`}
                  language={getLanguage(historySearch.file_path)}
                  left={{
                    commitId: historySearch.pre_commit,
                    filePath: historySearch.file_path,
                  }}
                  right={{
                    commitId: historySearch.cur_commit,
                    filePath: historySearch.file_path,
                  }}
                  initialLines={initialLineRange}
                  repoUuid={historySearch.repo_uuid ?? ''}
                  plugins={[
                    // new ClickableMarkPlugin({ left: [], right: [] }),
                    new BugMarkPlugin({
                      left: preIssues,
                      right: curIssues,
                    }),
                  ]}
                />
              </div>
            ))
          ) : (
            <div
              style={{
                maxWidth: '100vw',
                width: '100vw',
                overflow: 'auto',
              }}
            >
              <FileDiffViewer
                id="file"
                language={getLanguage(historySearch.file_path)}
                left={{
                  commitId: historySearch.pre_commit,
                  filePath: historySearch.file_path,
                }}
                right={{
                  commitId: historySearch.cur_commit,
                  filePath: historySearch.file_path,
                }}
                // plugins={[new ClickableMarkPlugin({ left: [], right: [] })]}
                repoUuid={historySearch.repo_uuid ?? ''}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileDiff;
