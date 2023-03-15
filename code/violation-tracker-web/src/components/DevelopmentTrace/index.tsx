// import React from 'react';
// import html2canvas from 'html2canvas';
// import './styles.less';
// import { DatePicker, Tooltip, Button } from 'antd';
// import { changeBackgroundColor, getRandomColor } from '@/color';
// import intl from 'react-intl-universal';
// import { disabledDate, disabledRangeTime } from '@/utils/time';
// import { getCurrentDateForLastWeek } from '@/utils/getDuration';
// import { jsPlumb } from 'jsplumb';
// import play from '@img/play.png';
// import stop from '@img/stop.png';
// import echarts from 'echarts';
// import * as testData from './testData';
// import HistoryContext from '../../pages/historyContext';
// import { LoadingOutlined } from '@ant-design/icons';
// import {
//   getAllDevelopmentHistory,
//   getFileHistoryInfoListByCommitId,
// } from '@/services/file';
// import { getCommitHistoryInfoList } from '@/services/commit';

// // let timerID = 0;
// let commitLoading = true;
// let jsplumbInstance = jsPlumb.getInstance();
// jsplumbInstance.setSuspendDrawing(false, true);
// let timeline: echarts.ECharts;

// interface IProps {
//   projectName: string;
//   currentRepoID: string;
//   currentTraceRadio: string;
//   currentRadio: string;
//   onRef: (ref: DevelopmentTrace) => void;
// }
// interface IState {
//   currentProject: string;
//   projectList: any[];
//   dateRange: string[];
//   filesData: any[];
//   shouldGetHistory: boolean;
//   timelineData: any;
//   commitLoading: boolean;
//   buttonText: string;
//   commitMessage: any;
//   autoPlay: boolean;
//   currentCommitIndex: number;
//   // timerID: number;
//   timelineHeight: number;
//   currentCommit: any;
//   commits: {
//     name?: string;
//     x?: number;
//     y?: number;
//     time_subtract?: number;
//     developer_name?: string;
//     first_parent_commit_id?: string;
//     second_parent_commit_id?: string;
//     index?: number;
//     bro?: any;
//     commit_message?: string;
//     commitId: string;
//     commitTime: string;
//     parent1: string;
//   }[];
//   commitsData: any;
//   filesInfo: any[];
//   firstGetAllFiles: boolean;
//   originCommitsData: any[];
//   maxColumnLength: number;
//   linksData: any[];
// }

// class DevelopmentTrace extends React.Component<IProps, IState> {
//   timerID?: NodeJS.Timeout;
//   controller?: AbortController;
//   constructor(props: IProps) {
//     super(props);
//     if ('AbortController' in window) {
//       this.controller = new window.AbortController();
//     }
//     this.state = {
//       currentProject: props.projectName,
//       projectList: [],
//       dateRange: getCurrentDateForLastWeek(),
//       filesData: [],
//       shouldGetHistory: true,
//       timelineData: {},
//       commitLoading: true,
//       buttonText: intl.get('showLinks'),
//       commitMessage: testData['message_5'],
//       autoPlay: false,
//       currentCommitIndex: 0,
//       timelineHeight: 400,
//       currentCommit: {},
//       commits: [],
//       commitsData: testData['data_5'],
//       filesInfo: [],
//       firstGetAllFiles: true,
//       originCommitsData: [],
//       maxColumnLength: 0,
//       linksData: [],
//     };
//     this.showLinksOrNot = this.showLinksOrNot.bind(this);
//     this.getAllFilesHistory = this.getAllFilesHistory.bind(this);
//     this.setCommitHeight = this.setCommitHeight.bind(this);
//   }

//   componentDidMount() {
//     this.props.onRef(this);
//     window.onscroll = onWindowScroll;
//     window.onresize = () => {
//       this.setCommitHeight();
//       if (this.state.buttonText === intl.get('hideLinks')) {
//         this.removeJsplumbPointers();
//         this.drawLinks();
//       }
//     };
//     commitLoading = true;
//     this.getData();
//     // this.generateThumbnail();
//   }

//   UNSAFE_componentWillUpdate(nextProps: IProps, nextState: IState) {
//     if (nextProps.currentRepoID !== this.props.currentRepoID) {
//       this.setState({
//         firstGetAllFiles: true,
//       });
//     }
//     if (this.props.currentTraceRadio !== nextProps.currentTraceRadio) {
//       this.setState(
//         {
//           filesData: [],
//           commitsData: [],
//           commitLoading: true,
//           firstGetAllFiles: true,
//           shouldGetHistory: nextProps.currentTraceRadio !== 'all_files',
//         },
//         () => {
//           this.removeJsplumbPointers();
//         },
//       );
//     }
//   }

//   componentDidUpdate(prevProps: IProps, prevState: IState) {
//     this.removeJsplumbPointers();
//     if (prevProps !== this.props) {
//       this.getData();
//     }
//     sleep(500).then(() => {
//       if (
//         this.state.buttonText !== prevState.buttonText &&
//         this.state.buttonText === intl.get('hideLinks')
//       ) {
//         jsplumbInstance.repaintEverything();
//         this.drawLinks();
//       }
//     });
//   }

//   componentWillUnmount = () => {
//     this.removeJsplumbPointers();
//     // 若有未处理完的请求，则取消（适用于fetch）
//     if ('AbortController' in window) {
//       this.controller?.abort();
//     }
//   };

//   getData() {
//     if (this.props.currentTraceRadio === 'commit') {
//       commitLoading = true;
//       this.getCommits();
//     } else if (this.props.currentTraceRadio === 'demo') {
//       this.setState(
//         {
//           timelineHeight: 400,
//           commits: testData.commits,
//         },
//         this.handleTimelineData,
//       );
//       this.testCommitsDataChange(0);
//     }
//   }

