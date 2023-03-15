// import React, {
//   useRef,
//   useLayoutEffect,
//   useState,
//   useEffect,
//   useMemo,
// } from 'react';
// import * as d3 from 'd3';
// import '../d3.less';
// import './styles.less';

// import {
//   UID,
//   format,
//   getLayout,
//   beautifyDataset,
//   hasFileChange,
//   getSumData,
// } from './d3-utils';
// import { throttle } from '@/utils';
// import { Row, Col, Checkbox, InputNumber, Typography } from 'antd';

// export interface ITreeMapItem {
//   name: string;
//   value?: number;
//   fileUuid?: string;
//   detail?: {
//     value: number;
//     realValue?: number;
//     heatColor?: string;
//     change: {
//       create: number[];
//       remove: number[];
//       modify: number[];
//     };
//     lines?: {
//       current: CP.LineChangeDetailItemWithLatest[];
//       future: CP.LineChangeDetailItemWithLatest[];
//     };
//   }[];
//   children?: ITreeMapItem[];
// }

// export type TreeMapFrameItem = {
//   key: string | number;
//   treemap: ITreeMapItem;
// };

// export type TreeMapConfig = {
//   width?: number;
//   height?: number;
//   tileType?: string;
//   // maxLayout?: boolean | undefined;
//   sortTransition?: boolean;
//   paddingTop?: number;
// };

// interface TreeMapProps {
//   // index?: number;
//   // animation?: boolean;
//   keyList: { id: string; extra?: any }[];
//   data: TreeMapFrameItem;
//   configs: TreeMapConfig;
// }

// interface ChartProps {
//   layout: () => d3.HierarchyRectangularNode<ITreeMapItem>[];
//   maxWidth: number;
//   maxHeight: number;
//   ID: string;
//   paddingTop?: number;
//   fontSize?: number;
// }

// const MARGIN = 3;
// const SHORT = 5;
// const ANIMATION_TIME = 1000;
// const NIL_COLOR = '#f0f0f066';
// export const transformColor = new Map([
//   ['total', '#111111'],
//   ['create', 'mediumseagreen'],
//   ['modify', 'cornflowerblue'],
//   ['remove', 'red'],
// ]);
// const transformLabel = new Map([
//   ['total', '总'],
//   ['create', '新增'],
//   ['modify', '修改'],
//   ['remove', '删除'],
// ]);
// const LINE_BG_COLOR = '#d2a1ff';

// const showFileDetail = (width: number, height: number) => {
//   const horizontal = width > height;
//   const min = SHORT * 3 + MARGIN * 2;
//   return horizontal ? height > min : width > min;
// };

// function getPosition(index: number, gap: number, horizontal: boolean) {
//   const offset = gap * index;
//   return {
//     x: horizontal ? 0 : offset,
//     y: horizontal ? offset : 0,
//   };
// }

// const generateValueWhenFileChangeRect = (
//   idx: number,
//   generator: (change: boolean) => string,
// ) => (d: d3.HierarchyRectangularNode<ITreeMapItem>) => {
//   // const width = Math.max(d.x1 - d.x0 - MARGIN * 2, 0);
//   // const height = Math.max(d.y1 - d.y0 - MARGIN * 2 - paddingTop, 0);
//   return generator(hasFileChange(d.data, idx));
// };

// function drawTwoPartRect(
//   g: any,
//   data: {
//     pos: { x: number; y: number };
//     key: string;
//     part1: number;
//     part2: number;
//     short: number;
//     color: string;
//     horizontal: boolean;
//   },
// ) {
//   const { pos, key, part1, part2, short, color, horizontal } = data;
//   const unify = `#${g.attr('id')} g.${key}`;
//   let longAttr = horizontal ? 'width' : 'height';
//   let shortAttr = horizontal ? 'height' : 'width';
//   let delay = ANIMATION_TIME;
//   if (document.querySelector(unify)) {
//     // update
//     // 收回原来的长度
//     g.selectAll(`${unify} rect`)
//       .transition()
//       .duration(ANIMATION_TIME)
//       .attr(longAttr, 0);
//     delay = ANIMATION_TIME;
//   } else {
//     // create
//     const group = g
//       .append('g')
//       .attr('class', key)
//       .attr('transform', () => {
//         return `translate(${pos.x},${pos.y})`;
//       });
//     group.append('rect').attr('fill', color).attr('x', 0).attr('y', 0);
//     group.append('rect').attr('fill', color).attr('fill-opacity', 0.5);
//   }
//   // 设置短边
//   g.selectAll(`${unify} rect`)
//     .transition()
//     .duration(0)
//     .delay(delay)
//     .attr(shortAttr, short);

