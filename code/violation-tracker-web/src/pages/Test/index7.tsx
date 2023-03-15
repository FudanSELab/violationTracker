import { useCallback, useEffect, useState } from 'react';
import { Tree, Card, Select, Input, InputNumber } from 'antd';

import TreeMap3 from '@/components/graph/D3TreeMap3';
import IssueModalPlugin from '@/components/graph/D3TreeMap3/plugin/IssueModalPlugin';
import { useStores } from '@/models';
import { Observer } from 'mobx-react';

const { DirectoryTree } = Tree;

const testOptions = [
  {
    label: '一个文件的测试用例',
    value: 0,
  },
  {
    label: '重命名的测试用例',
    value: 1,
  },
  {
    label: '真实数据',
    value: 2,
  },
  {
    label: '输入 RepoUuid',
    value: 3,
  },
];

// const BEGIN_COMMIT_ID = '1';

const Test7 = () => {
  const [testValue, setTestValue] = useState<number>(3);
  const [repoUuid, setRepoUuid] = useState<string>(
    // 'f9f29181-d897-3e24-8185-361bfb2cf6e9',
    'ce84beed-d199-363f-acf8-2af8877d6ad7',
  );
  const [number, setNumber] = useState<number>(10);
  // const [beginCommitId, setBeginCommitId] = useState<string>(
  //   'eb621045750b1e500935939d4cb9290496ce7b4e',
  // );
  // const [endCommitId, setEndCommitId] = useState<string>(
  //   '3c187342808345c6bbc3922eaf93614bc77bd4b3',
  // );
  // const [loading, setLoading] = useState<boolean>(false);
  const { codePortraitStore } = useStores();
  // const [keys, setKeys] = useState<{ id: string; extra?: any }[]>([]);
  // const [fileTree, setFileTree] = useState<TreeMapData>();

  const queryFileEvoluationByFrameIdx = useCallback(
    (repoUuid, testValue) => async (idx: number) => {
      return codePortraitStore.getFileEvoluationMapByIdx({
        idx,
        repoUuid,
        testValue,
      });
    },
    [codePortraitStore],
  );

  useEffect(() => {
    if (testValue === 3 && (repoUuid ?? '') === '') return;
    // console.log(repoUuid);
    codePortraitStore.clear();
    codePortraitStore.initialCodePortraitDataByRepoUuid({
      repoUuid: repoUuid ?? '',
      repoName: 'project',
      testValue: testValue === 3 ? undefined : testValue,
      number,
      // beginCommitId,
      // endCommitId,
    });
  }, [codePortraitStore, testValue, repoUuid, number]);

  // useEffect(() => {
  //   const controller = new AbortController();
  //   let signal = controller.signal;
  //   setLoading(true);
  //   getCommitsAndFileTreeOfRepo(
  //     {
  //       type: testValue,
  //       repoUuid: '1',
  //       repoName: '1',
  //     },
  //     undefined,
  //     signal,
  //   ).then((data) => {
  //     if (data === null) return;
  //     setLoading(false);
  //     if (typeof data !== 'boolean') {
  //       setKeys(
  //         data.commits.map(({ commitId: id, commitDate, committer }) => ({
  //           id,
  //           extra: {
  //             commitDate,
  //             committer,
  //           },
  //         })),
  //       );
  //       setFileTree(data.fileTree);
  //     }
  //   });
  //   return () => {
  //     controller.abort();
  //   };
  // }, [testValue]);

  return (
    <Observer>
      {() => (
        <>
          <pre>
            {`
          /**
           *        |         LIVE(latest)         |         NIL(latest)          |
           * -------| LIVE(current) | NIL(current) | LIVE(current) | NIL(current) |
           * ADD    |     LIVE      |      -       |    WILL_NIL   |      -       |
           * CHANGE |     LIVE      |      -       |    WILL_NIL   |      -       |
           * KEEP   |     LIVE      |      -       |    WILL_NIL   |      -       |
           * DELETE |       -       |      -       |       -       |     NIL      |
           * HIDDEN |       -       |  WILL_LIVE   |       -       |     NIL      |
           * 当前版本总代码行 = LIVE(ADD) + LIVE(CHANGE) + LIVE(KEEP)
           * 新增最新版本留存 = LIVE(ADD)
           * 新增最新版本消失 = WILL_NIL(ADD)
           * 修改最新版本留存 = LIVE(CHANGE)
           * 修改最新版本消失 = WILL_NIL(CHANGE)
           * 不变最新版本留存 = LIVE(KEEP)
           * 不变最新版本消失 = WILL_NIL(KEEP)
           * 删除最新版本消失 = NIL(DELETE)
           * 当前不存在最新版本存在 = 未来新增 = WILL_LIVE(HIDDEN)
           * 当前不存在最新版本不存在 = 历史删除 = NIL(HIDDEN)
           * --------------------------------------------------
           * LIVE      = LIVE(latest) & LIVE(current)
           * WILL_LIVE = LIVE(latest) & NIL(current)
           * NIL       = NIL(latest)  & NIL(current)
           * WILL_NIL  = NIL(latest)  & LIVE(current)
           */`}
          </pre>
          <div style={{ display: 'flex' }}>
            <Card
              style={{
                minWidth: '250px',
                maxHeight: '100vh',
                overflow: 'auto',
              }}
              title="项目目录"
              bodyStyle={{ paddingRight: 0 }}
            >
              {codePortraitStore.fileBaseTree && (
                <DirectoryTree
                  style={{
                    whiteSpace: 'nowrap',
                    minWidth: 'fit-content',
                    paddingRight: 15,
                  }}
                  // @ts-ignore
                  titleRender={({ name }) => {
                    return name;
                  }}
                  // defaultExpandAll
                  treeData={codePortraitStore.fileBaseTree.treemap.children}
                />
              )}
            </Card>
            <Card
              title={
                <>
                  TreeMap
                  <Select
                    style={{ marginLeft: 10 }}
                    value={testValue}
                    options={testOptions}
                    onChange={(v) => setTestValue(v)}
                  />
                  {testValue === 3 && (
                    <Input.Group compact>
                      <InputNumber
                        style={{ width: 100 }}
                        // addonBefore="num"
                        defaultValue={number}
                        onChange={(e) => setNumber(e)}
                      />
                      {/* <Input
                        style={{ width: 200 }}
                        addonBefore="BC"
                        defaultValue={beginCommitId}
                        onChange={(e) => setBeginCommitId(e.target.value)}
                      />
                      <Input
                        style={{ width: 200 }}
                        addonBefore="AC"
                        defaultValue={endCommitId}
                        onChange={(e) => setEndCommitId(e.target.value)}
                      /> */}
                      <Input.Search
                        style={{ width: 250 }}
                        defaultValue={repoUuid}
                        onSearch={(v) => setRepoUuid(v)}
                      />
                    </Input.Group>
                  )}
                </>
              }
            >
              {/* <>{JSON.stringify(codePortraitStore.keys)}</> */}
              <TreeMap3
                configs={{
                  width: 1200,
                  height: 600,
                  paddingTop: 14,
                }}
                // loading={loading}
                keyList={codePortraitStore.keys}
                // data={fileTree}
                treeStructure={codePortraitStore.fileBaseTree}
                requestEvoluation={queryFileEvoluationByFrameIdx(
                  repoUuid,
                  testValue,
                )}
              >
                <IssueModalPlugin trigger="onclick" />
              </TreeMap3>
            </Card>
          </div>
        </>
      )}
    </Observer>
  );
};

export default Test7;
