import { useEffect, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import * as d3 from 'd3';
import { getAllItemNum, getTextLevel, transform2XY } from './d3-utils';
import { Card } from 'antd';
import { throttle } from '@/utils';
import '../d3.less';

export interface IDeveloperRadarItem {
  name: string;
  type?: 'good' | 'bad';
  level?: number;
  children?: IDeveloperRadarItem[];
}

interface IProps {
  width?: number;
  height?: number;
  name: string;
  data: IDeveloperRadarItem[];
}

const translateType2Color = new Map([
  ['good', 'green'],
  ['bad', 'red'],
]);
const textSize = 15;
const margin = 30;
const textRadius = 30;
const pointColor = '#5900bb';

function drawLine(
  lineGroup: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
  line: any,
  color?: string,
) {
  return lineGroup
    .datum(line)
    .append('line')
    .attr('x1', (l) => l.source.x)
    .attr('y1', (l) => l.source.y)
    .attr('x2', (l) => l.target.x)
    .attr('y2', (l) => l.target.y)
    .attr('stroke', color ?? '#e4e4e4');
}

function drawLabel(
  textGroup: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
  textPath: d3.DefaultArcObject,
  text: string,
) {
  const firstArc = textGroup
    .append('path')
    .datum(textPath)
    .attr('d', d3.arc())
    .attr('fill', 'none');
  /**
   * 设置弧度居中
   */
  // (denoted by ^) and the first capital letter L
  const firstArcSection = /(^.+?)L/;

  // The [1] gives back the expression between the () (thus not the L as well)
  // which is exactly the arc statement
  var newArc = (firstArcSection.exec(firstArc.attr('d')) ?? [])[1];
  // Replace all the comma's so that IE can handle it -_-
  // The g after the / is a modifier that "find all matches rather than
  // stopping after the first match"
  newArc = newArc.replace(/,/g, ' ');
  /**
   * 设置底部文字翻转
   */
  const middleAngle =
    ((textPath.endAngle + textPath.startAngle) / 2) % (2 * Math.PI);

  if (Math.cos(middleAngle) < -0.00001) {
    // Everything between the capital M and first capital A
    const startLoc = /M(.*?)A/;
    // Everything between the capital A and 0 0 1
    const middleLoc = /A(.*?)0 0 1/;
    // Everything between the 0 0 1 and the end of the string (denoted by $)
    const endLoc = /0 0 1 (.*?)$/;
    // Flip the direction of the arc by switching the start and end point
    // and using a 0 (instead of 1) sweep flag
    var newStart = (endLoc.exec(newArc) ?? [])[1];
    var newEnd = (startLoc.exec(newArc) ?? [])[1];
    var middleSec = (middleLoc.exec(newArc) ?? [])[1];

    // Build up the new arc notation, set the sweep-flag to 0
    newArc = 'M' + newStart + 'A' + middleSec + '0 0 0 ' + newEnd;
  }
  // Create a new invisible arc that the text can flow along
  textGroup
    .append('path')
    .attr('class', 'hiddenDonutArcs')
    .attr('id', `text-name-${text}`)
    .attr('d', newArc)
    .style('fill', 'none');
  // remove
  firstArc.remove();

  const verticleOffset = (textPath.outerRadius - textPath.innerRadius) / 2;

  return textGroup
    .append('text')
    .attr('dy', function () {
      return Math.cos(middleAngle) < -0.00001
        ? textSize / 2 - 2 - verticleOffset
        : textSize / 2 - 2 + verticleOffset;
    }) // 设置垂直居中
    .append('textPath')
    .attr('xlink:href', `#text-name-${text}`)
    .attr('font-size', textSize)
    .attr('font-family', 'serif')
    .style('text-anchor', 'middle')
    .attr('startOffset', '50%')
    .attr('letter-spacing', '2')
    .text(text);
}

function drawArc(
  arcGroup: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
  arc: any,
  level: number,
) {
  return arcGroup
    .datum(arc)
    .insert('path')
    .attr('d', d3.arc())
    .attr('class', `arc`)
    .attr('fill', (d) => d.fill)
    .attr('fill-opacity', level >= 5 ? '0.45' : level >= 2 ? '0.3' : '0.15');
}

function drawPointArea(
  pointAreaGroup: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
  points: { name: string; x: number; y: number }[],
) {
  const linesPoints = points.reduce((str, { x, y }) => str + ` ${x},${y}`, '');
  pointAreaGroup
    .append('polygon')
    .attr('points', linesPoints)
    .attr('stroke', pointColor)
    .attr('stroke-width', 2)
    .attr('fill', `${pointColor}33`);
  pointAreaGroup
    .selectAll('.point')
    .data(points)
    .enter()
    .append('circle')
    .attr('class', (d) => `point p-${d.name}`)
    .attr('cx', (d) => d.x)
    .attr('cy', (d) => d.y)
    .attr('r', 4)
    .attr('fill', '#fff')
    .attr('stroke', pointColor);
}

const D3DeveloperRadar: React.FC<IProps> = ({ width, height, name, data }) => {
  const uuid = useRef<string>('');
  uuid.current = useMemo(() => uuidv4(), []);
  const svgWidth = useMemo(() => width ?? 500, [width]);
  const svgHeight = useMemo(() => height ?? 500, [height]);
  const textLevel = useMemo(() => getTextLevel(data), [data]);
  const LEVEL_SCALE = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain([0, 5])
        .range([0, svgWidth / 2 - margin - textLevel * textRadius]),
    [svgWidth, textLevel],
  );
  const ARC_SCALE = useMemo(() => {
    const partNum = getAllItemNum(data);
    return d3
      .scaleLinear()
      .domain([0, partNum])
      .range([0, 2 * Math.PI]);
  }, [data]);

  useEffect(() => {
    const highAndLowCircle = [
      {
        cx: 0,
        cy: 0,
        r: LEVEL_SCALE(5),
        color: 'red',
      },
      {
        cx: 0,
        cy: 0,
        r: LEVEL_SCALE(2),
        color: 'green',
      },
    ];
    const svg = d3.select(`#d3-dr-${uuid.current}`).select('svg');
    const circleGroup = svg
      .append('g')
      .attr('transform', `translate(${svgWidth / 2}, ${svgHeight / 2})`)
      .attr('class', 'circle-group');
    const circles = Array.from(Array(textLevel), (_, i) => i)
      .map((item) => ({
        cx: 0,
        cy: 0,
        r: svgWidth / 2 - margin - textRadius * item,
        color: '#e4e4e4',
      }))
      .concat(highAndLowCircle);
    circleGroup
      .selectAll('circle')
      .data(circles)
      .enter()
      .append('circle')
      .attr('cx', (d) => d.cx)
      .attr('cy', (d) => d.cy)
      .attr('r', (d) => d.r)
      .attr('fill', 'none')
      .attr('stroke', (d) => d.color);
    return () => {
      circleGroup.remove();
    };
  }, [LEVEL_SCALE, svgHeight, svgWidth, textLevel]);

  useEffect(() => {
    const svg = d3.select(`#d3-dr-${uuid.current}`).select('svg');
    const tooltip = d3
      .select(`#d3-dr-${uuid.current}`)
      .select('div.itw-d3-tooltip');
    const lineGroup = svg.append('g').attr('class', 'line-arces');
    const textGroup = svg
      .append('g')
      .attr('transform', `translate(${svgWidth / 2}, ${svgHeight / 2})`)
      .attr('class', 'text-arces');
    const arcGroup = svg
      .append('g')
      .attr('transform', `translate(${svgWidth / 2}, ${svgHeight / 2})`)
      .attr('class', 'arc-parts');
    const pointAreaGroup = svg.append('g').attr('class', 'point-area');
    const arcMaskGroup = svg
      .append('g')
      .attr('transform', `translate(${svgWidth / 2}, ${svgHeight / 2})`)
      .attr('class', 'arc-mask');

    const dataset = drawLinesAndArces(data, 0, svgWidth / 2 - margin);

    dataset.lines.forEach((line) => drawLine(lineGroup, line));
    dataset.labels.forEach((l) => drawLabel(textGroup, l, l.text));
    dataset.arces.forEach((arc) => drawArc(arcGroup, arc, arc.level));
    drawPointArea(pointAreaGroup, dataset.points);
    dataset.arces.forEach((arc) => {
      arc.fill = '#ffffff00';
      const mask = drawArc(arcMaskGroup, arc, arc.level);
      mask.on(
        'mousemove',
        throttle((e: MouseEvent, d: any) => {
          // 恢复初始状态
          initialTooltip();
          // 计算是否显示 tooltip
          const tooltipGroup = svg.append('g').attr('class', 'tooltip');
          const x = e.offsetX - svgWidth / 2;
          const y = e.offsetY - svgHeight / 2;
          const r = Math.sqrt(x * x + y * y);
          if (r > LEVEL_SCALE(5)) {
            // initialTooltip();
            return;
          }
          // 绘制辅助线
          const line = drawLine(
            tooltipGroup,
            {
              source: {
                x: svgWidth / 2,
                y: svgHeight / 2,
              },
              target: {
                x: svgWidth / 2 + (x / r) * LEVEL_SCALE(5),
                y: svgHeight / 2 + (y / r) * LEVEL_SCALE(5),
              },
            },
            '#333',
          );
          line.attr('stroke-dasharray', '4');
          tooltipGroup
            .append('circle')
            .attr('cx', svgWidth / 2)
            .attr('cy', svgHeight / 2)
            .attr('r', r)
            .attr('fill', 'none')
            .attr('stroke-dasharray', '4')
            .attr('stroke', '#333');
          // 点亮 point
          pointAreaGroup
            .select(`circle.p-${d.name}`)
            .attr('fill', pointColor)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);
          // 绘制 tooltip
          if (tooltip.select('div.itw-d3-tooltip-title').text() !== d.name) {
            tooltip.select('div.itw-d3-tooltip-title').text(d.name);
            tooltip
              .select('table.itw-d3-tooltip-list')
              .selectChildren()
              .remove();
            const tr = tooltip.select('table.itw-d3-tooltip-list').append('tr');
            tr.append('td')
              .attr('class', 'itw-d3-tooltip-mark')
              .attr(
                'style',
                `background: ${pointColor}99; width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 8px;`,
              );
            tr.append('td')
              .attr('class', 'itw-d3-tooltip-label')
              .html('分数：');
            tr.append('td').attr('class', 'itw-d3-tooltip-value').html(d.level);
          }
          const height = (tooltip.node() as HTMLElement).getBoundingClientRect()
            .height;
          tooltip
            .style('left', `${e.offsetX + 12}px`)
            .style('top', `${e.offsetY - height - 8}px`)
            .style('visibility', 'visible');
        }, 30),
      );
    });

    function drawLinesAndArces(
      data: IDeveloperRadarItem[],
      start: number,
      r: number,
    ): {
      lines: any[];
      labels: any[];
      arces: any[];
      points: any[];
      offset: number;
    } {
      return data.reduce(
        (dataset, item) => {
          const { offset } = dataset;
          const size =
            Array.isArray(item.children) && item.children.length > 0
              ? getAllItemNum(item.children)
              : 1;
          dataset.lines.push({
            source: {
              x: svgWidth / 2,
              y: svgHeight / 2,
            },
            target: transform2XY(
              [svgWidth / 2, svgHeight / 2],
              ARC_SCALE(offset + size),
              r,
            ),
          });
          dataset.labels.push({
            innerRadius: r - textRadius,
            outerRadius: r,
            startAngle: ARC_SCALE(offset),
            endAngle: ARC_SCALE(offset + size),
            text: item.name,
          } as d3.DefaultArcObject);
          if (Array.isArray(item.children) && item.children.length > 0) {
            const childDataset = drawLinesAndArces(
              item.children,
              offset,
              r - textRadius,
            );
            dataset.lines = dataset.lines.concat(childDataset.lines);
            dataset.labels = dataset.labels.concat(childDataset.labels);
            dataset.arces = dataset.arces.concat(childDataset.arces);
            dataset.points = dataset.points.concat(childDataset.points);
          } else {
            const arc = {
              innerRadius: 0,
              outerRadius: LEVEL_SCALE(5) + textRadius,
              startAngle: ARC_SCALE(offset),
              endAngle: ARC_SCALE(offset + 1),
              fill: translateType2Color.get(item.type ?? '') ?? 'white',
              name: item.name,
              level: item.level,
            };
            dataset.arces.push(arc);
            dataset.points.push({
              name: item.name,
              ...transform2XY(
                [svgWidth / 2, svgHeight / 2],
                (arc.startAngle + arc.endAngle) / 2,
                LEVEL_SCALE(item.level ?? 0),
              ),
            });
          }
          dataset.offset = offset + size;
          return dataset;
        },
        {
          lines: [] as any[],
          labels: [] as any[],
          arces: [] as any[],
          points: [] as any[],
          offset: start,
        },
      );
    }

    function initialTooltip() {
      pointAreaGroup
        .selectAll('.point')
        .attr('fill', '#fff')
        .attr('stroke-width', 1)
        .attr('stroke', pointColor);
      tooltip.style('visibility', 'hidden');
      svg.select('g.tooltip').remove();
    }

    return () => {
      arcMaskGroup.remove();
      pointAreaGroup.remove();
      arcGroup.remove();
      lineGroup.remove();
      textGroup.remove();
    };
  }, [ARC_SCALE, LEVEL_SCALE, data, svgHeight, svgWidth]);
  return (
    <Card>
      <div id={`d3-dr-${uuid.current}`} style={{ position: 'relative' }}>
        <svg
          width={svgWidth}
          height={svgHeight}
          style={{ backgroundColor: 'white' }}
        />
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
            opacity: 0.98,
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
              listStyleType: 'none',
              padding: '0px',
              margin: '10px 0px',
            }}
          />
        </div>
      </div>
      <td>{name}</td>
    </Card>
  );
};

export default D3DeveloperRadar;