//   g.select(unify)
//     .transition()
//     .duration(0)
//     .delay(delay)
//     .attr('transform', () => {
//       return `translate(${pos.x},${pos.y})`;
//     });

//   g.select(`${unify} rect:first-child`)
//     .transition()
//     .duration(ANIMATION_TIME)
//     .delay(delay)
//     .attr(longAttr, part1);

//   g.select(`${unify} rect:last-child`)
//     .transition()
//     .duration(ANIMATION_TIME)
//     .delay(delay)
//     .attr('x', horizontal ? part1 : 0)
//     .attr('y', horizontal ? 0 : part1)
//     .attr(longAttr, part2);
// }

// function drawFileDetail(
//   node: d3.Selection<
//     any,
//     d3.HierarchyRectangularNode<ITreeMapItem>,
//     any,
//     unknown
//   >,
//   idx: number,
//   paddingTop: number = 3,
// ) {
//   const data = node.data();
//   data.forEach((datum: d3.HierarchyRectangularNode<ITreeMapItem>) => {
//     if (
//       datum.data.fileUuid === undefined ||
//       !Array.isArray(datum.data.detail) ||
//       datum.data.detail[idx].realValue === undefined
//     ) {
//       return;
//     }
//     const group = node.select(`#${datum.data.fileUuid}`);
//     let width = Math.max(datum.x1 - datum.x0 - MARGIN * 2, 0);
//     let height = Math.max(datum.y1 - datum.y0 - MARGIN * 2 - paddingTop, 0);
//     const horizontal: boolean = width > height;
//     if (!showFileDetail(width, height)) {
//       width = 0;
//       height = 0;
//     }
//     const long = horizontal ? width : height;
//     const max = hasFileChange(datum.data, idx)
//       ? Math.max(
//           ...Object.values(datum.data.detail[idx].change).map(
//             (list) => list[0] + list[1],
//           ),
//         )
//       : 1;
//     const scale = d3.scaleLinear().domain([0, max]).range([0, long]);

//     let hasDrawReactNum = 0;
//     Object.keys(datum.data.detail?.[idx]?.change).forEach((key) => {
//       const pos = getPosition(hasDrawReactNum, SHORT + MARGIN, horizontal);
//       const [live, death] =
//         datum.data.detail?.[idx]?.change?.[
//           key as 'create' | 'remove' | 'modify'
//         ] ?? [];
//       if (live + death !== 0) {
//         hasDrawReactNum++;
//       }
//       drawTwoPartRect(group, {
//         pos,
//         key,
//         part1: scale(live),
//         part2: scale(death),
//         short: live + death === 0 ? 0 : SHORT,
//         color: transformColor.get(key) ?? 'yellow',
//         horizontal,
//       });
//     });
//   });
// }

// const drawTreemap = (
//   svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>,
//   idx: number,
//   props: ChartProps,
// ) => {
//   const { layout, ID, paddingTop, maxWidth, fontSize } = props;
//   const setFileChangeRectStrokeColorWithPaddingTop = generateValueWhenFileChangeRect(
//     idx,
//     (change) => (change ? LINE_BG_COLOR : '#f0f0f000'),
//   );
//   const setFileChangeRectStrokeWidthWithPaddingTop = generateValueWhenFileChangeRect(
//     idx,
//     (change) => (change ? '2px' : '2px'),
//   );
//   // 更新画布
//   if (!document.getElementById(ID)) {
//     svg.append('g').attr('id', ID);
//     // return updateFunc(d3.select(`#${ID}`).selectAll('g.node-group'), layout);
//   }

