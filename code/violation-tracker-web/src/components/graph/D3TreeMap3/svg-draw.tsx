import { COLORLIST } from '@/color';
import { throttle } from '@/utils';
import { str2number } from '@/utils/conversion';
import { LineRange } from '@/utils/line-range';
import { Avatar } from 'antd';
import * as d3 from 'd3';
import ReactDOM from 'react-dom';
import { FileDetailClickData, ITreeItemDetail, ITreeMapItem } from '.';
import {
  deltaFunction,
  format,
  generateIdByFileUuid,
  hasFileChange,
  UID,
} from './d3-utils';
import { robustNormalization } from './normalizition-utils';
import { PluginRefProps } from './plugin/BasePlugin';
import { middleSort } from './sort-utils';

export function withGridBackground(
  g: d3.Selection<d3.BaseType, any, any, unknown>,
  type: string,
  strokeColor: string = '#333',
) {
  const id = getGridIdByType(type);
  const rectSide = 3;
  const pattern = g
    .append('defs')
    .append('pattern')
    .attr('id', id)
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('width', rectSide)
    .attr('height', rectSide)
    .attr('patternTransform', 'rotate(45)');
  pattern
    .append('line')
    .attr('stroke', strokeColor)
    // .attr('stroke-width', 2)
    .attr('x1', rectSide / 2)
    .attr('y1', '0')
    .attr('x2', rectSide / 2)
    .attr('y2', rectSide);
  pattern
    .append('line')
    .attr('stroke', strokeColor)
    // .attr('stroke-width', 2)
    .attr('x1', '0')
    .attr('y1', rectSide / 2)
    .attr('x2', rectSide)
    .attr('y2', rectSide / 2);
  return g;
}

