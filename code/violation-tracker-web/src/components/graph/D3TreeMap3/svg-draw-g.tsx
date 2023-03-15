import { COLORLIST } from '@/color';
import { throttle } from '@/utils';
import { str2number } from '@/utils/conversion';
import { LineRange } from '@/utils/line-range';
import { Avatar } from 'antd';
import * as d3 from 'd3';
// import moment from 'moment';
import ReactDOM from 'react-dom';
import { FileDetailClickData, ITreeItemDetail, ITreeMapItem } from '.';
import { deltaFunction, format, generateIdByFileUuid } from './d3-utils';
import { robustNormalization } from './normalizition-utils';
import { PluginRefProps } from './plugin/BasePlugin';
import { middleSort } from './sort-utils';

export function getPatternUrlByType(type: string) {
  const color = transformColor.get(type)?.replace('#', '%23');
  return `p(a)data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h16v2h-6v6h6v8H8v-6H2v6H0V0zm4 4h2v2H4V4zm8 8h2v2h-2v-2zm-8 0h2v2H4v-2zm8-8h2v2h-2V4z' fill='${color}' fill-opacity='0.8' fill-rule='evenodd'/%3E%3C/svg%3E`;
}

function getPosition(
  offset: number,
  horizontal: boolean,
  initail: { x: number; y: number } = { x: 0, y: 0 },
) {
  return {
    x: initail.x + (horizontal ? offset : 0),
    y: initail.y + (horizontal ? 0 : offset),
  };
}

interface ChartProps {
  layout: () => d3.HierarchyRectangularNode<ITreeMapItem>[];
  maxWidth: number;
  maxHeight: number;
  paddingTop?: number;
  fontSize?: number;
}

type DetailClickFunction = (
  e: MouseEvent,
  data: FileDetailClickData,
) => Map<string, string>;

export const PLUGIN_MASK_ID = 'code-treemap-plugin-mask';
// ---
export const MARGIN = 3;
export const FILE_MARGIN = 1;
export const MIN_RECT_WIDTH = 2;
// -----
export const ANIMATION_TIME = 0;
export const NIL_COLOR = '#f0f0f066';
export const LINE_DIR_COLOR = '#999999';
export const LINE_CHANGE_COLOR = '#ee00ee';
export const NIL_OPACITY = 1;
export const transformColor = new Map([
  ['total', '#111111'],
  ['create', 'mediumseagreen'],
  ['modify', 'cornflowerblue'],
  ['remove', 'red'],
  ['normal', '#b5dcff'],
  ['hidden', '#cfcfcf'],
]);
// const minimumPortion = (total: number) => total / (transformColor.size * 3);
export const transformLabel = new Map([
  ['total', '当前总'],
  ['create', '当前新增'],
  ['modify', '当前修改'],
  ['remove', '当前删除'],
  ['normal', '当前不变'],
  ['hidden', '当前不存在'],
]);

function normalizitionNums(nums: number[]) {
  const minIdx = nums.reduce((acc, item, idx) => {
    if (nums[acc] > item) {
      return idx;
    }
    return acc;
  }, 0);
  const standardList = robustNormalization(nums);
  const bias = nums[minIdx] - standardList[minIdx];
  const results = standardList.map((item) => item + bias);
  return results;
}
function normalizeLines(
  lines: {
    key: string;
    lines: number;
  }[][],
) {
  const [first, second] = lines;
  const firstLength = first.length;
  const merged = first.concat(second).map(({ lines }) => lines);
  const normalized = normalizitionNums(merged);
  return [
    first.map((item, idx) => ({
      key: item.key,
      realLines: item.lines,
      lines: normalized[idx],
    })),
    second.map((item, idx) => ({
      key: item.key,
      realLines: item.lines,
      lines: normalized[firstLength + idx],
    })),
  ];
}