//   // 初始化画布
//   const rectUID = UID('rect');
//   // 获取 有值有元素的 部分 update
//   const update = d3.select(`#${ID}`).selectAll('g.node-group').data(layout);
//   // 获取 有值无元素的 部分 enter
//   const enter = update.enter();
//   // 获取 无值有元素的 部分 exit
//   const exit = update.exit();

//   appendTreeItemNode(enter);
//   updateTreeItemNode(update);
//   removeTreeItemNode(exit);

//   function onMouseMoveWithIdx(idx: number) {
//     return throttle(
//       (e: MouseEvent, datum: d3.HierarchyRectangularNode<ITreeMapItem>) => {
//         const tooltip = d3.select('div.itw-d3-tooltip');
//         tooltip.style('visibility', 'hidden');
//         if (!Array.isArray(datum.data.detail)) {
//           return;
//         }
//         if (
//           tooltip.select('div.itw-d3-tooltip-title').text() !== datum.data.name
//         ) {
//           tooltip.select('div.itw-d3-tooltip-title').text(datum.data.name);
//           tooltip
//             .select('div.itw-d3-tooltip-title')
//             .append('p')
//             .text(`${datum.data.fileUuid?.replace('_', '')}`);
//           tooltip
//             .select('div.itw-d3-tooltip-title')
//             .append('p')
//             .text(`代码行数：${datum.data.detail[idx].realValue}`);
//           const table = tooltip.select('table.itw-d3-tooltip-list');
//           table.selectChildren().remove();
//           Object.keys(datum.data.detail?.[idx].change).forEach((key, index) => {
//             const color = transformColor.get(key);
//             const label = transformLabel.get(key);
//             const [live, death] =
//               datum.data.detail?.[idx].change?.[
//                 key as 'create' | 'remove' | 'modify'
//               ] ?? [];
//             const tr = tooltip.select('table.itw-d3-tooltip-list').append('tr');
//             tr.append('td')
//               .attr('class', 'itw-d3-tooltip-mark')
//               .attr(
//                 'style',
//                 `background: ${color}; width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 8px;`,
//               );
//             tr.append('td')
//               .attr('class', 'itw-d3-tooltip-label')
//               .html(`留存${label}：`);
//             tr.append('td').attr('class', 'itw-d3-tooltip-value').text(live);
//             tr.append('td')
//               .attr('class', 'itw-d3-tooltip-label')
//               .html(`消失${label}：`);
//             tr.append('td').attr('class', 'itw-d3-tooltip-value').text(death);
//           });
//         }
//         const height = (tooltip.node() as HTMLElement).getBoundingClientRect()
//           .height;
//         const width = (tooltip.node() as HTMLElement).getBoundingClientRect()
//           .width;
//         const event = e as any;
//         const isTop = event.layerY > height;
//         const isLeft = maxWidth - event.layerX > width;
//         tooltip
//           .style('left', `${event.layerX - (!isLeft ? width + 12 : -12)}px`)
//           .style('top', `${event.layerY - (isTop ? height + 8 : -8)}px`)
//           .style('visibility', 'visible');
//       },
//       30,
//     );
//   }

//   function appendTreeItemNode(
//     enter: d3.Selection<
//       any,
//       d3.HierarchyRectangularNode<ITreeMapItem>,
//       any,
//       unknown
//     >,
//   ) {
//     const onMouseMove = onMouseMoveWithIdx(idx);
//     const node = enter
//       .append('g')
//       .attr('class', 'node-group')
//       .attr('transform', (d) => `translate(${d.x0},${d.y0})`);
//     node
//       .append('rect')
//       .attr('class', 'node')
//       .attr('id', (d: any) => (d.rectUid = rectUID()).id)
//       // .attr('stroke', (d) => '#33333333')
//       .attr('stroke', setFileChangeRectStrokeColorWithPaddingTop)
//       .attr('stroke-width', setFileChangeRectStrokeWidthWithPaddingTop)
//       .attr('fill', (d) => d.data.detail?.[idx].heatColor ?? NIL_COLOR)
//       .attr('rx', 4)
//       .attr('ry', 4)
//       .attr('width', (d) => d.x1 - d.x0)
//       .attr('height', (d) => d.y1 - d.y0)
//       .on('mousemove', onMouseMove);