export function getGridIdByType(type: string) {
  return type + '-grid';
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
  ID: string;
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

export function drawOneRect(
  g: d3.Selection<
    d3.BaseType,
    d3.HierarchyRectangularNode<ITreeMapItem>,
    any,
    unknown
  >,
  data: {
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
  },
  onClick: (e: MouseEvent) => void,
) {
  const {
    type,
    pos,
    key,
    fixedEdge,
    activeEdge,
    color,
    horizontal,
    opacity = 1,
    backgroundType = 'solid',
    x0,
    y0,
    centerElement = <></>,
  } = data;
  const unify = `[id='${g.attr('id')}'] g.${key}`;
  let activeAttr = horizontal ? 'width' : 'height';
  let fixedAttr = horizontal ? 'height' : 'width';
  let delay = ANIMATION_TIME;
  if (document.querySelector(unify)) {
    // update
    // 收回活动边原来的长度
    // g.selectAll(`${unify} rect`)
    //   .transition()
    //   .duration(ANIMATION_TIME)
    //   .attr(activeAttr, 0);
  } else {
    // create
    const group = g
      .append('g')
      .attr('class', key)
      .attr('transform', () => {
        return `translate(${pos.x},${pos.y})`;
      });
    group
      .append('rect')
      .attr(
        'fill',
        backgroundType === 'grid' ? `url(#${getGridIdByType(type)})` : color,
      )
      .attr('x', 0)
      .attr('y', 0)
      .attr('fill-opacity', opacity);
  }
  // 添加中央元素
  const pluginMask = d3.select(`div#${PLUGIN_MASK_ID}`);
  const centerElementClassName = 'center-element';
  const centerElementId = `center_${key}_${g.attr('id')}`;
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
          x: x0 + pos.x + ((horizontal ? activeEdge : fixedEdge) - wWidth) / 2,
          y: y0 + pos.y + ((horizontal ? fixedEdge : activeEdge) - wHeight) / 2,
        };
      }
      const centerPos = calcCenterPos();
      wrapper.attr(
        'style',
        `position: absolute; left: ${centerPos.x}px; top: ${centerPos.y}px`,
      );
    },
  );

  g.select(unify).on('click', onClick);
  g.select(unify)
    .transition()
    .duration(0)
    .delay(delay)
    .attr('transform', () => {
      return `translate(${pos.x},${pos.y})`;
    });
  // 设置活动边
  g.select(`${unify} rect`)
    .transition()
    .duration(0)
    .delay(delay)
    .attr(activeAttr, activeEdge);
  // 设置固定边
  g.select(`${unify} rect`)
    .transition()
    .duration(ANIMATION_TIME)
    .delay(delay)
    .attr(fixedAttr, fixedEdge);
}
export function drawFileDetail(
  node: d3.Selection<
    any,
    d3.HierarchyRectangularNode<ITreeMapItem>,
    any,
    unknown
  >,
  fileEvoluationMap: Map<string, ITreeItemDetail>,
  pluginRefs: React.MutableRefObject<PluginRefProps | null>[],
  onClickGetExtraMap?: DetailClickFunction,
) {
  const data = node.data();
  data.forEach((datum: d3.HierarchyRectangularNode<ITreeMapItem>) => {
    if (datum.data.fileUuid === undefined) return;
    const detail = fileEvoluationMap.get(datum.data.fileUuid);
    if (
      datum.data.fileUuid === undefined ||
      detail === undefined ||
      detail.value === undefined
    ) {
      return;
    }
    const group = node.select(
      `[id='${generateIdByFileUuid(datum.data.fileUuid)}']`,
    );
    let width = Math.max(datum.x1 - datum.x0 - FILE_MARGIN * 2, 0);
    let height = Math.max(datum.y1 - datum.y0 - FILE_MARGIN * 2, 0);
    const horizontal: boolean = width > height;
    const long = horizontal ? width : height;
    const short = horizontal ? height : width;
    // const historyLines = datum.data.historyLines ?? 0;
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
      // console.log(map);
    };

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
        const centerElement = (
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
          group,
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
        const centerElement = (
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
          group,
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
  });
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
  svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>,
  fileEvoluationMap: Map<string, ITreeItemDetail>,
  props: ChartProps,
  pluginRefs: React.MutableRefObject<PluginRefProps | null>[],
  onDetailClickGetExtra?: DetailClickFunction,
) => {
  const { layout, ID, paddingTop, maxWidth, fontSize } = props;
  // 更新画布
  if (!document.getElementById(ID)) {
    svg.append('g').attr('id', ID);
  }

  // 初始化画布
  const rectUID = UID('rect');
  // 获取 有值有元素的 部分 update
  const update = d3.select(`#${ID}`).selectAll('g.node-group').data(layout);
  // 获取 有值无元素的 部分 enter
  const enter = update.enter();
  // 获取 无值有元素的 部分 exit
  const exit = update.exit();

  const onMouseMove = throttle(
    (e: MouseEvent, datum: d3.HierarchyRectangularNode<ITreeMapItem>) => {
      const tooltip = d3.select('div.itw-d3-tooltip');
      tooltip.style('visibility', 'hidden');
      if (datum.data.fileUuid === undefined) {
        return;
      }
      const evoluation = fileEvoluationMap.get(datum.data.fileUuid);

      if (evoluation === undefined) return;

      const UNIFY = `idx_${datum.data.key}`;
      if (tooltip.select('div.itw-d3-tooltip-title').attr('id') !== UNIFY) {
        const detail = evoluation;
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
      const isTop = event.layerY > height;
      const isLeft = maxWidth - event.layerX > width;
      tooltip
        .style('left', `${event.layerX - (!isLeft ? width + 12 : -12)}px`)
        .style('top', `${event.layerY - (isTop ? height + 8 : -8)}px`)
        .style('visibility', 'visible');
    },
    30,
  );

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
    // console.log('-> appendTreeItemNode');
    const node = enter
      .append('g')
      .attr('class', 'node-group')
      .attr('transform', (d) => `translate(${d.x0},${d.y0})`);
    node
      .append('rect')
      .attr('class', 'node')
      .attr('id', (d: any) => (d.rectUid = rectUID()).id)
      .attr('stroke', (d) =>
        Array.isArray(d.children)
          ? LINE_DIR_COLOR
          : hasFileChange(fileEvoluationMap.get(d.data.fileUuid ?? ''))
          ? LINE_CHANGE_COLOR
          : 'white',
      )
      .attr(
        'fill',
        (d) =>
          fileEvoluationMap.get(d.data.fileUuid ?? '')?.heatColor ?? NIL_COLOR,
      )
      // .attr('rx', 4)
      // .attr('ry', 4)
      .attr('width', (d) => d.x1 - d.x0)
      .attr('height', (d) => d.y1 - d.y0);

    node
      .append('g')
      .attr('class', 'file-historyDetail')
      .attr('id', (d) => generateIdByFileUuid(d.data.fileUuid))
      .attr('transform', `translate(${FILE_MARGIN},${FILE_MARGIN})`)
      .on('mousemove', onMouseMove);
    // drawFileDetail(node, fileEvoluationMap, pluginRefs, onDetailClickGetExtra);

    node
      .append('foreignObject')
      .attr('width', (d) => d.x1 - d.x0)
      .attr('height', () => (paddingTop ?? 0) + MARGIN)
      .attr('style', 'pointer-events: none;')
      .on('mousemove', onMouseMove);
    node
      .select('foreignObject')
      .selectAll('p')
      .data((d: any) => {
        if (d.data.historyDetail === undefined) {
          return [
            {
              text: '',
              type: 'line-num',
            },
          ];
        }
        const value = fileEvoluationMap.get(d.data.fileUuid ?? '')?.value ?? 0;
        return [
          {
            text: value > 0 ? format(value) : '',
            type: 'line-num',
          },
        ];
      })
      .join('xhtml:p')
      .attr('class', (d) => d.type)
      .attr(
        'style',
        () =>
          `display: inline-block; line-height: ${fontSize}px; margin: ${MARGIN}px 0 0  ${
            (MARGIN * 2) / 3
          }px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`,
      )
      .text((d) => d.text);
  }

  function updateTreeItemNode(
    update: d3.Selection<
      d3.BaseType,
      d3.HierarchyRectangularNode<ITreeMapItem>,
      d3.BaseType,
      unknown
    >,
  ) {
    // console.log('-> updateTreeItemNode');
    update.select('foreignObject').on('mousemove', onMouseMove);
    update
      .select('g.file-historyDetail')
      .attr('id', (d) => generateIdByFileUuid(d.data.fileUuid));
    update
      .select('g.file-historyDetail')
      .filter("[id='']")
      .selectChildren()
      .remove();
    update.select('g.file-historyDetail').on('mousemove', onMouseMove);
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
      .call((node) =>
        node
          .select('rect.node')
          .attr('width', (d) => d.x1 - d.x0)
          .attr('height', (d) => d.y1 - d.y0)
          .transition()
          .duration(ANIMATION_TIME)
          .attr('stroke', (d) =>
            Array.isArray(d.children)
              ? LINE_DIR_COLOR
              : hasFileChange(fileEvoluationMap.get(d.data.fileUuid ?? ''))
              ? LINE_CHANGE_COLOR
              : 'white',
          )
          .attr(
            'fill',
            (d) =>
              fileEvoluationMap.get(d.data.fileUuid ?? '')?.heatColor ??
              NIL_COLOR,
          ),
      );
    update
      .select('foreignObject')
      .transition()
      .duration(ANIMATION_TIME)
      .delay(ANIMATION_TIME)
      .attr('width', (d) => d.x1 - d.x0);
    // 数字跳跃
    update
      .select('foreignObject p.line-num')
      .transition()
      .duration((d) =>
        hasFileChange(fileEvoluationMap.get(d.data.fileUuid ?? ''))
          ? ANIMATION_TIME
          : 0,
      )
      .delay(ANIMATION_TIME)
      .tween('text', function (d) {
        const self = this as Element;
        const v = fileEvoluationMap.get(d.data.fileUuid ?? '')?.value ?? '';
        if (v === '') {
          return () => {
            self.textContent = '';
          };
        }
        const isMinus = self.textContent?.includes('−');
        // @ts-ignore
        const beforeStr = self.textContent.replace(/[−,]/g, '');
        const before = isMinus ? -1 * +beforeStr : +beforeStr;
        const next = fileEvoluationMap.get(d.data.fileUuid ?? '')?.value ?? 0;
        if (before === next) {
          return () => {
            self.textContent = format(next);
          };
        }
        const i = d3.interpolateNumber(before, next);

        return (t) => {
          self.textContent = format(i(t));
        };
      });
  }

  function removeTreeItemNode(
    exit: d3.Selection<d3.BaseType, unknown, d3.BaseType, unknown>,
  ) {
    // console.log('-> removeTreeItemNode');
    exit.remove();
  }
};

export function drawStatisticDashboard(
  svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>,
  id: string,
  data: { name: string; value: number }[],
  pos: { x: number; y: number },
) {
  const SIZE = [16, 24];
  const TEXT_MARGIN = 12;
  // 更新画布
  if (document.getElementById(id)) {
    return update(d3.select(`#${id}`), data);
  }
  const group = svg
    .append('g')
    .attr('id', id)
    .attr('transform', () => `translate(${pos.x},${pos.y})`)
    .on(
      'mousemove',
      throttle(() => {
        const tooltip = d3.select('div.itw-d3-tooltip');
        tooltip.style('visibility', 'hidden');
      }, 100),
    );
  const enter = group.selectAll('g').data(data).enter();
  const text = enter
    .append('g')
    .attr('transform', (_, i) => {
      const gap = i * (SIZE[0] + SIZE[1] + TEXT_MARGIN * 2) + SIZE[0];
      return `translate(0, ${gap})`;
    })
    .append('text');
  // .attr('font-family', 'serif');
  text
    .append('tspan')
    .attr('font-size', SIZE[0])
    .attr('x', 3)
    .attr('y', 0)
    .attr('fill', '#333333')
    .text((d) => `项目${transformLabel.get(d.name)}代码行`);
  text
    .append('tspan')
    .attr('font-size', SIZE[1])
    .attr('font-family', 'Georgia')
    .attr('x', 6)
    .attr('y', SIZE[0] + TEXT_MARGIN)
    .attr('fill', (d) => transformColor.get(d.name) ?? '#333333')
    .text((d) => format(d.value));
  function update(
    g: d3.Selection<d3.BaseType, unknown, HTMLElement, any>,
    data: { name: string; value: number }[],
  ) {
    g.selectAll('g')
      .data(data)
      .transition()
      .duration(ANIMATION_TIME)
      .delay(ANIMATION_TIME)
      .select('text tspan:last-child')
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
  }
}

export function drawLegend(
  svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>,
  id: string,
  pos: { x: number; y: number },
) {
  const FONT_SIZE = 14;
  const ROW_HEIGHT = 20;
  const LEBAL_LEFT = 30;
  const MARGIN = 7;
  const group = svg
    .append('g')
    .attr('id', id)
    .attr('transform', () => `translate(${pos.x},${pos.y})`)
    .on(
      'mousemove',
      throttle(() => {
        const tooltip = d3.select('div.itw-d3-tooltip');
        tooltip.style('visibility', 'hidden');
      }, 100),
    );
  group
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
        fill: `url(#${getGridIdByType('create')}`,
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
        fill: `url(#${getGridIdByType('modify')}`,
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
        fill: `url(#${getGridIdByType('normal')}`,
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
        fill: `url(#${getGridIdByType('remove')}`,
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
        fill: `url(#${getGridIdByType('hidden')}`,
        opacity: NIL_OPACITY,
        width: 30,
        height: 10,
      },
      text: '历史删除代码（最新版本和当前都没有）',
    },
  ];
  legendData.forEach(({ rect, text }, index) => {
    const g = group
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
      .attr('stroke', rect.stroke ?? 'none')
      .attr('rx', rect.rx ?? 0)
      .attr('ry', rect.ry ?? 0)
      .attr('width', rect.width ?? 10)
      .attr('height', rect.height ?? 10)
      .attr('fill', rect.fill ?? 'none')
      .attr('fill-opacity', rect.opacity ?? 'none');
    g.append('text')
      .attr('x', MARGIN + LEBAL_LEFT)
      .attr('y', FONT_SIZE)
      .attr('font-size', FONT_SIZE - 2)
      .text(text);
  });
  return group;
}