//   getCommits() {
//     const { dateRange } = this.state;
//     getCommitHistoryInfoList(
//       {
//         repo_uuid: this.props.currentRepoID,
//         since: dateRange[0],
//         until: dateRange[1],
//       },
//       sessionStorage.getItem('userToken') ?? '',
//     ).then((data) => {
//       if (Array.isArray(data)) {
//         this.setState(
//           {
//             commits: data,
//           },
//           this.handleCommitsData,
//         );
//         this.setState(
//           {
//             currentCommit: data[0] ? data[0] : {},
//             commitMessage: {
//               commit_time: data[0] ? data[0].commit_time : '',
//               developer_name: data[0] ? data[0].developer_name : '',
//               commit_message: data[0] ? data[0].commit_message : '',
//             },
//           },
//           () => {
//             this.getDevelopmentHistoryByCommit();
//             this.getFileInfo();
//           },
//         );
//       } else {
//         let chart = document.getElementById('traceTimeline') as
//           | HTMLCanvasElement
//           | HTMLDivElement;
//         if (chart) {
//           echarts.init(chart).dispose();
//         }
//         this.setState({
//           commits: [],
//           currentCommit: {},
//           commitMessage: {
//             commit_time: '',
//             developer_name: '',
//             commit_message: '',
//           },
//         });
//       }
//     });
//   }

//   getFileInfo() {
//     const { currentCommit } = this.state;
//     getFileHistoryInfoListByCommitId(
//       {
//         commit_id: currentCommit.commit_id,
//       },
//       sessionStorage.getItem('userToken') ?? '',
//     ).then((data) => {
//       if (Array.isArray(data)) {
//         this.setState({
//           filesInfo: data,
//         });
//       }
//     });
//   }

//   setCommitHeight() {
//     const { commitsData } = this.state;
//     const commit = document.getElementById('commit');
//     let width = 0;
//     let totalLength = 0;
//     let fileLength = 200;
//     let methodLength = 250;
//     if (commit) {
//       if (window.innerWidth) width = window.innerWidth;
//       else if (document.body && document.body.clientWidth)
//         width = document.body.clientWidth;
//       if (document.documentElement && document.documentElement.clientWidth)
//         width = document.documentElement.clientWidth;
//       // 0.72来自commit width(72vw)， 300是每个block的宽度
//       const horizontalNum = Math.floor((width * 0.72) / 300);
//       //获取画布高度
//       let maxMethodNum = 0;
//       for (let i = 0; i < commitsData.length; i++) {
//         totalLength += fileLength;
//         if (commitsData[i].childInfos) {
//           totalLength += commitsData[i].childInfos.length * methodLength;
//           maxMethodNum = Math.max(
//             maxMethodNum,
//             commitsData[i].childInfos.length,
//           );
//         }
//       }
//       // 对画布高度重新调整，避免出现多余折行的情况
//       let maxColumnLength = 0,
//         columnLength = 0;
//       for (let i = 0; i < commitsData.length; i++) {
//         columnLength += fileLength;
//         if (commitsData[i].childInfos) {
//           columnLength += commitsData[i].childInfos.length * methodLength;
//         }
//         if (columnLength > totalLength / horizontalNum) {
//           maxColumnLength = Math.max(
//             columnLength,
//             maxMethodNum * methodLength + fileLength,
//           );
//           columnLength = 0;
//         }
//       }
//       commit.style.height = maxColumnLength + 'px';
//       const left = document.getElementById('left');
//       const messages = document.getElementById('commitMessage');
//       if (left && messages) {
//         const sameHeight = Math.max(
//           maxColumnLength + +messages.style.height,
//           +messages.style.height + +left.style.height,
//         );
//         commit.style.height = sameHeight + 'px';
//       }
//       this.setState(
//         {
//           maxColumnLength,
//         },
//         () => {
//           sleep(500).then(() => {
//             this.generateThumbnail();
//           });
//         },
//       );
//     }
//   }

//   /**
//    * 时间轴需要的数据结构
//    * nodes: [{name: '节点1',x: 200,y: 250}]
//    * links: [{source: '节点1',target: '节点2'}]
//    */
//   handleCommitsData() {
//     let data = this.state.commits;
//     let timelineNodes: {
//       name: string;
//       x: number;
//       y: number;
//     }[] = [];
//     let height = 0;
//     let timelineLinks = [];
//     let isNewTree = true;
//     const length = data.length;
//     // const pow = 0.3;
//     // const numberGreaterThan1 = data.length > 1;
//     let xScale = 40,
//       yScale = 60;
//     //根据得到的树，构建nodes
//     function getNodesPosition(tree: any, x: number, y: number, plies: any) {
//       if (!tree) return;
//       //对树结构进行调整，避免出现两个节点重合的情况
//       if (!tree.first_child && tree.second_child) {
//         tree.first_child = tree.second_child;
//         tree.second_child = null;
//       }
//       if (!tree.first_child && tree.bro) {
//         tree.first_child = tree.bro;
//         tree.bro = null;
//       }
//       if (tree.commit_time) {
//         timelineNodes.push({
//           name: tree.commit_time,
//           x: x * xScale,
//           y: tree.index * yScale,
//         });
//       }
//       if (tree.first_child) getNodesPosition(tree.first_child, x, y + 1, plies);
//       if (tree.second_child)
//         getNodesPosition(tree.second_child, x + 1, y + 1, plies / 2);
//       if (tree.bro) getNodesPosition(tree.bro, x + 1, y, plies);
//     }
//     //构建树
//     function buildTree(data: any, tree: any) {
//       if (data.length === 0) {
//         return;
//       }
//       for (let i = 0; i < data.length; i++) {
//         if (data[i].first_parent_commit_id === tree.commit_id) {
//           if (tree.first_child) {
//             tree.second_child = data[i];
//           } else {
//             tree.first_child = data[i];
//           }
//           data.splice(i, 1);
//           i -= 1;
//         } else if (
//           data[i].second_parent_commit_id &&
//           data[i].second_parent_commit_id === tree.commit_id
//         ) {
//           tree.second_child = data[i];
//           data.splice(i, 1);
//           i -= 1;
//         }
//       }
//       if (tree.first_child) buildTree(data, tree.first_child);
//       if (tree.second_child) buildTree(data, tree.second_child);
//       if (tree.bro) buildTree(data, tree.bro);
//     }
//     if (data[0]) {
//       let tree = data[0];
//       //构建links，同时判断是否存在多个根节点
//       for (let i = 0; i < length; i++) {
//         isNewTree = true;
//         data[i].time_subtract =
//           i > 0
//             ? new Date(data[i].commitTime).getTime() -
//               new Date(data[i - 1].commitTime).getTime()
//             : 0;
//         for (let j = 0; j < length; j++) {
//           if (
//             data[i].first_parent_commit_id === data[j].commitId ||
//             data[i].second_parent_commit_id === data[j].commitId
//           ) {
//             isNewTree = false;
//             timelineLinks.push({
//               source: data[j].commitTime,
//               target: data[i].commitTime,
//             });
//           }
//         }
//         data[i].index = i;
//         if (isNewTree && i > 0) {
//           data[i - 1].bro = data[i];
//         }
//       }
//       buildTree(data.slice(1), tree);
//       getNodesPosition(tree, 0, 0, 1);
//       for (let k = 0; k < timelineNodes.length; k++) {
//         height = Math.max(height, timelineNodes[k].y);
//       }
//     }
//     this.setState(
//       {
//         timelineData: {
//           nodes: timelineNodes,
//           links: timelineLinks,
//         },
//         timelineHeight: height,
//       },
//       this.initTimeline,
//     );
//   }