//     node
//       .append('g')
//       .attr('class', 'file-detail')
//       .attr('id', (d) => d.data.fileUuid ?? '')
//       .attr('transform', `translate(${MARGIN},${MARGIN + (paddingTop ?? 0)})`);
//     drawFileDetail(node, idx, paddingTop);

//     node
//       .append('foreignObject')
//       .attr('width', (d) => d.x1 - d.x0)
//       .attr('height', () => (paddingTop ?? 0) + MARGIN)
//       .on('mousemove', onMouseMove);
//     node
//       .select('foreignObject')
//       .selectAll('p')
//       .data((d: any) => {
//         return [
//           {
//             text: d.data.detail[idx].realValue
//               ? format(d.data.detail[idx].realValue)
//               : '',
//             type: 'line-num',
//           },
//         ];
//       })
//       .join('xhtml:p')
//       .attr('class', (d) => d.type)
//       .attr(
//         'style',
//         () =>
//           `line-height: ${fontSize}px; margin: ${MARGIN}px 0 0  ${
//             (MARGIN * 2) / 3
//           }px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`,
//       )
//       .text((d) => d.text);
//   }

//   function updateTreeItemNode(
//     update: d3.Selection<
//       d3.BaseType,
//       d3.HierarchyRectangularNode<ITreeMapItem>,
//       d3.BaseType,
//       unknown
//     >,
//   ) {
//     const onMouseMove = onMouseMoveWithIdx(idx);
//     update.select('rect.node').on('mousemove', onMouseMove);
//     update.select('foreignObject').on('mousemove', onMouseMove);
//     update.select('g.file-detail').attr('id', (d) => d.data.fileUuid ?? '');
//     update.select('g.file-detail').filter("[id='']").selectChildren().remove();
//     drawFileDetail(update, idx, paddingTop);
//     update
//       .transition()
//       .duration(0)
//       .delay(ANIMATION_TIME)
//       .attr('transform', (d) => `translate(${d.x0},${d.y0})`)
//       .call((node) =>
//         node
//           .select('rect.node')
//           .attr('stroke-width', setFileChangeRectStrokeWidthWithPaddingTop)
//           .attr('width', (d) => d.x1 - d.x0)
//           .attr('height', (d) => d.y1 - d.y0)
//           .transition()
//           .duration(ANIMATION_TIME)
//           .attr('fill', (d) => d.data.detail?.[idx].heatColor ?? NIL_COLOR)
//           .attr('stroke', setFileChangeRectStrokeColorWithPaddingTop),
//       );
//     update
//       .select('foreignObject')
//       .transition()
//       .duration(ANIMATION_TIME)
//       .delay(ANIMATION_TIME)
//       .attr('width', (d) => d.x1 - d.x0);

//     update
//       .select('foreignObject p.line-num')
//       .transition()
//       .duration((d) => (hasFileChange(d.data, idx) ? ANIMATION_TIME : 0))
//       .delay(ANIMATION_TIME)
//       .tween('text', function (d) {
//         const self = this as Element;
//         const v = d.data.detail?.[idx].realValue ?? '';
//         if (v === '') {
//           return () => {
//             self.textContent = '';
//           };
//         }
//         const isMinus = self.textContent?.includes('−');
//         // @ts-ignore
//         const beforeStr = self.textContent.replace(/[−,]/g, '');
//         const before = isMinus ? -1 * +beforeStr : +beforeStr;
//         const next = d.data.detail?.[idx].realValue ?? 0;
//         if (before === next) {
//           return () => {
//             self.textContent = format(next);
//           };
//         }
//         const i = d3.interpolateNumber(before, next);