function drawPluginMask(
  centerElement: JSX.Element,
  centerElementId: string,
  pos: { x: number; y: number },
  x0: number,
  y0: number,
  width: number,
  height: number,
) {
  const pluginMask = d3.select(`div#${PLUGIN_MASK_ID}`);
  const centerElementClassName = 'center-element';
  if (!document.querySelector(`#${centerElementId}`)) {
    pluginMask
      .append('div')
      .attr('id', centerElementId)
      .attr('class', centerElementClassName);
  }
  ReactDOM.render(
    centerElement,
    document.getElementById(centerElementId),
    () => {
      const wrapper = pluginMask.select(`#${centerElementId}`);
      function calcCenterPos() {
        const wHeight = (wrapper.node() as HTMLElement).getBoundingClientRect()
          .height;
        const wWidth = (wrapper.node() as HTMLElement).getBoundingClientRect()
          .width;
        return {
          x: x0 + pos.x + (width - wWidth) / 2,
          y: y0 + pos.y + (height - wHeight) / 2,
        };
      }
      const centerPos = calcCenterPos();
      wrapper.attr(
        'style',
        `position: absolute; left: ${centerPos.x}px; top: ${centerPos.y}px`,
      );
    },
  );
}

export function generateUnifyClassByFileUuid(fileUuid?: string) {
  return 'node-g' + fileUuid ? generateIdByFileUuid(fileUuid) : '';
}

