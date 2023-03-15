// import { useEffect, useState, useMemo } from 'react';
// import { Tree, Card } from 'antd';
// // import TreeMap from '@/components/graph/D3TreeMap';
// import {
//   compressTree,
//   createFutureLineMap,
//   fileList2TreeList,
//   markStockLinesWithFutureTag,
//   mergeLines2Files,
//   transformFileChangeIncremental2Stock,
//   transformLineChangeIncremental2Stock,
// } from './CodePortrait/utils';

import FileDiffViewer from '@/components/FileDiffViewer';
import BugMarkPlugin from '@/components/FileDiffViewer/plugin/BugMarkPlugin';
import ClickableMarkPlugin from '@/components/FileDiffViewer/plugin/ClickableMarkPlugin';
import RetrospectedMarkPlugin from '@/components/FileDiffViewer/plugin/RetrospectedMarkPlugin';

// import CODE_PORTRAIT from './CodePortrait/code-portrait.json';
// // import LINE_FIELD from './CodePortrait/line-field.json';
// // import LINE_METHOD from './CodePortrait/line-method.json';
// import LINE_STATEMENT from './CodePortrait/line-statement.json';
// import TreeMap2 from '@/components/graph/D3TreeMap2';

// const { DirectoryTree } = Tree;

// const Test5 = () => {
//   // const [count, setCount] = useState(0);
//   // const [animation, setAnimation] = useState(false);
//   // const [sortTransition, setSortTransition] = useState(true);
//   const [keys, setKeys] = useState<{ id: string; extra?: any }[]>([]);
//   const [fileTree, setFileTree] = useState<{
//     key: string;
//     treemap: CP.FileTreeItem;
//   }>();

//   const lineStocks = useMemo(() => {
//     const stocks = transformLineChangeIncremental2Stock(
//       LINE_STATEMENT as CP.CommitLineIncrementalItem[],
//     );
//     const futureMap = createFutureLineMap(stocks[stocks.length - 1].lines);
//     return stocks.map((stock) => {
//       return {
//         commitId: stock.commitId,
//         commitDate: stock.commitDate,
//         lines: markStockLinesWithFutureTag(stock.lines, futureMap),
//       };
//     });
//   }, []);

//   useEffect(() => {
//     const { commits, fileList } = transformFileChangeIncremental2Stock(
//       CODE_PORTRAIT.slice(0, 20) as CP.CommitFileIncrementalItem[],
//     );
//     // console.log(commits, fileList);
//     lineStocks.forEach((lineStock) => {
//       const detailIdx = commits.findIndex(
//         ({ commitId }) => commitId === lineStock.commitId,
//       );
//       if (detailIdx < 0) return;
//       mergeLines2Files(fileList, detailIdx, lineStock.lines);
//     });
//     const fileTree = {
//       key: 'Project-master',
//       treemap: {
//         name: 'Project-master',
//         key: 'project',
//         children: fileList2TreeList(fileList).map(compressTree).flat(),
//       },
//     };
//     setKeys(
//       commits.map(({ commitId: id, commitDate: extra }) => ({ id, extra })),
//     );
//     setFileTree(fileTree);
//   }, [lineStocks]);

//   return (
//     <div style={{ display: 'flex' }}>
//       <Card
//         style={{ minWidth: '250px', maxHeight: '100vh', overflow: 'auto' }}
//         title="项目目录"
//         bodyStyle={{ paddingRight: 0 }}
//       >
//         {fileTree && (
//           <DirectoryTree
//             style={{
//               whiteSpace: 'nowrap',
//               minWidth: 'fit-content',
//               paddingRight: 15,
//             }}
//             // @ts-ignore
//             titleRender={({ name }) => {
//               return name;
//             }}
//             // defaultExpandAll
//             treeData={fileTree.treemap.children}
//           />
//         )}
//       </Card>
//       <Card title="TreeMap">
//         {/* <Row>
//           <Col span={5}>
//             <Checkbox
//               checked={animation}
//               onChange={(e) => setAnimation(e.target.checked)}
//             >
//               逐帧动画
//             </Checkbox>
//           </Col>
//           <Col span={5}>
//             <Checkbox
//               checked={sortTransition}
//               onChange={(e) => setSortTransition(e.target.checked)}
//             >
//               动画是否溯源
//             </Checkbox>
//           </Col>
//           <Col span={5}>
//             <InputNumber
//               min={0}
//               max={fileTreeList.length - 1}
//               defaultValue={count}
//               onChange={(e: number) => {
//                 setAnimation(false);
//                 setCount(e);
//               }}
//             />
//           </Col>
//         </Row> */}
//         {fileTree !== undefined && (
//           <TreeMap2
//             configs={{
//               width: 1200,
//               height: 600,
//               // tileType: 'treemapResquarify',
//               // maxLayout: false,
//               paddingTop: 14,
//             }}
//             keyList={keys}
//             data={fileTree}
//           />
//         )}
//       </Card>
//     </div>
//   );
// };

const Test5 = () => (
  <>
    <FileDiffViewer
      id="file"
      language={'java'}
      left={{
        commitId: '9f2b4820847c5748860e8eba5c632467d1c701f8',
        filePath:
          'playwright/src/main/java/com/microsoft/playwright/impl/FrameImpl.java',
      }}
      right={{
        commitId: 'd291a64e11ff77f3e569a70c8d4770e35ac4a43f',
        filePath:
          'playwright/src/main/java/com/microsoft/playwright/impl/FrameImpl.java',
      }}
      renderTitle={() => <div>hello</div>}
      plugins={[
        new ClickableMarkPlugin({ left: [], right: [false, true] }),
        new BugMarkPlugin({
          left: [],
          right: [
            {
              type: 'test',
              detail: 'test',
              lines: [1, 2, 3, 4],
            },
          ],
        }),
        new RetrospectedMarkPlugin({
          left: [1, 2, 3],
          right: [1, 2, 3, 4],
        }),
      ]}
      repoUuid={'174c91be-fb9a-11eb-ac00-59f87a4baf36'}
    />
  </>
);

export default Test5;