//         return (t) => {
//           self.textContent = format(i(t));
//         };
//       });
//   }

//   function removeTreeItemNode(
//     exit: d3.Selection<d3.BaseType, unknown, d3.BaseType, unknown>,
//   ) {
//     exit.remove();
//   }
// };

// function drawStatisticDashboard(
//   svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>,
//   id: string,
//   data: { name: string; value: number }[],
//   pos: { x: number; y: number },
// ) {
//   const SIZE = [16, 24];
//   const TEXT_MARGIN = 12;
//   // 更新画布
//   if (document.getElementById(id)) {
//     return update(d3.select(`#${id}`), data);
//   }
//   const group = svg
//     .append('g')
//     .attr('id', id)
//     .attr('transform', () => `translate(${pos.x},${pos.y})`)
//     .on(
//       'mousemove',
//       throttle(() => {
//         const tooltip = d3.select('div.itw-d3-tooltip');
//         tooltip.style('visibility', 'hidden');
//       }, 100),
//     );
//   const enter = group.selectAll('g').data(data).enter();
//   const text = enter
//     .append('g')
//     .attr('transform', (_, i) => {
//       const gap = i * (SIZE[0] + SIZE[1] + TEXT_MARGIN * 2) + SIZE[0];
//       return `translate(0, ${gap})`;
//     })
//     .append('text');
//   // .attr('font-family', 'serif');
//   text
//     .append('tspan')
//     .attr('font-size', SIZE[0])
//     .attr('x', 3)
//     .attr('y', 0)
//     .attr('fill', '#333333')
//     .text((d) => `项目${transformLabel.get(d.name)}代码行`);
//   text
//     .append('tspan')
//     .attr('font-size', SIZE[1])
//     .attr('font-family', 'Georgia')
//     .attr('x', 6)
//     .attr('y', SIZE[0] + TEXT_MARGIN)
//     .attr('fill', (d) => transformColor.get(d.name) ?? '#333333')
//     .text((d) => format(d.value));
//   function update(
//     g: d3.Selection<d3.BaseType, unknown, HTMLElement, any>,
//     data: { name: string; value: number }[],
//   ) {
//     g.selectAll('g')
//       .data(data)
//       .transition()
//       .duration(ANIMATION_TIME)
//       .delay(ANIMATION_TIME)
//       .select('text tspan:last-child')
//       .tween('text', function (d) {
//         const self = this as Element;
//         const i = d3.interpolateNumber(
//           // @ts-ignore
//           +self.textContent.replace(/,/g, ''),
//           d.value ?? 0,
//         );

//         return (t) => {
//           self.textContent = format(i(t));
//         };
//       });
//   }
// }