interface OneRectData {
  type: string;
  pos: { x: number; y: number };
  key: string;
  fixedEdge: number;
  activeEdge: number;
  color: string;
  horizontal: boolean;
  opacity?: number;
  backgroundType?: 'solid' | 'grid';
  x0: number;
  y0: number;
  centerElement?: JSX.Element;
}
export function drawOneRect(
  node: d3.Selection<d3.BaseType, any, any, unknown>,
  fileUuid: string,
  data: OneRectData,
  onClick: (e: MouseEvent) => void,
) {
  const {
    pos,
    key,
    fixedEdge,
    activeEdge,
    horizontal,
    backgroundType = 'solid',
    opacity = 1,
    type,
    color,
    x0,
    y0,
    centerElement = <></>,
  } = data;
  let activeAttr = horizontal ? 'width' : 'height';
  let fixedAttr = horizontal ? 'height' : 'width';
  let delay = ANIMATION_TIME;

  if (node.select(`g.${key}`).size() > 0) {
    // update
    // 收回活动边原来的长度
    // g.selectAll(`${unify} rect`)
    //   .transition()
    //   .duration(ANIMATION_TIME)
    //   .attr(activeAttr, 0);
  } else {
    // create
    const group = node
      .append('g')
      .attr('class', key)
      .attr('transform', () => {
        return `translate(${pos.x},${pos.y})`;
      });
    group
      .append('rect')
      .attr(
        'fill',
        backgroundType === 'grid' ? getPatternUrlByType(type) : color,
      )
      .attr('x', 0)
      .attr('y', 0)
      .attr('fill-opacity', opacity);
  }
  const keyGroup = node.select(`g.${key}`);
  keyGroup.on('click', onClick);
  keyGroup
    .transition()
    .duration(0)
    .delay(delay)
    .attr('transform', () => {
      return `translate(${pos.x},${pos.y})`;
    });
  const rect = keyGroup.select('rect');
  // 设置活动边
  rect.transition().duration(0).delay(delay).attr(activeAttr, activeEdge);
  // 设置固定边
  rect
    .transition()
    .duration(ANIMATION_TIME)
    .delay(delay)
    .attr(fixedAttr, fixedEdge);

  // 添加中央插件元素
  drawPluginMask(
    centerElement,
    `center_${key}_${fileUuid}`,
    pos,
    x0,
    y0,
    horizontal ? activeEdge : fixedEdge,
    horizontal ? fixedEdge : activeEdge,
  );
}
export function drawRectIsChange(
  rect: d3.Selection<any, any, any, unknown>,
  change: boolean,
) {
  rect.attr('stroke', change ? LINE_CHANGE_COLOR : 'white');
}
const onMouseMove = (detail: ITreeItemDetail, maxWidth: number) =>
  throttle(
    (e: MouseEvent, datum: d3.HierarchyRectangularNode<ITreeMapItem>) => {
      const tooltip = d3.select('div.itw-d3-tooltip');
      tooltip.style('visibility', 'hidden');
      if (datum.data.fileUuid === undefined) {
        return;
      }

      const UNIFY = `idx_${datum.data.key}`;
      if (tooltip.select('div.itw-d3-tooltip-title').attr('id') !== UNIFY) {
        tooltip
          .select('div.itw-d3-tooltip-title')
          .attr('id', UNIFY)
          .text(datum.data.name);
        const title = tooltip.select('div.itw-d3-tooltip-title');

        // 添加历史开发者
        const historyDeveloperId = 'history-developers';
        title.append('div').attr('id', historyDeveloperId);
        const developers = (
          <Avatar.Group maxCount={10}>
            {detail.committers.map((committer) => (
              <Avatar
                key={committer}
                style={{
                  backgroundColor:
                    COLORLIST[str2number(committer) % COLORLIST.length],
                }}
                size="small"
              >
                {committer.slice(0, 3)}
              </Avatar>
            ))}
          </Avatar.Group>
        );
        ReactDOM.render(
          developers,
          document.getElementById(historyDeveloperId),
        );

        title.append('p').text(`最新文件路径：${datum.data.filePath}`);
        title.append('p').text(`当前文件路径：${detail.filePath}`);
        title.append('p').text(`当前代码行数：${detail.value}`);
        const table = tooltip.select('table.itw-d3-tooltip-list');
        table.selectChildren().remove();
        Object.keys(detail.change).forEach((key) => {
          const color = transformColor.get(key);
          const label = transformLabel.get(key);
          const [live, death] =
            detail.change?.[key as 'create' | 'remove' | 'modify' | 'normal'] ??
            [];
          const tr = tooltip.select('table.itw-d3-tooltip-list').append('tr');
          if (key === 'remove') {
            tr.append('td');
            tr.append('td');
            tr.append('td');
          } else {
            tr.append('td')
              .attr('class', 'itw-d3-tooltip-mark')
              .attr(
                'style',
                `background: ${color}; width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 8px;`,
              );
            tr.append('td')
              .attr('class', 'itw-d3-tooltip-label')
              .html(
                key === 'hidden' ? '未来新增代码' : `最新版本有的${label}：`,
              );
            tr.append('td').attr('class', 'itw-d3-tooltip-value').text(live);
          }
          tr.append('td')
            .attr('class', 'itw-d3-tooltip-mark')
            .attr(
              'style',
              `background: ${color}; opacity: 0.5; width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin: 0 8px;`,
            );
          tr.append('td')
            .attr('class', 'itw-d3-tooltip-label')
            .html(
              key === 'hidden' ? '历史删除代码' : `最新版本没有的${label}：`,
            );
          tr.append('td').attr('class', 'itw-d3-tooltip-value').text(death);
        });
      }
      const height = (tooltip.node() as HTMLElement).getBoundingClientRect()
        .height;
      const width = (tooltip.node() as HTMLElement).getBoundingClientRect()
        .width;
      const event = e as any;
      const mouseOffsetX = event.canvasX;
      const mouseOffsetY = event.canvasY;
      const isTop = mouseOffsetY > height;
      const isLeft = maxWidth - mouseOffsetX > width;
      tooltip
        .style('left', `${mouseOffsetX - (!isLeft ? width + 12 : -12)}px`)
        .style('top', `${mouseOffsetY - (isTop ? height + 8 : -8)}px`)
        .style('visibility', 'visible');
    },
    100,
  );

