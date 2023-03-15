import React, {
  useRef,
  useLayoutEffect,
  useState,
  useEffect,
  useMemo,
} from 'react';
import * as d3 from 'd3';
import '../d3.less';

import {
  UID,
  format,
  validateDatasets,
  getLayout,
  beautifyDataset,
  hasFileChange,
  getSumData,
} from './d3-utils';
import { throttle } from '@/utils';

export interface ITreeMapItem {
  name: string;
  realValue?: number;
  value?: number;
  fileUuid?: string;
  detail?: {
    create: number[];
    remove: number[];
    modify: number[];
  };
  children?: ITreeMapItem[];
}

export type TreeMapFrameItem = {
  key: string | number;
  treemap: ITreeMapItem;
};

export type TreeMapConfig = {
  width?: number;
  height?: number;
  tileType?: string;
  // maxLayout?: boolean | undefined;
  sortTransition?: boolean;
  paddingTop?: number;
};

interface TreeMapProps {
  index?: number;
  animation?: boolean;
  data: TreeMapFrameItem[];
  configs: TreeMapConfig;
}

interface ChartProps {
  layout: () => d3.HierarchyRectangularNode<ITreeMapItem>[];
  maxWidth: number;
  // color: any;
  ID: string;
  paddingTop?: number;
}

const MARGIN = 5;
const SHORT = 8;
export const transformColor = new Map([
  // ['total', '#ac53ff'],
  ['total', '#111111'],
  ['create', 'green'],
  ['modify', 'cornflowerblue'],
  ['remove', 'red'],
]);
const transformLabel = new Map([
  ['total', '总'],
  ['create', '新增'],
  ['modify', '修改'],
  ['remove', '删除'],
]);
const LINE_BG_COLOR = '#d2a1ff';

const showDetail = (width: number, height: number) => {
  return width > 45 && height > 30;
};
const showFallback = (width: number, height: number) => {
  return width > 23 && height > 20;
};

const showFileDetail = (width: number, height: number) => {
  const horizontal = width > height;
  const min = SHORT * 3 + MARGIN * 2;
  return horizontal ? height > min : width > min;
};

const decorateText = (
  text: string | number,
  width: number,
  height: number,
  fallback?: string,
) => {
  return showDetail(width, height)
    ? text
    : showFallback(width, height)
    ? fallback ?? ''
    : '';
};

function getPosition(index: number, gap: number, horizontal: boolean) {
  const offset = gap * index;
  return {
    x: horizontal ? 0 : offset,
    y: horizontal ? offset : 0,
  };
}

const setRectFillColor = (paddingTop: number) => (
  d: d3.HierarchyRectangularNode<ITreeMapItem>,
) => {
  const width = Math.max(d.x1 - d.x0 - MARGIN * 2, 0);
  const height = Math.max(d.y1 - d.y0 - MARGIN * 2 - paddingTop, 0);
  return !showFileDetail(width, height) && hasFileChange(d.data)
    ? LINE_BG_COLOR
    : '#ffffff';
};

function drawTwoPartRect(
  g: any,
  data: {
    pos: { x: number; y: number };
    index: number;
    part1: number;
    part2: number;
    short: number;
    color: string;
    horizontal: boolean;
  },
) {
  const { pos, index, part1, part2, short, color, horizontal } = data;
  const unify = `#${g.attr('id')} g:nth-child(${index + 1})`;
  if (document.querySelector(unify)) {
    // update
    g.select(unify)
      .transition()
      .duration(1000)
      .attr('transform', () => {
        return `translate(${pos.x},${pos.y})`;
      });

    g.select(`${unify} rect:first-child`)
      .transition()
      .duration(1000)
      .attr('width', horizontal ? part1 : short)
      .attr('height', horizontal ? short : part1);

    g.select(`${unify} rect:last-child`)
      .transition()
      .duration(1000)
      .attr('x', horizontal ? part1 : 0)
      .attr('y', horizontal ? 0 : part1)
      .attr('width', horizontal ? part2 : short)
      .attr('height', horizontal ? short : part2);
    return;
  }

  // create
  const group = g.append('g').attr('transform', () => {
    return `translate(${pos.x},${pos.y})`;
  });
  group
    .append('rect')
    .attr('fill', color)
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', horizontal ? part1 : short)
    .attr('height', horizontal ? short : part1);
  group
    .append('rect')
    .attr('fill', color)
    .attr('fill-opacity', 0.5)
    .attr('x', horizontal ? part1 : 0)
    .attr('y', horizontal ? 0 : part1)
    .attr('width', horizontal ? part2 : short)
    .attr('height', horizontal ? short : part2);
}