// function drawLegend(
//   svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>,
//   id: string,
//   pos: { x: number; y: number },
// ) {
//   const FONT_SIZE = 14;
//   const ROW_HEIGHT = 20;
//   const LEBAL_LEFT = 40;
//   const MARGIN = 7;
//   const group = svg
//     .append('g')
//     .attr('id', id)
//     .attr('transform', () => `translate(${pos.x},${pos.y})`)
//     .on(
//       'mousemove',
//       throttle(() => {
//         const tooltip = d3.select('div.itw-d3-tooltip');
//         tooltip.style('visibility', 'hidden');
//       }, 100),
//     );
//   group
//     .append('g')
//     .append('text')
//     .attr('x', MARGIN)
//     .attr('y', FONT_SIZE)
//     .attr('font-size', FONT_SIZE)
//     .text('图例');
//   const legendData = [
//     {
//       rect: {
//         stroke: '#33333333',
//         rx: 4,
//         ry: 4,
//         width: ROW_HEIGHT,
//         height: ROW_HEIGHT,
//         fill: '#ffffff',
//       },
//       text: '文件/模块/库/项目',
//     },
//     {
//       rect: {
//         stroke: '#33333333',
//         rx: 4,
//         ry: 4,
//         width: ROW_HEIGHT,
//         height: ROW_HEIGHT,
//         fill: LINE_BG_COLOR,
//       },
//       text: '本次修改文件',
//     },
//     {
//       rect: {
//         fill: transformColor.get('create'),
//         width: 30,
//         height: 10,
//       },
//       text: '留存新增代码',
//     },
//     {
//       rect: {
//         fill: transformColor.get('create'),
//         opacity: 0.5,
//         width: 30,
//         height: 10,
//       },
//       text: '消失新增代码',
//     },
//     {
//       rect: {
//         fill: transformColor.get('modify'),
//         width: 30,
//         height: 10,
//       },
//       text: '留存修改代码',
//     },
//     {
//       rect: {
//         fill: transformColor.get('modify'),
//         opacity: 0.5,
//         width: 30,
//         height: 10,
//       },
//       text: '消失修改代码',
//     },
//     {
//       rect: {
//         fill: transformColor.get('remove'),
//         width: 30,
//         height: 10,
//       },
//       text: '留存删除代码',
//     },
//     {
//       rect: {
//         fill: transformColor.get('remove'),
//         opacity: 0.5,
//         width: 30,
//         height: 10,
//       },
//       text: '消失删除代码',
//     },
//   ];
//   legendData.forEach(({ rect, text }, index) => {
//     const g = group
//       .append('g')
//       .attr(
//         'transform',
//         `translate(${2 * MARGIN},${
//           index * (MARGIN + ROW_HEIGHT) + MARGIN + ROW_HEIGHT
//         })`,
//       );
//     g.append('rect')
//       .attr(
//         'transform',
//         `translate(0, ${(ROW_HEIGHT - (rect.height ?? 10)) / 2})`,
//       )
//       .attr('stroke', rect.stroke ?? 'none')
//       .attr('rx', rect.rx ?? 0)
//       .attr('ry', rect.ry ?? 0)
//       .attr('width', rect.width ?? 10)
//       .attr('height', rect.height ?? 10)
//       .attr('fill', rect.fill ?? 'none')
//       .attr('fill-opacity', rect.opacity ?? 'none');
//     g.append('text')
//       .attr('x', MARGIN + LEBAL_LEFT)
//       .attr('y', FONT_SIZE)
//       .attr('font-size', FONT_SIZE - 2)
//       .text(text);
//   });
//   return group;
// }

// const TreeMap2: React.FC<TreeMapProps> = (props) => {
//   const { keyList, data, configs = {} } = props;
//   const svgWidth = useMemo(() => configs.width ?? 500, [configs]);
//   const svgHeight = useMemo(() => configs.height ?? 500, [configs]);
//   const fontSize = useMemo(() => {
//     return configs.paddingTop !== undefined
//       ? Math.floor(configs.paddingTop - MARGIN)
//       : configs.width !== undefined
//       ? Math.floor(configs.width / 400) * 5
//       : 10;
//   }, [configs]);
//   const IDRef = useRef(UID('treemap')().id);

//   // const [count, setCount] = useState(0);
//   const [animation, setAnimation] = useState(false);
//   // const [sortTransition, setSortTransition] = useState(true);

//   // 设置当前 frame 防止 useEffect 重复渲染
//   const frameRef = useRef<number>(0);
//   const [frameIndex, setFrameIndex] = useState<number>(0);
//   frameRef.current = frameIndex;

//   useEffect(() => {
//     let st: NodeJS.Timeout;
//     let localIndex = 0;
//     if (animation) {
//       st = setInterval(() => {
//         frameRef.current += 1;
//         setFrameIndex((cur) => {
//           if (cur + 1 >= keyList.length) {
//             clearInterval(st);
//             return cur;
//           }
//           return cur + 1;
//         });
//       }, 2 * ANIMATION_TIME + 500);
//       localIndex = 0;
//     } else {
//       setFrameIndex(localIndex);
//     }
//     return () => clearInterval(st);
//   }, [animation, keyList.length]);