export function drawFileDetail(
  node: d3.Selection<any, any, any, unknown>,
  evoluation: ITreeItemDetail,
  fileUuid: string,
  pluginRefs: React.MutableRefObject<PluginRefProps | null>[],
  maxWidth: number,
  onClickGetExtraMap?: DetailClickFunction,
) {
  // const time = moment();
  if (fileUuid === undefined || node.size() === 0) return;
  const detail = evoluation;
  if (detail === undefined || detail.value === undefined) {
    return;
  }
  node.on('mousemove', onMouseMove(detail, maxWidth));

  const datum = node.datum();
  let width = Math.max(datum.x1 - datum.x0 - FILE_MARGIN * 2, 0);
  let height = Math.max(datum.y1 - datum.y0 - FILE_MARGIN * 2, 0);
  const horizontal: boolean = width > height;
  const long = horizontal ? width : height;
  const short = horizontal ? height : width;
  let latestLiveDetails = middleSort(
    [
      {
        key: 'normal',
        lines: detail.change.normal[0],
      },
      {
        key: 'create',
        lines: detail.change.create[0],
      },
      {
        key: 'modify',
        lines: detail.change.modify[0],
      },
      {
        key: 'remove',
        lines: detail.change.remove[0],
      },
    ].sort(({ lines: a }, { lines: b }) => a - b),
  );
  latestLiveDetails.push({
    key: 'hidden',
    lines: detail.change.hidden[0],
  });
  let latestNilDetails = middleSort(
    [
      {
        key: 'normal',
        lines: detail.change.normal[1],
      },
      {
        key: 'create',
        lines: detail.change.create[1],
      },
      {
        key: 'modify',
        lines: detail.change.modify[1],
      },
      {
        key: 'remove',
        lines: detail.change.remove[1],
      },
    ].sort(({ lines: a }, { lines: b }) => a - b),
  );
  latestNilDetails.push({
    key: 'hidden',
    lines: detail.change.hidden[1],
  });
  // 对数据进行标准化
  const normalizedLineDetails = normalizeLines([
    latestLiveDetails,
    latestNilDetails,
  ]);
  latestLiveDetails = normalizedLineDetails[0];
  latestNilDetails = normalizedLineDetails[1];

  const addLines = (acc: number, { lines }: { lines: number }) => acc + lines;
  const latestLiveLineNum = latestLiveDetails.reduce(addLines, 0);
  const latestNilLineNum = latestNilDetails.reduce(addLines, 0);
  const scaleFile = d3
    .scaleLinear()
    .domain([0, latestLiveLineNum + latestNilLineNum])
    .range([0, short]);
  const GAP = 1;
  const liveFixedEdge = Math.max(0, scaleFile(latestLiveLineNum) - GAP / 2);
  const needGap = liveFixedEdge > 0;
  const nilFixedEdge = Math.max(
    needGap ? short - liveFixedEdge - GAP : short,
    0,
  );
  const livePos = getPosition(0, !horizontal);
  const nilPos = getPosition(
    needGap ? liveFixedEdge + GAP : liveFixedEdge,
    !horizontal,
  );
  const scaleFileLive = d3
    .scaleLinear()
    .domain([0, latestLiveLineNum])
    .range([0, long]);
  const scaleFileNil = d3
    .scaleLinear()
    .domain([0, latestNilLineNum])
    .range([0, long]);

  const beautiChangeLine = (x: number) => x;

  const onRectClick = (lineRanges: LineRange[]) => (e: MouseEvent) => {
    onClickGetExtraMap?.(e, {
      lineRanges,
      fileLines: [latestLiveDetails, latestNilDetails],
      filePath: datum.data.filePath ?? '<NONE>',
    });
  };
  // console.log('计算演化数据时间', moment().diff(time, 'millisecond'));
  // 绘图
  latestLiveDetails.reduce(
    (acc, { key, lines }) => {
      // 美化行号
      const beautiFileLines = deltaFunction(
        lines,
        acc.offset,
        beautiChangeLine,
      );
      // 计算 活动边
      let activeEdge = scaleFileLive(beautiFileLines);
      // 控制最小边宽
      if (activeEdge > 0 && activeEdge < MIN_RECT_WIDTH) {
        acc.layoutOffset = Math.max(acc.layoutOffset - MIN_RECT_WIDTH / 2, 0);
        activeEdge = MIN_RECT_WIDTH;
      }

      const lineRanges =
        key === 'remove'
          ? detail.beforeLineRanges.remove.live
          : detail.lineRanges[key as keyof Omit<CP.LineValue<null>, 'remove'>]
              .live;
      const centerElement = key.startsWith('hidden') ? undefined : (
        <>
          {pluginRefs.map((ref, index) =>
            ref.current?.tag(
              {
                lineRanges,
                fileLines: [latestLiveDetails, latestNilDetails],
                filePath: datum.data.filePath ?? '<NONE>',
              },
              `plugin-key-${index}`,
            ),
          )}
        </>
      );

      const pos = getPosition(acc.layoutOffset, horizontal, livePos);
      drawOneRect(
        node,
        fileUuid,
        {
          type: key,
          pos,
          key: `${key}-live`,
          fixedEdge: liveFixedEdge,
          activeEdge,
          color: transformColor.get(key) ?? 'yellow',
          horizontal,
          opacity: 1,
          x0: datum.x0,
          y0: datum.y0,
          centerElement: lines > 0 ? centerElement : undefined,
        },
        onRectClick(lineRanges),
      );
      acc.layoutOffset += activeEdge;
      acc.offset += lines;
      return acc;
    },
    { offset: 0, layoutOffset: 0 },
  );
  latestNilDetails.reduce(
    (acc, { key, lines }) => {
      // 美化行号
      const beautiFileLines = deltaFunction(
        lines,
        acc.offset,
        beautiChangeLine,
      );
      // 计算 活动边
      let activeEdge = scaleFileNil(beautiFileLines);
      // 控制最小边宽
      if (activeEdge > 0 && activeEdge < MIN_RECT_WIDTH) {
        acc.layoutOffset = Math.max(acc.layoutOffset - MIN_RECT_WIDTH / 2, 0);
        activeEdge = MIN_RECT_WIDTH;
      }

      const lineRanges =
        key === 'remove'
          ? detail.beforeLineRanges.remove.nil
          : detail.lineRanges[key as keyof Omit<CP.LineValue<null>, 'remove'>]
              .nil;
      const centerElement = key.startsWith('hidden') ? undefined : (
        <>
          {pluginRefs.map((ref, index) =>
            ref.current?.tag(
              {
                lineRanges,
                fileLines: [latestLiveDetails, latestNilDetails],
                filePath: datum.data.filePath ?? '<NONE>',
              },
              `plugin-key-${index}`,
            ),
          )}
        </>
      );

      const pos = getPosition(acc.layoutOffset, horizontal, nilPos);
      drawOneRect(
        node,
        fileUuid,
        {
          type: key,
          pos,
          key: `${key}-nil`,
          fixedEdge: nilFixedEdge,
          activeEdge,
          color: transformColor.get(key) ?? 'yellow',
          horizontal,
          opacity: NIL_OPACITY,
          backgroundType: 'grid',
          x0: datum.x0,
          y0: datum.y0,
          centerElement: lines > 0 ? centerElement : undefined,
        },
        onRectClick(lineRanges),
      );
      acc.layoutOffset += activeEdge;
      acc.offset += lines;
      return acc;
    },
    { offset: 0, layoutOffset: 0 },
  );
}