//   getAllFilesHistory() {
//     let { dateRange } = this.state;
//     getAllDevelopmentHistory(
//       {
//         repo_uuid: this.props.currentRepoID,
//         since: dateRange[0],
//         until: dateRange[1],
//       },
//       sessionStorage.getItem('userToken') ?? '',
//     ).then((data) => {
//       if (Array.isArray(data)) {
//         for (let i = 0; i < data.length; i++) {
//           if (!data[i].childInfos || data[i].childInfos.length === 0) {
//             data.splice(i, 1);
//             i -= 1;
//           }
//         }
//         this.setState(
//           {
//             filesData: data,
//             firstGetAllFiles: false,
//           },
//           () => {
//             const commitsData = this.handleAllFilesData();
//             commitLoading = false;
//             this.setState(
//               {
//                 commitLoading: false,
//                 commitsData: commitsData,
//               },
//               () => {
//                 this.setCommitHeight();
//                 this.handleLinksData();
//               },
//             );
//           },
//         );
//       }
//     });
//   }

//   /**
//    * 传入所有的文件数据，和当前commit修改的文件做匹配，处理的结果将是最终的commitsData
//    */
//   handleAllFilesData() {
//     const { filesData } = this.state;
//     let originData = this.state.originCommitsData;
//     let d = [];
//     for (let i = 0; i < filesData.length; i++) {
//       d.push(JSON.parse(JSON.stringify(filesData[i])));
//     }
//     if (originData.length !== 0) {
//       for (let j = 0; j < d.length; j++) {
//         for (let i = 0; i < originData.length; i++) {
//           if (d[j].uuid === originData[i].uuid) {
//             for (let l = 0; l < d[j].childInfos.length; l++) {
//               for (let k = 0; k < originData[i].childInfos.length; k++) {
//                 if (
//                   d[j].childInfos[l].uuid === originData[i].childInfos[k].uuid
//                 ) {
//                   d[j].childInfos[l] = originData[i].childInfos[k];
//                   break;
//                 }
//               }
//             }
//             originData.splice(i, 1);
//             i -= 1;
//             break;
//           }
//         }
//       }
//     }
//     d = d.sort((a, b) => {
//       // return b.childInfos.length- a.childInfos.length;
//       return a.uuid - b.uuid;
//     });
//     return d;
//   }

//   getDevelopmentHistoryByCommit() {
//     this.removeJsplumbPointers();
//     let { currentCommit, filesData, dateRange } = this.state;
//     getAllDevelopmentHistory(
//       {
//         repo_uuid: this.props.currentRepoID,
//         commit_id: currentCommit.commit_id,
//         since: dateRange[0],
//         until: dateRange[1],
//       },
//       sessionStorage.getItem('userToken') ?? '',
//     ).then((data) => {
//       if (Array.isArray(data)) {
//         this.setState(
//           {
//             originCommitsData: data,
//           },
//           () => {
//             if (this.state.firstGetAllFiles) {
//               this.getAllFilesHistory();
//             } else {
//               let commitsData = [];
//               if (data.length === 0) {
//                 commitsData = filesData;
//               } else {
//                 commitsData = this.handleAllFilesData();
//               }
//               commitLoading = false;
//               this.setState(
//                 {
//                   commitsData: commitsData,
//                 },
//                 () => {
//                   sleep(500).then(() => {
//                     this.generateThumbnail();
//                   });
//                   this.showBlocksAnimation();
//                   this.handleLinksData();
//                 },
//               );
//             }
//           },
//         );
//       }
//     });
//   }

//   /**
//    * 生成commit的缩略图，在初次加载和每次更新commitsData后调用
//    */
//   generateThumbnail() {
//     let thumbnail = document.getElementById('thumbnail') as HTMLImageElement;
//     let scale = 1;
//     const { maxColumnLength } = this.state;
//     // scale 设置缩略图清晰度，较长的页面清晰度不宜过高
//     if (maxColumnLength < 8000) {
//       scale = 1;
//     } else if (maxColumnLength >= 8000 && maxColumnLength < 80000) {
//       scale = 0.2;
//     } else if (maxColumnLength >= 80000 && maxColumnLength < 120000) {
//       scale = 0.15;
//     } else if (maxColumnLength >= 120000 && maxColumnLength < 160000) {
//       scale = 0.11;
//     } else {
//       scale = 0.05;
//     }
//     if (thumbnail) {
//       if (this.state.commitsData.length !== 0) {
//         html2canvas(document.querySelector('#commit') as HTMLElement, {
//           backgroundColor: '#ffffff',
//           useCORS: true,
//           // crossOrigin: 'anonymous',
//           allowTaint: true,
//           // taintTest: false,
//           scrollX: -document.documentElement.scrollLeft,
//           scrollY: -document.documentElement.scrollTop,
//           scale: scale,
//         }).then((canvas) => {
//           const dataUrl = canvas.toDataURL();
//           thumbnail.src = dataUrl;
//           thumbnail.style.height =
//             document.documentElement.clientHeight - 90 + 'px';
//           let ctx = canvas.getContext('2d');
//           let imgScale =
//             document.documentElement.clientHeight / this.state.maxColumnLength;
//           ctx?.scale(imgScale, imgScale);
//           ctx?.drawImage(thumbnail, 0, 0);
//           thumbnail.appendChild(canvas);
//         });
//       } else {
//         // const child= thumbnail.childNodes[0];
//         // if(child){
//         //     thumbnail.removeChild(child);
//         // }
//       }
//     }
//   }

//   showBlocksAnimation() {
//     sleep(2000).then(() => {
//       if (this.state.autoPlay) this.scrollToAnchor();
//     });
//   }