function drawFileDetail(
  node: d3.Selection<
    any,
    d3.HierarchyRectangularNode<ITreeMapItem>,
    any,
    unknown
  >,
  paddingTop: number = 3,
) {
  const data = node.data();
  data.forEach((datum: d3.HierarchyRectangularNode<ITreeMapItem>) => {
    if (
      datum.data.realValue === undefined ||
      datum.data.fileUuid === undefined ||
      datum.data.detail === undefined
    ) {
      return;
    }
    const group = node.select(`#${datum.data.fileUuid}`);
    let width = Math.max(datum.x1 - datum.x0 - MARGIN * 2, 0);
    let height = Math.max(datum.y1 - datum.y0 - MARGIN * 2 - paddingTop, 0);
    const horizontal: boolean = width > height;
    if (!showFileDetail(width, height)) {
      width = 0;
      height = 0;
    }
    const long = horizontal ? width : height;
    const max = hasFileChange(datum.data)
      ? Math.max(
          ...Object.values(datum.data.detail).map((list) => list[0] + list[1]),
        )
      : 1;
    const scale = d3.scaleLinear().domain([0, max]).range([0, long]);

    Object.keys(datum.data.detail).forEach((key, index) => {
      const pos = getPosition(index, SHORT + MARGIN, horizontal);
      const [live, death] =
        datum.data.detail?.[key as 'create' | 'remove' | 'modify'] ?? [];
      drawTwoPartRect(group, {
        pos,
        index,
        part1: scale(live),
        part2: scale(death),
        short: SHORT,
        color: transformColor.get(key) ?? 'yellow',
        horizontal,
      });
    });
  });
}