//   const beauti = useMemo(() => beautifyDataset(data.treemap), [data.treemap]);
//   const treemapLayout = useMemo(() => {
//     const treemapWidth = svgWidth - 200;
//     return getLayout(beauti, {
//       ...configs,
//       width: treemapWidth,
//     });
//   }, [svgWidth, beauti, configs]);
//   // 渲染不同的 Frame
//   useLayoutEffect(() => {
//     const statisticData = getSumData(beauti, frameIndex);
//     const treemapWidth = svgWidth - 200;
//     const svg = d3.select(`#${IDRef.current}_svg`).on(
//       'mouseleave',
//       throttle(() => {
//         const tooltip = d3.select('div.itw-d3-tooltip');
//         tooltip.style('visibility', 'hidden');
//       }, 100),
//     );
//     drawTreemap(svg, frameIndex, {
//       layout: treemapLayout,
//       maxWidth: treemapWidth,
//       maxHeight: svgHeight,
//       ID: IDRef.current,
//       paddingTop: configs.paddingTop,
//       fontSize,
//     });
//     drawStatisticDashboard(svg, `${IDRef.current}_statistic`, statisticData, {
//       x: treemapWidth + MARGIN,
//       y: 0,
//     });
//   }, [
//     frameIndex,
//     svgHeight,
//     fontSize,
//     treemapLayout,
//     svgWidth,
//     configs.paddingTop,
//     beauti,
//   ]);
//   useLayoutEffect(() => {
//     const treemapWidth = svgWidth - 200;
//     const svg = d3.select(`#${IDRef.current}_svg`);

//     const legend = drawLegend(svg, `${IDRef.current}_legend`, {
//       x: treemapWidth + MARGIN,
//       y: 300,
//     });
//     return () => {
//       legend.remove();
//     };
//   }, [svgWidth]);

//   return (
//     <div>
//       <Row>
//         <Col span={5}>
//           <Checkbox
//             checked={animation}
//             onChange={(e) => setAnimation(e.target.checked)}
//           >
//             逐帧动画
//           </Checkbox>
//         </Col>
//         <Col span={5}>
//           <InputNumber
//             size="small"
//             min={0}
//             max={keyList.length - 1}
//             value={frameIndex}
//             onChange={(e: number) => {
//               setAnimation(false);
//               setFrameIndex(e);
//             }}
//           />
//         </Col>
//         <Col span={14}>
//           <Typography.Text>{keyList[frameIndex].id}</Typography.Text> |
//           <Typography.Text> {keyList[frameIndex].extra}</Typography.Text>
//         </Col>
//       </Row>
//       <div style={{ position: 'relative' }}>
//         {/* <div style={{ display: 'flex' }}> */}
//         <svg
//           id={`${IDRef.current}_svg`}
//           style={{
//             width: svgWidth,
//             height: svgHeight,
//             overflow: 'hidden',
//             fontSize: `${fontSize}px`,
//           }}
//           viewBox={`0 0 ${svgWidth} ${svgHeight}`}
//         />
//         {/* </div> */}
//         <div
//           className="itw-d3-tooltip"
//           style={{
//             position: 'absolute',
//             visibility: 'hidden',
//             zIndex: 8,
//             transition:
//               'left 0.4s cubic-bezier(0.23, 1, 0.32, 1) 0s, top 0.4s cubic-bezier(0.23, 1, 0.32, 1) 0s',
//             boxShadow: 'rgb(174, 174, 174) 0px 0px 10px',
//             borderRadius: '3px',
//             padding: '0px 12px',
//             backgroundColor: '#fff',
//             fontSize: '12px',
//             fontFamily: 'serif',
//             opacity: 0.94,
//             pointerEvents: 'none',
//             left: 0,
//             top: 0,
//           }}
//         >
//           <div
//             className="itw-d3-tooltip-title"
//             style={{
//               marginTop: '10px',
//             }}
//           />
//           <table
//             className="itw-d3-tooltip-list"
//             style={{
//               padding: '0px',
//               margin: '10px 0px',
//             }}
//           />
//         </div>
//       </div>
//     </div>
//   );
// };
const TreeMap2 = () => {};

export default TreeMap2;