//   onDateChange(_date: any, dateString: string[]) {
//     if (dateString !== this.state.dateRange) {
//       this.setState(
//         {
//           dateRange: dateString,
//           firstGetAllFiles: true,
//         },
//         this.getData,
//       );
//     }
//   }

//   removeJsplumbPointers() {
//     if (jsplumbInstance) {
//       jsplumbInstance.deleteEveryEndpoint();
//     }
//   }

//   /**
//    * 对commitsData进行处理，整理方法间调用关系
//    */
//   handleLinksData() {
//     const { commitsData, buttonText } = this.state;
//     let linksData = [];
//     // file
//     for (let i = 0; i < commitsData.length; i++) {
//       if (commitsData[i].childInfos) {
//         // method
//         for (let j = 0; j < commitsData[i].childInfos.length; j++) {
//           if (commitsData[i].childInfos[j].childInfos) {
//             // statement
//             for (
//               let k = 0;
//               k < commitsData[i].childInfos[j].childInfos.length;
//               k++
//             ) {
//               if (commitsData[i].childInfos[j].childInfos[k].calledMethodUuid) {
//                 // called method
//                 for (
//                   let l = 0;
//                   l <
//                   commitsData[i].childInfos[j].childInfos[k].calledMethodUuid
//                     .length;
//                   l++
//                 ) {
//                   const index = commitsData[i].childInfos[j].name.indexOf('(');
//                   let jsonObj = {
//                     source: `statement${commitsData[i].childInfos[j].childInfos[k].uuid}`,
//                     target: `method${commitsData[i].childInfos[j].childInfos[k].calledMethodUuid[l]}`,
//                     sourceName: commitsData[i].childInfos[j].name.substr(
//                       0,
//                       index,
//                     ),
//                   };
//                   linksData.push(jsonObj);
//                 }
//               }
//             }
//           }
//         }
//       }
//     }
//     this.setState(
//       {
//         linksData,
//       },
//       () => {
//         if (buttonText === intl.get('hideLinks')) {
//           jsplumbInstance.repaintEverything();
//           this.drawLinks();
//         }
//       },
//     );
//   }

//   /**
//    * 生成方法之间调用关系连线
//    */
//   drawLinks() {
//     const { linksData } = this.state;
//     const dynamicAnchors = ['Left', 'Right'];
//     // jsplumbInstance.setContainer("diagramContainer");
//     const range = [0.01, 0.03, 0.05, 0.08, 0.1, 0.11, 0.13, 0.15];
//     jsplumbInstance.registerConnectionTypes({
//       basic: {
//         paintStyle: {
//           strokeWidth: 2,
//         },
//       },
//       selected: {
//         paintStyle: {
//           strokeWidth: 4,
//           strokeStyle: '#8ACCD0',
//           stroke: '#8ACCD0',
//           fillStyle: '#8ACCD0',
//           radius: 6,
//           lineWidth: 5,
//         },
//         zIndex: 1001,
//         connectorStyle: {
//           lineWidth: 5,
//           strokeStyle: '#8ACCD0',
//           joinstyle: 'round',
//         },
//         endpointsStyle: { fill: '#8ACCD0' },
//       },
//     });
//     linksData.forEach((d, k) => {
//       const color = getRandomColor();
//       let connection = jsplumbInstance.connect(
//         {
//           source: d.source,
//           target: d.target,
//         },
//         {
//           paintStyle: {
//             strokeStyle: color,
//             stroke: color,
//             strokeWidth: 2,
//             fillStyle: color,
//             radius: 6,
//             lineWidth: 5,
//           },
//           connectorStyle: {
//             lineWidth: 5,
//             strokeStyle: color,
//             joinstyle: 'round',
//           },
//           cursor: 'pointer',
//           endpointStyle: { fill: color },
//           connector: [
//             'Flowchart',
//             {
//               stub: [40, 60],
//               gap: 0,
//               cornerRadius: 5,
//               midpoint: range[k % 8],
//               alwaysRespectStubs: false,
//             },
//           ],
//           maxConnections: -1,
//           endpoints: [
//             ['Dot', { radius: 5 }],
//             ['Rectangle', { width: 10, height: 10 }],
//           ],
//           anchor: dynamicAnchors,
//           isTarget: false,
//           isSource: false,
//           zIndex: 1000,
//           cssClass: 'calledLinks',
//           overlays: [
//             ['Arrow', { width: 10, length: 10, location: 0.1 }],
//             ['Arrow', { width: 10, length: 10, location: 0.3 }],
//             ['Arrow', { width: 10, length: 10, location: 0.5 }],
//             ['Arrow', { width: 10, length: 10, location: 0.7 }],
//             ['Arrow', { width: 10, length: 10, location: 0.9 }],
//             // ['Label', { label: "<div class='sourceName'>From "+ d.sourceName+"</div>", location: 0.95}]
//           ],
//           data: d,
//         },
//       );
//       if (connection) {
//         jsplumbInstance.bind('click', function (connection, originalEvent) {
//           // @ts-ignore
//           connection.toggleType('selected');
//         });
//         jsplumbInstance.bind('dbclick', function (
//           connection,
//           originalEvent,
//         ) {});
//       }
//     });
//     jsplumbInstance
//       // @ts-ignore
//       .selectEndpoints({
//         scope: 'terminal',
//       })
//       .toggleType('selected');
//   }

//   handleTimelineData() {
//     const { commits } = this.state;
//     let data = { nodes: [] as any[], links: [] as any[] };
//     //按照树结构确定各个节点坐标，同时梳理links
//     for (let i = commits.length - 1; i >= 0; i--) {
//       const commit = {} as any;
//       commit.name = commits[i].commitTime;
//       commit.x = 0;
//       commit.y = 100 * (5 - i - 1);
//       // commit.id= commits[i].commitId;
//       data.nodes.push(commit);
//       if (commits[i].parent1)
//         data.links.push({
//           source: commits[i].commitTime,
//           target: commits[i].parent1,
//         });
//     }
//     this.setState(
//       {
//         timelineData: data,
//       },
//       this.initTimeline,
//     );
//   }