const drawTreemap = (
  svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>,
  props: ChartProps,
  fontSize: number,
) => {
  const { layout, ID, paddingTop, maxWidth } = props;
  const setRectFillColorWithPaddingTop = setRectFillColor(paddingTop ?? 0);
  // 更新画布
  if (!document.getElementById(ID)) {
    svg.append('g').attr('id', ID);
    // return updateFunc(d3.select(`#${ID}`).selectAll('g.node-group'), layout);
  }

  // 初始化画布
  const rectUID = UID('rect');
  // const clipUID = UID('clip');
  // 获取 有值有元素的 部分 update
  const update = d3.select(`#${ID}`).selectAll('g.node-group').data(layout);
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
    const onMouseMove = throttle(
      (e: MouseEvent, datum: d3.HierarchyRectangularNode<ITreeMapItem>) => {
        const tooltip = d3.select('div.itw-d3-tooltip');
        tooltip.style('visibility', 'hidden');
        if (datum.data.detail === undefined) {
          return;
        }
        if (
          tooltip.select('div.itw-d3-tooltip-title').text() !== datum.data.name
        ) {
          tooltip.select('div.itw-d3-tooltip-title').text(datum.data.name);
          tooltip
            .select('div.itw-d3-tooltip-title')
            .append('p')
            .text(`代码行数：${datum.data.realValue}`);
          const table = tooltip.select('table.itw-d3-tooltip-list');
          table.selectChildren().remove();
          Object.keys(datum.data.detail).forEach((key, index) => {
            const color = transformColor.get(key);
            const label = transformLabel.get(key);
            const [live, death] =
              datum.data.detail?.[key as 'create' | 'remove' | 'modify'] ?? [];
            const tr = tooltip.select('table.itw-d3-tooltip-list').append('tr');
            tr.append('td')
              .attr('class', 'itw-d3-tooltip-mark')
              .attr(
                'style',
                `background: ${color}; width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 8px;`,
              );
            tr.append('td')
              .attr('class', 'itw-d3-tooltip-label')
              .html(`留存${label}：`);
            tr.append('td').attr('class', 'itw-d3-tooltip-value').text(live);
            tr.append('td')
              .attr('class', 'itw-d3-tooltip-label')
              .html(`消失${label}：`);
            tr.append('td').attr('class', 'itw-d3-tooltip-value').text(death);
          });
        }
        const height = (tooltip.node() as HTMLElement).getBoundingClientRect()
          .height;
        const width = (tooltip.node() as HTMLElement).getBoundingClientRect()
          .width;
        const event = e as any;
        // console.log(event.layerX, event.layerY);
        tooltip
          .style(
            'left',
            `${
              event.layerX + (datum.x0 > maxWidth * 0.9 ? -width - 12 : 12)
            }px`,
          )
          .style('top', `${event.layerY - height - 8}px`)
          .style('visibility', 'visible');
      },
      30,
    );

    const node = enter
      .append('g')
      .attr('class', 'node-group')
      .attr('transform', (d) => `translate(${d.x0},${d.y0})`);
    node
      .append('rect')
      .attr('class', 'node')
      .attr('id', (d: any) => (d.rectUid = rectUID()).id)
      .attr('stroke', (d) => '#33333333')
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('width', (d) => d.x1 - d.x0)
      .attr('height', (d) => d.y1 - d.y0)
      .attr('fill', setRectFillColorWithPaddingTop)
      .on('mousemove', onMouseMove);

    node
      .append('g')
      .attr('class', 'file-detail')
      .attr('id', (d) => d.data.fileUuid ?? '')
      .attr('transform', `translate(${MARGIN},${MARGIN + (paddingTop ?? 0)})`);
    drawFileDetail(node, paddingTop);

    // node
    //   .append('clipPath')
    //   .attr('id', (d: any) => (d.clipUid = clipUID()).id)
    //   .append('use')
    //   .attr('xlink:href', (d: any) => d.rectUid.href);

    node
      .append('foreignObject')
      .attr('width', (d) => d.x1 - d.x0)
      .attr('height', () => (paddingTop ?? 0) + MARGIN)
      .on('mousemove', onMouseMove);
    // .attr('clip-path', (d: any) => d.clipUid)
    node
      .select('foreignObject')
      .selectAll('p')
      .data((d: any) => [
        {
          text: decorateText(d.data.name, d.x1 - d.x0, d.y1 - d.y0, '···'),
        },
        {
          text: d.data.realValue
            ? decorateText(format(d.data.realValue), d.x1 - d.x0, d.y1 - d.y0)
            : '',
        },
      ])
      .join('xhtml:p')
      .attr(
        'style',
        (_, i) =>
          `color: black; opacity: ${
            i === 1 ? 0.7 : 1
          }; line-height: ${fontSize}px; margin: ${MARGIN / 2}px 0 0  ${
            (MARGIN * 2) / 3
          }px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`,
      )
      // .attr('x', 3)
      // .attr('y', (_, i, nodes) => {
      //   return `${fontSize + i * (fontSize * 1.2)}`;
      // })
      // .attr('fill-opacity', (d, i, nodes) => (i === nodes.length - 1 ? 0.7 : 1))
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
    update
      .transition()
      .duration(1000)
      .attr('transform', (d) => `translate(${d.x0},${d.y0})`)
      .call((node) =>
        node
          .select('rect.node')
          .attr('fill', setRectFillColorWithPaddingTop)
          .attr('width', (d) => d.x1 - d.x0)
          .attr('height', (d) => d.y1 - d.y0),
      )
      .call((node) =>
        node.select('foreignObject').attr('width', (d) => d.x1 - d.x0),
      )
      .call((node) =>
        node
          .select('foreignObject p:first-child')
          .text((d) =>
            decorateText(d.data.name, d.x1 - d.x0, d.y1 - d.y0, '···'),
          ),
      )
      .call((node) =>
        node.select('foreignObject p:last-child').tween('text', function (d) {
          const self = this as Element;
          const v = d.data.realValue
            ? decorateText(d.data.realValue, d.x1 - d.x0, d.y1 - d.y0)
            : '';
          if (v === '') {
            return () => {
              self.textContent = '';
            };
          }
          const i = d3.interpolateNumber(
            // @ts-ignore
            +self.textContent.replace(/,/g, ''),
            d.data.realValue ?? 0,
          );

          return (t) => {
            self.textContent = format(i(t));
          };
        }),
      );
    update.select('g.file-detail').attr('id', (d) => d.data.fileUuid ?? '');
    update.select('g.file-detail').filter("[id='']").selectChildren().remove();
    drawFileDetail(update, paddingTop);
  }

  function removeTreeItemNode(
    exit: d3.Selection<d3.BaseType, unknown, d3.BaseType, unknown>,
  ) {
    exit.remove();
  }
};