// function getValueOfHistoryDetail<T>(
//   historyDetail: ITreeItemDetail[] | ITreeItemDetail | undefined,
//   idx: number,
//   key: keyof ITreeItemDetail,
//   fallback: T,
// ): T {
//   if (historyDetail === undefined) return fallback;
//   else {
//     const detail = Array.isArray(historyDetail)
//       ? historyDetail[idx]
//       : historyDetail;
//     return ((detail[key] as unknown) as T) ?? fallback;
//   }
// }

export const drawTreemap = (
  treemap: d3.Selection<any, unknown, any, any>,
  // fileEvoluationMap: Map<string, ITreeItemDetail>,
  props: ChartProps,
  // pluginRefs: React.MutableRefObject<PluginRefProps | null>[],
  // onDetailClickGetExtra?: DetailClickFunction,
) => {
  const { layout } = props;

  // 初始化画布
  // const rectUID = UID('rect');
  // 获取 有值有元素的 部分 update
  const update = treemap.selectAll('g[class="node-g*"]').data(layout);
  // 获取 有值无元素的 部分 enter
  const enter = update.enter();
  // 获取 无值有元素的 部分 exit
  const exit = update.exit();

  appendTreeItemNode(enter);
  updateTreeItemNode(update);
  removeTreeItemNode(exit);

  function appendTreeItemNode(
    enter: d3.Selection<
      any,
      d3.HierarchyRectangularNode<ITreeMapItem>,
      any,
      unknown
    >,
  ) {
    const node = enter
      .append('g')
      .attr('class', (d) => generateUnifyClassByFileUuid(d.data.fileUuid))
      .attr('transform', (d) => `translate(${d.x0},${d.y0})`);
    node
      .append('rect')
      .attr('class', 'node')
      // .attr('id', (d: any) => (d.rectUid = rectUID()).id)
      .attr('strokeWidth', 1)
      .attr('stroke', (d) =>
        Array.isArray(d.children) ? LINE_DIR_COLOR : 'white',
      )
      .attr('fill', NIL_COLOR)
      // .attr('stroke', (d) =>
      //   Array.isArray(d.children)
      //     ? LINE_DIR_COLOR
      //     : hasFileChange(fileEvoluationMap.get(d.data.fileUuid ?? ''))
      //     ? LINE_CHANGE_COLOR
      //     : 'white',
      // )
      // .attr(
      //   'fill',
      //   (d) =>
      //     fileEvoluationMap.get(d.data.fileUuid ?? '')?.heatColor ?? NIL_COLOR,
      // )
      .attr('width', (d) => d.x1 - d.x0)
      .attr('height', (d) => d.y1 - d.y0);

    node
      .append('g')
      .attr('class', 'evoluation')
      .attr('transform', `translate(${FILE_MARGIN},${FILE_MARGIN})`);
    // .on('mousemove', onMouseMove)
    // drawFileDetail(node, fileEvoluationMap, pluginRefs, onDetailClickGetExtra);

    // node
    //   .append('foreignObject')
    //   .attr('width', (d) => d.x1 - d.x0)
    //   .attr('height', () => (paddingTop ?? 0) + MARGIN)
    //   .attr('style', 'pointer-events: none;')
    //   .on('mousemove', onMouseMove);
    // node
    //   .select('foreignObject')
    //   .selectAll('p')
    //   .data((d: any) => {
    //     if (d.data.historyDetail === undefined) {
    //       return [
    //         {
    //           text: '',
    //           type: 'line-num',
    //         },
    //       ];
    //     }
    //     const value = fileEvoluationMap.get(d.data.fileUuid ?? '')?.value ?? 0;
    //     return [
    //       {
    //         text: value > 0 ? format(value) : '',
    //         type: 'line-num',
    //       },
    //     ];
    //   })
    //   .join('xhtml:p')
    //   .attr('class', (d) => d.type)
    //   .attr(
    //     'style',
    //     () =>
    //       `display: inline-block; line-height: ${fontSize}px; margin: ${MARGIN}px 0 0  ${
    //         (MARGIN * 2) / 3
    //       }px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`,
    //   )
    //   .text((d) => d.text);
  }

  function updateTreeItemNode(
    update: d3.Selection<
      d3.BaseType,
      d3.HierarchyRectangularNode<ITreeMapItem>,
      d3.BaseType,
      unknown
    >,
  ) {
    // update.select('foreignObject').on('mousemove', onMouseMove);
    // update
    //   .select('g.file-historyDetail')
    //   .attr('id', (d) => generateIdByFileUuid(d.data.fileUuid));
    // update
    //   .select('g.file-historyDetail')
    //   .filter("[id='']")
    //   .selectChildren()
    //   .remove();
    // update.select('g.file-historyDetail').on('mousemove', onMouseMove);
    // drawFileDetail(
    //   update,
    //   fileEvoluationMap,
    //   pluginRefs,
    //   onDetailClickGetExtra,
    // );
    update
      .transition()
      .duration(0)
      .delay(ANIMATION_TIME)
      .attr('transform', (d) => `translate(${d.x0},${d.y0})`)
      .call(
        (node) =>
          node
            .select('rect.node')
            .attr('width', (d) => d.x1 - d.x0)
            .attr('height', (d) => d.y1 - d.y0)
            .transition()
            .duration(ANIMATION_TIME)
            .attr('stroke', (d) =>
              Array.isArray(d.children) ? LINE_DIR_COLOR : 'white',
            ),
        // .attr('stroke', (d) =>
        //   Array.isArray(d.children)
        //     ? LINE_DIR_COLOR
        //     : hasFileChange(fileEvoluationMap.get(d.data.fileUuid ?? ''))
        //     ? LINE_CHANGE_COLOR
        //     : 'white',
        // )
        // .attr(
        //   'fill',
        //   (d) =>
        //     fileEvoluationMap.get(d.data.fileUuid ?? '')?.heatColor ??
        //     NIL_COLOR,
        // ),
      );
    // update
    //   .select('foreignObject')
    //   .transition()
    //   .duration(ANIMATION_TIME)
    //   .delay(ANIMATION_TIME)
    //   .attr('width', (d) => d.x1 - d.x0);
    // // 数字跳跃
    // update
    //   .select('foreignObject p.line-num')
    //   .transition()
    //   .duration((d) =>
    //     hasFileChange(fileEvoluationMap.get(d.data.fileUuid ?? ''))
    //       ? ANIMATION_TIME
    //       : 0,
    //   )
    //   .delay(ANIMATION_TIME)
    //   .tween('text', function (d) {
    //     const self = this as Element;
    //     const v = fileEvoluationMap.get(d.data.fileUuid ?? '')?.value ?? '';
    //     if (v === '') {
    //       return () => {
    //         self.textContent = '';
    //       };
    //     }
    //     const isMinus = self.textContent?.includes('−');
    //     // @ts-ignore
    //     const beforeStr = self.textContent.replace(/[−,]/g, '');
    //     const before = isMinus ? -1 * +beforeStr : +beforeStr;
    //     const next = fileEvoluationMap.get(d.data.fileUuid ?? '')?.value ?? 0;
    //     if (before === next) {
    //       return () => {
    //         self.textContent = format(next);
    //       };
    //     }
    //     const i = d3.interpolateNumber(before, next);

    //     return (t) => {
    //       self.textContent = format(i(t));
    //     };
    //   });
  }

  function removeTreeItemNode(
    exit: d3.Selection<d3.BaseType, unknown, d3.BaseType, unknown>,
  ) {
    exit.remove();
  }
};