//   initTimeline = () => {
//     let { timelineData, timelineHeight, commits } = this.state;
//     let { currentTraceRadio } = this.props;
//     let chart = document.getElementById('traceTimeline') as
//       | HTMLCanvasElement
//       | HTMLDivElement;
//     if (chart) {
//       // chart.style.zIndex= "999";
//       chart.style.height = timelineHeight + 'px';
//       echarts.init(chart).dispose();
//       timeline = echarts.init(chart);
//       let option = {
//         title: {
//           show: false,
//           text: intl.get('Timeline'),
//         },
//         tooltip: {
//           trigger: 'item',
//           show: true,
//           axisPointer: {
//             type: 'shadow',
//           },
//           position: 'right',
//           formatter(params: { name: string }) {
//             if (params.name) {
//               for (let i = 0; i < commits.length; i++) {
//                 if (params.name === commits[i].commitTime) {
//                   return (
//                     params.name +
//                     '<br />' +
//                     commits[i].developer_name +
//                     "<br /><div class='commit_tooltip'>" +
//                     commits[i].commit_message +
//                     '</div>'
//                   );
//                 }
//               }
//             }
//           },
//         },
//         // top: 30,
//         left: 70,
//         height: timelineHeight - 80,
//         // width:"auto",
//         y: 10,
//         grid: {
//           top: 30,
//           left: 80,
//           right: '15px',
//           bottom: 50,
//           height: '100%',
//           containLabel: true,
//         },
//         animationDurationUpdate: 1500,
//         animationEasingUpdate: 'quinticInOut',
//         series: [
//           {
//             type: 'graph',
//             layout: 'none',
//             symbolSize: 10,
//             hoverAnimation: false,
//             legendHoverLink: false,
//             roam: false, // false: 关闭缩放和平移
//             silent: false, // false: 响应和触发事件
//             edgeSymbol: ['none', 'none'],
//             edgeSymbolSize: [4, 10],
//             edgeLabel: {
//               fontSize: 11,
//             },
//             cursor: 'pointer',
//             data: timelineData.nodes,
//             links: timelineData.links,
//             itemStyle: {
//               normal: {
//                 //默认样式
//                 label: {
//                   show: false,
//                   formatter(params: { name: string; data: { x: number } }) {
//                     if (params.name && params.data.x === 0) {
//                       const time =
//                         currentTraceRadio === 'commit'
//                           ? params.name.split(' ')[0]
//                           : params.name;
//                       return time;
//                       // time.substr(0,4)+"\r\n"+ time.substr(5)
//                     }
//                   },
//                 },
//                 symbolSize: 10,
//                 color: '#fff',
//                 borderType: 'solid',
//                 borderColor: 'rgba(98,187,193)',
//                 borderWidth: 3,
//               },
//               emphasis: {
//                 symbolSize: 10,
//                 borderColor: 'rgba(98,187,193)',
//                 color: 'rgba(98,187,193)',
//               },
//             },
//             lineStyle: {
//               normal: {
//                 color: 'lightgray',
//                 width: '2',
//                 type: 'solid',
//                 curveness: 0,
//                 opacity: 1,
//               },
//               emphasis: {},
//             },
//             label: {
//               normal: {
//                 show: true,
//                 position: 'right',
//                 textStyle: {
//                   color: '#2D2F3B',
//                   fontStyle: 'normal',
//                   fontWeight: 'normal',
//                   fontSize: 10, //字体大小
//                 },
//               },
//               emphasis: {
//                 //高亮状态
//               },
//             },
//           },
//         ],
//       };
//       timeline.setOption(option as any);
//       //默认选中第一个
//       timeline.dispatchAction({
//         type: 'highlight',
//         seriesIndex: 0,
//         dataIndex: 0,
//       });
//       timeline.on(
//         'click',
//         (params: {
//           dataType: string;
//           dataIndex: number;
//           seriesIndex: any;
//           name: any;
//         }) => {
//           if (params.dataType === 'node') {
//             for (let i = 0; i < timelineData.nodes.length; i++) {
//               if (i === params.dataIndex) {
//                 timeline.dispatchAction({
//                   type: 'highlight',
//                   seriesIndex: params.seriesIndex,
//                   dataIndex: params.dataIndex,
//                 });
//                 if (currentTraceRadio === 'demo') {
//                   this.testCommitsDataChange(i);
//                 } else {
//                   this.changeCommit(params.name);
//                 }
//               } else {
//                 timeline.dispatchAction({
//                   type: 'downplay',
//                   seriesIndex: params.seriesIndex,
//                   dataIndex: i,
//                 });
//               }
//             }
//           }
//         },
//       );
//       window.addEventListener('resize', function () {
//         timeline.resize();
//       });
//     }
//   };

//   changeCommit(time: string) {
//     const { commits } = this.state;
//     commitLoading = true;
//     for (let i = 0; i < commits.length; i++) {
//       if (commits[i].commitTime === time) {
//         this.setState(
//           {
//             currentCommit: commits[i],
//             commitMessage: {
//               commit_time: commits[i].commitTime,
//               developer_name: commits[i].developer_name,
//               commit_message: commits[i].commit_message,
//             },
//           },
//           () => {
//             this.getDevelopmentHistoryByCommit();
//             this.getFileInfo();
//           },
//         );
//       }
//     }
//   }

//   scrollToAnchor = () => {
//     let {
//       timelineData,
//       currentCommitIndex,
//       autoPlay,
//       commits,
//       currentCommit,
//     } = this.state;
//     let { currentTraceRadio } = this.props;
//     let autoChangeToNewCommit = () => {
//       return new Promise((res, rej) => {
//         if (autoPlay) {
//           if (this.state.autoPlay) {
//             window.scrollTo({
//               top: 0,
//               behavior: 'smooth',
//             });
//           }
//           sleep(2000).then(() => {
//             if (autoPlay) {
//               timeline.dispatchAction({
//                 type: 'highlight',
//                 // seriesIndex: 0,
//                 dataIndex: currentCommitIndex + 1,
//               });
//               if (currentCommitIndex !== timelineData.nodes.length - 1) {
//                 timeline.dispatchAction({
//                   type: 'downplay',
//                   // seriesIndex: 0,
//                   dataIndex: currentCommitIndex,
//                 });
//                 if (currentTraceRadio === 'demo') {
//                   this.testCommitsDataChange(currentCommitIndex + 1);
//                 } else {
//                   for (let i = 0; i < commits.length; i++) {
//                     if (currentCommit === commits[i]) {
//                       this.changeCommit(commits[i + 1].commitTime);
//                       break;
//                     }
//                   }
//                   this.setState({
//                     currentCommitIndex: currentCommitIndex + 1,
//                   });
//                 }
//               }
//             }
//           });
//         }
//       });
//     };
//     let scrollToBottom = () => {
//       return new Promise((res, rej) => {
//         let height =
//           document.documentElement.scrollTop || document.body.scrollTop;
//         // let height= autoPlay? document.body.scrollTop: document.documentElement.scrollTop;
//         if (this.timerID) clearInterval(this.timerID);
//         this.timerID = setInterval(() => {
//           height += 8;
//           if (height >= document.body.scrollHeight) {
//             if (this.timerID) clearInterval(this.timerID);
//             autoChangeToNewCommit();
//           }
//           window.scrollTo({
//             top: height,
//             behavior: 'smooth',
//           });
//         }, 50);
//       });
//     };
//     Promise.resolve(scrollToBottom);
//   };