function drawStatisticDashboard(
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
      .duration(1000)
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

function drawLegend(
  svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>,
  id: string,
  pos: { x: number; y: number },
) {
  const FONT_SIZE = 14;
  const ROW_HEIGHT = 20;
  const LEBAL_LEFT = 40;
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
        stroke: '#33333333',
        rx: 4,
        ry: 4,
        width: ROW_HEIGHT,
        height: ROW_HEIGHT,
        fill: '#ffffff',
      },
      text: '文件/模块/库/项目',
    },
    {
      rect: {
        stroke: '#33333333',
        rx: 4,
        ry: 4,
        width: ROW_HEIGHT,
        height: ROW_HEIGHT,
        fill: LINE_BG_COLOR,
      },
      text: '本次修改文件',
    },
    {
      rect: {
        fill: transformColor.get('create'),
        width: 30,
        height: 10,
      },
      text: '留存新增代码',
    },
    {
      rect: {
        fill: transformColor.get('create'),
        opacity: 0.5,
        width: 30,
        height: 10,
      },
      text: '消失新增代码',
    },
    {
      rect: {
        fill: transformColor.get('modify'),
        width: 30,
        height: 10,
      },
      text: '留存修改代码',
    },
    {
      rect: {
        fill: transformColor.get('modify'),
        opacity: 0.5,
        width: 30,
        height: 10,
      },
      text: '消失修改代码',
    },
    {
      rect: {
        fill: transformColor.get('remove'),
        width: 30,
        height: 10,
      },
      text: '留存删除代码',
    },
    {
      rect: {
        fill: transformColor.get('remove'),
        opacity: 0.5,
        width: 30,
        height: 10,
      },
      text: '消失删除代码',
    },
  ];
  legendData.forEach(({ rect, text }, index) => {
    const g = group
      .append('g')
      .attr(
        'transform',
        `translate(${2 * MARGIN},${
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

const TreeMap: React.FC<TreeMapProps> = (props) => {
  const { index, data, animation, configs = {} } = props;
  const svgWidth = useMemo(() => configs.width ?? 500, [configs]);
  const svgHeight = useMemo(() => configs.height ?? 500, [configs]);
  const fontSize = useMemo(() => {
    return configs.paddingTop !== undefined
      ? Math.floor(configs.paddingTop / 2)
      : configs.width !== undefined
      ? Math.floor(configs.width / 400) * 5
      : 10;
  }, [configs]);
  const IDRef = useRef(UID('treemap')().id);

  // 设置当前 frame 防止 useEffect 重复渲染
  const frameRef = useRef<number>(0);
  const [frameIndex, setFrameIndex] = useState<number>(-1);
  frameRef.current = frameIndex;

  useEffect(() => {
    // null
    if (!validateDatasets(data, 0)) return;

    let st: NodeJS.Timeout;
    let localIndex = index ?? 0;
    if (animation) {
      st = setInterval(() => {
        if (frameRef.current === data.keys.length - 1) {
          return clearInterval(st);
        } else {
          frameRef.current += 1;
          setFrameIndex(frameRef.current);
        }
      }, 1500);
      localIndex = 0;
    }

    setFrameIndex(localIndex);
    return () => clearInterval(st);
  }, [index, animation, data]);

  useLayoutEffect(() => {
    if (!validateDatasets(data, frameIndex)) return;

    const treemapWidth = svgWidth - 200;
    const beauti = beautifyDataset(data[frameIndex].treemap);
    // console.log(
    //   'beauti',
    //   getValueByFileUuid(beauti, '_00709c7a-4abd-43a2-9a89-8c57cd894b58'),
    // );
    const treemapLayout = getLayout(beauti, {
      ...configs,
      width: treemapWidth,
    });
    const statisticData = getSumData(beauti);
    const svg = d3.select(`#${IDRef.current}_svg`);
    drawTreemap(
      svg,
      {
        layout: treemapLayout,
        maxWidth: svgWidth,
        ID: IDRef.current,
        paddingTop: configs.paddingTop,
      },
      fontSize,
    );
    drawStatisticDashboard(svg, `${IDRef.current}_statistic`, statisticData, {
      x: treemapWidth + MARGIN,
      y: 0,
    });
  }, [frameIndex, svgWidth, svgHeight, data, configs, fontSize]);
  useLayoutEffect(() => {
    const treemapWidth = svgWidth - 200;
    const svg = d3.select(`#${IDRef.current}_svg`);

    const legend = drawLegend(svg, `${IDRef.current}_legend`, {
      x: treemapWidth + MARGIN,
      y: 300,
    });
    return () => {
      legend.remove();
    };
  }, [svgWidth]);

  return (
    <div style={{ position: 'relative' }}>
      {/* <div style={{ display: 'flex' }}> */}
      <svg
        id={`${IDRef.current}_svg`}
        style={{
          width: svgWidth,
          height: svgHeight,
          overflow: 'hidden',
          fontSize: `${fontSize}px`,
        }}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      />
      {/* </div> */}
      <div
        className="itw-d3-tooltip"
        style={{
          position: 'absolute',
          visibility: 'hidden',
          zIndex: 8,
          transition:
            'left 0.4s cubic-bezier(0.23, 1, 0.32, 1) 0s, top 0.4s cubic-bezier(0.23, 1, 0.32, 1) 0s',
          boxShadow: 'rgb(174, 174, 174) 0px 0px 10px',
          borderRadius: '3px',
          padding: '0px 12px',
          backgroundColor: '#fff',
          fontSize: '12px',
          fontFamily: 'serif',
          opacity: 0.94,
          pointerEvents: 'none',
          left: 0,
          top: 0,
        }}
      >
        <div
          className="itw-d3-tooltip-title"
          style={{
            marginTop: '10px',
          }}
        />
        <table
          className="itw-d3-tooltip-list"
          style={{
            padding: '0px',
            margin: '10px 0px',
          }}
        />
      </div>
    </div>
  );
};

export default TreeMap;