export function drawStatisticDashboard(
  dashboard: d3.Selection<d3.BaseType, unknown, HTMLElement, any>,
  data: { name: string; value: number }[],
) {
  const SIZE = [16, 24];
  const TEXT_MARGIN = 12;
  // .on(
  //   'mousemove',
  //   throttle(() => {
  //     const tooltip = d3.select('div.itw-d3-tooltip');
  //     tooltip.style('visibility', 'hidden');
  //   }, 100),
  // );
  // 获取 有值有元素的 部分 update
  const update = dashboard.selectAll('g').data(data);
  // 获取 有值无元素的 部分 enter
  const enter = update.enter();
  // 获取 无值有元素的 部分 exit
  const exit = update.exit();

  // 添加元素
  const textGroup = enter.append('g').attr('transform', (_, i) => {
    const gap = i * (SIZE[0] + SIZE[1] + TEXT_MARGIN * 2) + SIZE[0];
    return `translate(0, ${gap})`;
  });
  textGroup
    .append('text')
    .attr('font-size', SIZE[0])
    .attr('x', 3)
    .attr('y', 0)
    .attr('fill', '#333333')
    .text((d) => `项目${transformLabel.get(d.name)}代码行`);
  textGroup
    .append('text')
    .attr('font-size', SIZE[1])
    .attr('font-family', 'Georgia')
    .attr('x', 6)
    .attr('y', SIZE[0] + TEXT_MARGIN)
    .attr('fill', (d) => transformColor.get(d.name) ?? '#333333')
    .text((d) => format(d.value));
  // 更新元素
  update
    .transition()
    .duration(ANIMATION_TIME)
    .delay(ANIMATION_TIME)
    .select('text:last-child')
    .tween('text', function (d) {
      const self = this as Element;
      const i = d3.interpolateNumber(
        // @ts-ignore
        +self.textContent.replace(/,/g, ''),
        d.value ?? 0,
      );

      return (t) => {
        self.textContent = format(i(t));
      };
    });
  // 删除元素
  exit.remove();
}