//   testCommitsDataChange = (i: number) => {
//     this.removeJsplumbPointers();
//     this.setState({ commitLoading: true });
//     // @ts-ignore
//     let data = testData['data_' + (5 - i)].sort((a, b) => {
//       let aLength = 0,
//         bLength = 0;
//       for (let i = 0; i < a.childInfos.length; i++) {
//         aLength += 20;
//       }
//       for (let i = 0; i < b.childInfos.length; i++) {
//         bLength += 20;
//       }
//       return aLength - bLength;
//     });
//     commitLoading = false;
//     this.setState(
//       {
//         commitsData: data.sort(
//           (
//             a: { childInfos: string | any[] },
//             b: { childInfos: string | any[] },
//           ) => {
//             return b.childInfos.length - a.childInfos.length;
//           },
//         ),
//         commitLoading: false,
//         // @ts-ignore
//         commitMessage: testData['message_' + (5 - i)],
//         currentCommitIndex: i,
//       },
//       () => {
//         this.setCommitHeight();
//         if (this.state.autoPlay && this.props.currentRadio === 'development')
//           this.showBlocksAnimation();
//       },
//     );
//   };

//   showLinksOrNot() {
//     this.removeJsplumbPointers();
//     if (this.state.buttonText === intl.get('showLinks')) {
//       this.setState({
//         buttonText: intl.get('hideLinks'),
//       });
//     } else {
//       this.setState({
//         buttonText: intl.get('showLinks'),
//       });
//     }
//   }

//   stopPlay() {
//     if (this.timerID) clearInterval(this.timerID);
//     this.setState({
//       autoPlay: false,
//     });
//   }

//   startPlay() {
//     this.setState(
//       {
//         autoPlay: true,
//       },
//       this.scrollToAnchor,
//     );
//   }

//   controlScreenScroll(e: React.MouseEvent<HTMLImageElement, MouseEvent>) {
//     const { maxColumnLength } = this.state;
//     const thumbnail = document.getElementById('thumbnail');
//     const commit = document.getElementById('commit');
//     if (e.pageY && thumbnail && commit) {
//       let posY = 0,
//         height = 0;
//       if (thumbnail.classList[0] === 'thumbnailFloat') {
//         posY = e.pageY - thumbnail.offsetTop;
//       } else {
//         const scrollTop =
//           document.documentElement.scrollTop || document.body.scrollTop;
//         posY = e.pageY - scrollTop - 70;
//       }
//       const index = thumbnail.style.height.indexOf('px');
//       if (index !== -1) {
//         height =
//           (posY * maxColumnLength) /
//             parseInt(thumbnail.style.height.substring(0, index), 10) +
//           commit.offsetTop -
//           50;
//         window.scrollTo({
//           top: height,
//           behavior: 'auto',
//         });
//       }
//     }
//   }

//   handlePrompt() {
//     jsplumbInstance.deleteEveryEndpoint();
//     if (this && this.timerID) clearInterval(this.timerID);
//     return true;
//   }

//   render() {
//     const { RangePicker } = DatePicker;
//     const str = window.location.href;
//     const index = str.lastIndexOf('/');
//     sessionStorage.setItem('lastPage-methodTrace', str.substring(index));
//     sessionStorage.setItem('rawIssueRadio', 'development');
//     let {
//       dateRange,
//       autoPlay,
//       filesInfo,
//       buttonText,
//       commitMessage,
//       shouldGetHistory,
//       commitsData,
//     } = this.state;
//     let { currentTraceRadio } = this.props;
//     sessionStorage.setItem('developmentRadio', currentTraceRadio);
//     // const dateFormat = 'YYYY-MM-DD HH:mm';
//     return (
//       <div>
//         <Prompt message={this.handlePrompt} />
//         <div id="developmentTrace">
//           <div id={'dashboard'}>
//             <div id={'Block'}>
//               <div id={'per_commit'}>
//                 <div id={'left'}>
//                   <div id={'commitMessage'}>
//                     {/*<div id={"timeTip"}>{(dateRange[0] && dateRange[1])? dateRange[0]+" "+intl.get("time to")+" " + dateRange[1]: ""}</div>*/}
//                     <div>
//                       <span>{`${intl.get('committer')}:`}</span>{' '}
//                       {commitMessage.developer_name}
//                     </div>
//                     <div>
//                       <span>{`${intl.get('Commit Time')}:`}</span>{' '}
//                       {commitMessage.commit_time
//                         ? commitMessage.commit_time.split(' ')[0]
//                         : ''}
//                     </div>
//                     <div>
//                       <span>{`${intl.get('commit message')}:`}</span>{' '}
//                       {commitMessage.commit_message}
//                     </div>
//                   </div>
//                   <div id={'traceTimeline'}></div>
//                 </div>
//                 <div id={'right'}>
//                   <div id={'blockMenu'}>
//                     <div id={'menuButton'}>
//                       <RangePicker
//                         disabledDate={disabledDate}
//                         disabledTime={disabledRangeTime}
//                         placeholder={[dateRange[0], dateRange[1]]}
//                         // showTime={{
//                         //   hideDisabledOptions: true,
//                         //   defaultValue: [
//                         //     moment('00:00:00', 'HH:mm:ss'),
//                         //     moment('11:59:59', 'HH:mm:ss'),
//                         //   ],
//                         // }}
//                         format="YYYY-MM-DD"
//                         // value={[moment(dateRange[0], dateFormat), moment(dateRange[1], dateFormat)]}
//                         onChange={this.onDateChange.bind(this)}
//                       />
//                       <Button
//                         id={'showLinksOrNot'}
//                         onClick={() => {
//                           this.showLinksOrNot();
//                         }}
//                       >
//                         {buttonText}
//                       </Button>
//                     </div>
//                     {autoPlay ? (
//                       <img
//                         id={'icon'}
//                         className={'playIcons iconStatic'}
//                         onClick={() => {
//                           this.stopPlay();
//                         }}
//                         src={stop}
//                         alt={''}
//                       />
//                     ) : (
//                       <img
//                         id={'icon'}
//                         className={'playIcons iconStatic'}
//                         onClick={() => {
//                           this.startPlay();
//                         }}
//                         src={play}
//                         alt={''}
//                       />
//                     )}
//                   </div>
//                   <div id={'commit'}>
//                     {commitLoading ? (
//                       <LoadingOutlined
//                         style={{ display: 'block', float: 'left' }}
//                       />
//                     ) : (
//                       commitsData.map((commitData: { filePath: any }) => {
//                         let fileInfo = {};
//                         for (let i = 0; i < filesInfo.length; i++) {
//                           if (filesInfo[i].file_path === commitData.filePath) {
//                             fileInfo = filesInfo[i];
//                           }
//                         }
//                         return (
//                           <FileBlock
//                             fileInfo={fileInfo}
//                             data={commitData}
//                             shouldGetHistory={shouldGetHistory}
//                             currentTraceRadio={currentTraceRadio}
//                           />
//                         );
//                       })
//                     )}
//                   </div>
//                   <img
//                     id={'thumbnail'}
//                     onClick={(e) => {
//                       this.controlScreenScroll(e);
//                     }}
//                     alt={''}
//                   ></img>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }
// }

// interface IFileBlockProps {
//   currentTraceRadio: string;
//   data: any;
//   fileInfo: any;
//   shouldGetHistory: any;
// }

// class FileBlock extends React.Component<IFileBlockProps> {
//   static contextType = HistoryContext;

//   componentDidMount() {
//     this.showBarChart();
//   }

//   showBarChart() {
//     // if(this.props.shouldGetHistory){
//     let { currentTraceRadio, data } = this.props;
//     let infos = this.props.fileInfo;
//     if (currentTraceRadio === 'demo')
//       infos = {
//         file_path: 'str',
//         add_lines: 35,
//         del_lines: 12,
//         ccn: 3.2,
//         lastCcn: 3.8,
//       };
//     if (infos.file_path) {
//       let chart = document.getElementById(
//         'barChart' + data.name,
//       ) as HTMLDivElement;
//       if (chart?.className === 'hideChart') {
//         chart.classList.remove('hideChart');
//         chart.classList.add('showBarChart');
//         if (chart) {
//           echarts.init(chart).dispose();
//           let barChart = echarts.init(chart);
//           let option = {
//             color: ['rgba(98,187,193)'],
//             tooltip: {
//               show: true,
//             },
//             legend: {
//               show: false,
//               data: ['Issues', '+LOC', '-LOC', 'CCN', 'Last CCN'],
//             },
//             grid: {
//               left: '0',
//               right: '20%',
//               bottom: '3%',
//               top: '3%',
//               containLabel: true,
//             },
//             xAxis: [
//               {
//                 show: false,
//                 type: 'value',
//                 axisTick: {
//                   show: false,
//                 },
//                 axisLine: {
//                   show: false,
//                 },
//                 splitLine: {
//                   //网格线
//                   show: false,
//                 },
//               },
//             ],
//             yAxis: [
//               {
//                 type: 'category',
//                 axisTick: {
//                   show: false,
//                 },
//                 axisLabel: {
//                   interval: 0,
//                   textStyle: {
//                     fontSize: '10',
//                   },
//                 },
//                 data: ['Issues', '+LOC', '-LOC', 'CCN', 'Last CCN'],
//               },
//             ],
//             series: [
//               {
//                 name: 'value',
//                 type: 'bar',
//                 label: {
//                   show: true,
//                   position: 'right',
//                 },
//                 highlight: {
//                   color: ['rgba(98,187,193)'],
//                 },
//                 data: [
//                   0,
//                   infos.add_lines,
//                   infos.del_lines,
//                   infos.ccn,
//                   infos.lastCcn,
//                 ],
//               },
//             ],
//           };
//           barChart.setOption(option as any);
//           jsplumbInstance.repaintEverything();
//           window.addEventListener('resize', function () {
//             barChart.resize();
//           });
//         }
//       } else {
//         chart.classList.remove('showBarChart');
//         chart.classList.add('hideChart');
//         jsplumbInstance.repaintEverything();
//       }
//       // }
//     }
//   }