export function drawLegend(legend: d3.Selection<any, unknown, any, any>) {
  const FONT_SIZE = 14;
  const ROW_HEIGHT = 20;
  const LEBAL_LEFT = 30;
  const MARGIN = 7;
  // .on(
  //   'mousemove',
  //   throttle(() => {
  //     const tooltip = d3.select('div.itw-d3-tooltip');
  //     tooltip.style('visibility', 'hidden');
  //   }, 100),
  // );
  legend.selectAll('g').remove();
  legend
    .append('g')
    .append('text')
    .attr('x', MARGIN)
    .attr('y', FONT_SIZE)
    .attr('font-size', FONT_SIZE)
    .text('图例');
  const legendData = [
    {
      rect: {
        stroke: LINE_DIR_COLOR,
        rx: 0,
        ry: 0,
        width: ROW_HEIGHT,
        height: ROW_HEIGHT,
        fill: '#ffffff',
      },
      text: '文件/模块/库/项目',
    },
    {
      rect: {
        stroke: LINE_CHANGE_COLOR,
        rx: 0,
        ry: 0,
        width: ROW_HEIGHT,
        height: ROW_HEIGHT,
        fill: '#ffffff',
      },
      text: '本次修改文件',
    },
    {
      rect: {
        fill: transformColor.get('create'),
        width: 30,
        height: 10,
      },
      text: '最新版本有的本次新增代码',
    },
    {
      rect: {
        fill: getPatternUrlByType('create'),
        opacity: NIL_OPACITY,
        width: 30,
        height: 10,
      },
      text: '最新版本没有的本次新增代码',
    },
    {
      rect: {
        fill: transformColor.get('modify'),
        width: 30,
        height: 10,
      },
      text: '最新版本有的本次修改代码',
    },
    {
      rect: {
        fill: getPatternUrlByType('modify'),
        opacity: NIL_OPACITY,
        width: 30,
        height: 10,
      },
      text: '最新版本没有的本次修改代码',
    },
    {
      rect: {
        fill: transformColor.get('normal'),
        width: 30,
        height: 10,
      },
      text: '最新版本有的本次不变代码',
    },
    {
      rect: {
        fill: getPatternUrlByType('normal'),
        opacity: NIL_OPACITY,
        width: 30,
        height: 10,
      },
      text: '最新版本没有的本次不变代码',
    },
    // {
    //   rect: {
    //     fill: transformColor.get('remove'),
    //     width: 30,
    //     height: 10,
    //   },
    //   text: '最新版本留存的本次删除代码',
    // },
    {
      rect: {
        fill: getPatternUrlByType('remove'),
        opacity: NIL_OPACITY,
        width: 30,
        height: 10,
      },
      text: '最新版本没有的本次删除代码',
    },
    {
      rect: {
        fill: transformColor.get('hidden'),
        width: 30,
        height: 10,
      },
      text: '未来新增代码（最新版本有，当前没有）',
    },
    {
      rect: {
        fill: getPatternUrlByType('hidden'),
        opacity: NIL_OPACITY,
        width: 30,
        height: 10,
      },
      text: '历史删除代码（最新版本和当前都没有）',
    },
  ];
  legendData.forEach(({ rect, text }, index) => {
    const g = legend
      .append('g')
      .attr(
        'transform',
        `translate(${1.5 * MARGIN},${
          index * (MARGIN + ROW_HEIGHT) + MARGIN + ROW_HEIGHT
        })`,
      );
    g.append('rect')
      .attr(
        'transform',
        `translate(0, ${(ROW_HEIGHT - (rect.height ?? 10)) / 2})`,
      )
      .attr('strokeWidth', 1)
      .attr('stroke', rect.stroke ?? 'none')
      .attr('rx', rect.rx ?? 0)
      .attr('ry', rect.ry ?? 0)
      .attr('width', rect.width ?? 10)
      .attr('height', rect.height ?? 10)
      .attr('fill', rect.fill ?? 'white')
      .attr('fillOpacity', rect.opacity ?? 1);
    g.append('text')
      .attr('x', MARGIN + LEBAL_LEFT)
      .attr('y', FONT_SIZE)
      .attr('font-size', FONT_SIZE - 2)
      .text(text);
  });
}