//   render() {
//     let { data, shouldGetHistory } = this.props;
//     return (
//       <div className={'blocks'}>
//         <div id={'file' + data.name} className={'fileBlock'}>
//           <div style={{ clear: 'both' }}></div>
//           <div className={'fileName'}>{data.name}</div>
//           {data.childInfos.map(
//             (child: {
//               changeRelation: string;
//               name: string | null | undefined;
//               childInfos: any[];
//               rawUuid: any;
//             }) => {
//               if (child.changeRelation === 'SELF_CHANGE')
//                 child.changeRelation = 'SIGNATURE_CHANGE';
//               if (!child.changeRelation) child.changeRelation = 'NOT_CHANGED';
//               if (!shouldGetHistory) {
//                 return (
//                   <div
//                     className={'methodName'}
//                     style={{
//                       color: 'gray',
//                     }}
//                   >
//                     <div
//                       onClick={() => {
//                         // this.linkToMethod(child.uuid, false);
//                       }}
//                       className={'not_changed_link'}
//                     >
//                       {child.name}
//                     </div>
//                   </div>
//                 );
//               } else {
//                 const scale = 200;
//                 const minHeight = 6;
//                 let lastWhiteBlockHeight = 0;
//                 let childInfos: any[] = [];
//                 const index = child.name?.indexOf('(');
//                 const name = child.name?.substr(0, index);
//                 if (child.childInfos) {
//                   childInfos = child.childInfos.sort((a, b) => {
//                     return a.begin - b.begin;
//                   });
//                 }
//                 const lastOne = childInfos[childInfos.length - 1];
//                 if (lastOne)
//                   lastWhiteBlockHeight = 1 - lastOne.begin - lastOne.height;
//                 if (!child.changeRelation) child.changeRelation = 'NOT_CHANGED';
//                 if (child.changeRelation === 'CHANGE_LINE')
//                   child.changeRelation = 'CHANGE';
//                 return (
//                   <div>
//                     <div
//                       id={`method${child.rawUuid}`}
//                       className={'methodName'}
//                       style={{
//                         backgroundColor: changeBackgroundColor(
//                           child.changeRelation,
//                         ),
//                       }}
//                     >
//                       <div
//                         onClick={() => {
//                           // this.linkToMethod(child.uuid, false);
//                         }}
//                         className={'changed_link'}
//                       >
//                         {name}
//                       </div>
//                     </div>
//                     <div>
//                       {(child.changeRelation === 'NOT_CHANGED' ||
//                         !child.childInfos ||
//                         childInfos.length === 0) &&
//                       child.changeRelation !== 'ADD' &&
//                       child.changeRelation !== 'DELETE' ? (
//                         <div
//                           style={{
//                             width: '100%',
//                             height: scale + 'px',
//                             backgroundColor: 'white',
//                           }}
//                           className={'statements'}
//                         ></div>
//                       ) : (
//                         ''
//                       )}
//                       {child.changeRelation === 'ADD' ||
//                       child.changeRelation === 'DELETE' ? (
//                         <div
//                           style={{
//                             width: '100%',
//                             height: scale + 'px',
//                             backgroundColor: changeBackgroundColor(
//                               child.changeRelation,
//                             ),
//                           }}
//                           className={'statements'}
//                           onClick={() => {
//                             // this.linkToMethod(child.uuid, false);
//                           }}
//                         >
//                           {childInfos.map((d, k) => {
//                             return (
//                               <div>
//                                 <Tooltip
//                                   placement={'right'}
//                                   title={d.description}
//                                 >
//                                   <div
//                                     style={{
//                                       width: '100%',
//                                       height:
//                                         d.height * scale < minHeight
//                                           ? minHeight
//                                           : d.height * scale + 'px',
//                                       backgroundColor: changeBackgroundColor(
//                                         child.changeRelation,
//                                       ),
//                                     }}
//                                     className={'statements'}
//                                     id={`statement${d.uuid}`}
//                                     onClick={() => {
//                                       sessionStorage.setItem(
//                                         'statementUuid',
//                                         d.uuid,
//                                       );
//                                       // this.linkToMethod(child.uuid, true);
//                                     }}
//                                   ></div>
//                                 </Tooltip>
//                               </div>
//                             );
//                           })}
//                         </div>
//                       ) : (
//                         childInfos.map((d, k) => {
//                           const changeRelation =
//                             d.changeRelation === 'SELF_CHANGE'
//                               ? 'CHANGE'
//                               : d.changeRelation;
//                           let marginTop =
//                             k !== 0
//                               ? d.begin -
//                                 (childInfos[k - 1].begin +
//                                   childInfos[k - 1].height)
//                               : d.begin;
//                           //当关系为DELETE时需要对两种情况特殊处理
//                           //1. 和上一个语句块重叠;
//                           //2. 当前DELETE语句的begin 大于1;
//                           if (d.changeRelation === 'DELETE') {
//                             if (
//                               k === childInfos.length - 1 &&
//                               (marginTop < 0 || d.begin > 1)
//                             )
//                               lastWhiteBlockHeight = 0;
//                             if (k !== 0 && marginTop < 0) marginTop = 0;
//                             if (d.begin > 1) marginTop = 0;
//                           }
//                           return (
//                             <div>
//                               <Tooltip
//                                 placement={'right'}
//                                 title={d.description}
//                               >
//                                 <div
//                                   style={{
//                                     marginTop: scale * marginTop + 'px',
//                                     width: '100%',
//                                     height:
//                                       d.height * scale < minHeight
//                                         ? minHeight
//                                         : d.height * scale + 'px',
//                                     backgroundColor: changeBackgroundColor(
//                                       changeRelation,
//                                     ),
//                                   }}
//                                   className={'statements'}
//                                   id={`statement${d.uuid}`}
//                                   onClick={() => {
//                                     sessionStorage.setItem(
//                                       'statementUuid',
//                                       d.uuid,
//                                     );
//                                     // this.linkToMethod(child.uuid, true);
//                                   }}
//                                 ></div>
//                               </Tooltip>
//                               {k === childInfos.length - 1 ? (
//                                 <div
//                                   style={{
//                                     width: '100%',
//                                     height:
//                                       lastWhiteBlockHeight * scale < minHeight
//                                         ? minHeight
//                                         : lastWhiteBlockHeight * scale + 'px',
//                                     backgroundColor: 'white',
//                                   }}
//                                   className={'statements'}
//                                 ></div>
//                               ) : (
//                                 ''
//                               )}
//                             </div>
//                           );
//                         })
//                       )}
//                     </div>
//                   </div>
//                 );
//               }
//             },
//           )}
//         </div>
//         <div id={`barChart${data.name}`} className={'hideChart'}></div>
//       </div>
//     );
//   }
// }

// function sleep(time: number) {
//   return new Promise((resolve) => setTimeout(resolve, time));
// }

// function onWindowScroll() {
//   const scrollTop =
//     document.documentElement.scrollTop || document.body.scrollTop;
//   const icon = document.getElementById('icon');
//   const baseline = document.getElementById('showLinksOrNot');
//   const thumbnail = document.getElementById('thumbnail');
//   const commit = document.getElementById('commit');
//   if (icon && baseline) {
//     const offsetTop = baseline.offsetTop - 20;
//     if (offsetTop <= scrollTop) {
//       icon.classList.remove('iconStatic');
//       icon.classList.add('iconFixedTop');
//       if (thumbnail && commit) {
//         thumbnail.classList.remove('thumbnailFloat');
//         thumbnail.classList.add('thumbnailFixed');
//       }
//     } else {
//       icon.classList.remove('iconFixedTop');
//       icon.classList.add('iconStatic');
//       if (thumbnail && commit) {
//         thumbnail.classList.remove('thumbnailFixed');
//         thumbnail.classList.add('thumbnailFloat');
//       }
//     }
//   }
// }

// export default DevelopmentTrace;

const DevelopmentTrace = () => <div>维护中</div>;

export default DevelopmentTrace;
