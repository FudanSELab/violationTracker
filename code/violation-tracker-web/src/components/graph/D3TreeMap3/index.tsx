import React, {
  useRef,
  useLayoutEffect,
  useState,
  useEffect,
  useMemo,
} from 'react';
import * as d3 from 'd3';
import { Canvas } from '@antv/g';
import { Renderer } from '@antv/g-canvas';
import { Plugin } from '@antv/g-plugin-css-select';
import Stats from 'stats.js';
import '../d3.less';
import './styles.less';

import {
  UID,
  getLayout,
  beautifyDataset,
  getTotalStatisticData,
  beautifyEvoluation,
  hasFileChange,
} from './d3-utils';
import { throttle } from '@/utils';
import {
  Row,
  Col,
  Checkbox,
  InputNumber,
  Typography,
  Slider,
  Avatar,
  Divider,
  Spin,
  message,
} from 'antd';
import { COLORLIST } from '@/color';
import { str2number } from '@/utils/conversion';
import { LineRange } from '@/utils/line-range';
import { PluginRefProps } from './plugin/BasePlugin';
import {
  ANIMATION_TIME,
  drawFileDetail,
  drawLegend,
  drawRectIsChange,
  drawStatisticDashboard,
  drawTreemap,
  generateUnifyClassByFileUuid,
  MARGIN,
  PLUGIN_MASK_ID,
} from './svg-draw-g';
import moment from 'moment';

// 创建 WebGL 渲染器
const webglRenderer = new Renderer();
webglRenderer.registerPlugin(new Plugin());

export interface ITreeItemDetail extends CP.FileEvoluationItem {
  heatColor?: string;
}

export interface ITreeMapItem {
  key: string;
  name: string;
  value?: number;
  filePath?: string;
  fileUuid?: string;
  historyLines?: number;
  lines?: Omit<CP.LineItemWithEvoluation, 'fileUuid' | 'filePath'>[];
  // historyDetail?: ITreeItemDetail[] | ITreeItemDetail;
  children?: ITreeMapItem[];
}

export type TreeMapData = {
  key: string | number;
  treemap: ITreeMapItem;
};

export type TreeMapConfig = {
  width?: number;
  height?: number;
  tileType?: string;
  sortTransition?: boolean;
  paddingTop?: number;
};

interface TreeMapProps {
  loading?: boolean;
  keyList: { id: string; extra?: any }[];
  data?: TreeMapData;
  // database?: TreeMapData;
  treeStructure?: TreeMapData;
  requestEvoluation?: (
    id: number,
  ) => Promise<Map<string, CP.FileEvoluationItem> | null>;
  configs: TreeMapConfig;
  // onDetailClickToGetMap?: DetailClickFunction;
}

export type FileDetailClickData = {
  lineRanges: LineRange[];
  fileLines: { key: string; lines: number; realLines: number }[][];
  filePath: string;
  commitId?: string;
};

// const showFileDetail = (width: number, height: number) => {
//   const horizontal = width > height;
//   const min = SHORT * 3 + MARGIN * 2;
//   return horizontal ? height > min : width > min;
// };

const DESCRIPTION_WIDTH = 265;
const TreeMap3: React.FC<TreeMapProps> = (props) => {
  const {
    loading,
    keyList,
    data,
    configs = {},
    children,
    treeStructure,
    requestEvoluation,
  } = props;
  const svg = useRef<d3.Selection<d3.BaseType, unknown, HTMLElement, any>>();
  const beforeChangedFileUuids = useRef<string[]>([]);
  const [requestLoading, setRequestLoading] = useState<boolean>(false);
  const [rendering, setRendering] = useState<boolean>(false);
  const svgWidth = useMemo(() => configs.width ?? 500, [configs]);
  const svgHeight = useMemo(() => configs.height ?? 500, [configs]);
  const fontSize = useMemo(() => {
    return configs.paddingTop !== undefined
      ? Math.floor(configs.paddingTop - MARGIN)
      : configs.width !== undefined
      ? Math.floor(configs.width / 400) * 5
      : 10;
  }, [configs]);
  const IDRef = useRef(UID('treemap')().id);

  const [animation, setAnimation] = useState(false);

  const [frameIndex, setFrameIndex] = useState<number>(0);

  const { pluginRefs, plugins } = useMemo(() => {
    const pluginRefs: React.MutableRefObject<PluginRefProps | null>[] = [];
    const plugins: React.FunctionComponentElement<any>[] = [];
    React.Children.map(children, (child, idx) => {
      if (
        child === undefined ||
        child === null ||
        typeof child === 'string' ||
        typeof child === 'number' ||
        typeof child === 'boolean'
      ) {
        // do nothing
      } else {
        const ref = React.createRef<PluginRefProps>();
        pluginRefs.push(ref);
        plugins.push(
          React.cloneElement(child as JSX.Element, { ref, key: idx }),
        );
      }
    });
    return {
      pluginRefs,
      plugins,
    };
  }, [children]);

  useEffect(() => {
    let st: NodeJS.Timeout;
    setFrameIndex(0);
    if (animation) {
      st = setInterval(() => {
        setFrameIndex((cur) => {
          if (cur + 1 >= keyList.length) {
            clearInterval(st);
            return cur;
          }
          return cur + 1;
        });
      }, 2 * ANIMATION_TIME + 500);
    }
    return () => clearInterval(st);
  }, [animation, keyList.length]);

  useEffect(() => {
    pluginRefs.forEach((ref) => {
      ref.current?.hidden();
    });
  }, [frameIndex, pluginRefs]);

  const beauti = useMemo(() => {
    if (data !== undefined) return beautifyDataset(data.treemap);
    else if (treeStructure !== undefined)
      return beautifyDataset(treeStructure.treemap);
    return undefined;
  }, [data, treeStructure]);

  const treemapLayout = useMemo(() => {
    // console.log('update treemapLayout');
    const treemapWidth = svgWidth - DESCRIPTION_WIDTH;
    if (beauti === undefined) return null;
    return getLayout(beauti, {
      ...configs,
      width: treemapWidth,
    });
  }, [beauti, configs, svgWidth]);

  useLayoutEffect(() => {
    // const svgId = `#${IDRef.current}_svg`;
    // if (document.getElementById(svgId) !== null) {
    //   d3.select(svgId).remove();
    // }
    // let wrapper = (d3
    //   .select(`#${IDRef.current}_wrapper`)
    //   .append('svg')
    //   .attr('id', svgId)
    //   .attr('width', svgWidth)
    //   .attr('height', svgHeight)
    //   .attr(
    //     'viewBox',
    //     `0 0 ${svgWidth} ${svgHeight}`,
    //   ) as unknown) as d3.Selection<d3.BaseType, unknown, HTMLElement, any>;
    const canvas = new Canvas({
      container: `${IDRef.current}_wrapper`,
      width: svgWidth,
      height: svgHeight,
      renderer: webglRenderer,
    });
    let wrapper = d3.select(canvas.document.documentElement as any);
    wrapper.on(
      'mouseleave',
      throttle(() => {
        const tooltip = d3.select('div.itw-d3-tooltip');
        tooltip.style('visibility', 'hidden');
      }, 100),
    );
    // 添加纹理
    // transformColor.forEach((color, key) => {
    //   wrapper = withGridBackground(wrapper, key, color);
    // });
    // stats
    const stats = new Stats();
    stats.showPanel(0);
    const $stats = stats.dom;
    $stats.style.position = 'absolute';
    $stats.style.left = '-80px';
    $stats.style.top = '0px';
    const $wrapper = document.getElementById(`${IDRef.current}_wrapper`);
    $wrapper?.appendChild($stats);
    canvas.on('afterrender', () => {
      if (stats) {
        stats.update();
      }
    });
    // 设置几个基础绘图部分
    const treemapWidth = svgWidth - DESCRIPTION_WIDTH;
    // 1. dashboard
    wrapper
      .append('g')
      .attr('class', `${IDRef.current}_dashboard`)
      .attr('transform', () => `translate(${treemapWidth + MARGIN},${0})`);
    // 2. legend
    const legend = wrapper
      .append('g')
      .attr('class', `${IDRef.current}_legend`)
      .attr('transform', () => `translate(${treemapWidth + MARGIN},${280})`);
    // 3. treemap
    const treemap = wrapper.append('g').attr('class', IDRef.current);
    // 绘制 不变的 图形
    drawLegend(legend);
    if (treemapLayout !== null) {
      drawTreemap(treemap, {
        layout: treemapLayout,
        maxWidth: treemapWidth,
        maxHeight: svgHeight,
        paddingTop: configs.paddingTop,
        fontSize,
      });
      // console.log('canvas get', canvas.document.querySelector('g[id="_A"]'));
    }
    svg.current = (wrapper as unknown) as d3.Selection<
      d3.BaseType,
      unknown,
      HTMLElement,
      any
    >;
  }, [configs.paddingTop, fontSize, svgHeight, svgWidth, treemapLayout]);

  // 渲染不同的 Frame
  useLayoutEffect(() => {
    if (frameIndex >= keyList.length || svg.current === undefined) return;
    // const treemapWidth = svgWidth - DESCRIPTION_WIDTH;
    let time = moment();
    new Promise<{
      fileEvoluationMap: Map<string, CP.FileEvoluationItem> | null;
      statisticData:
        | {
            name: string;
            value: number;
          }[]
        | null;
    }>((resolve, reject) => {
      if (requestEvoluation === undefined || treeStructure === undefined) {
        reject('requestEvoluation 不存在或 treeStructure 不存在');
      } else {
        setRequestLoading(true);
        // console.log('start request');
        requestEvoluation(frameIndex).then((fileEvoluationMap) => {
          console.log('数据获取时间', moment().diff(time, 'ms') + 'ms');
          setRequestLoading(() => {
            // console.log('loaded request');
            return false;
          });
          // console.log('show treemap');
          if (fileEvoluationMap === null) {
            resolve({
              fileEvoluationMap,
              statisticData: null,
            });
          } else {
            beautifyEvoluation(fileEvoluationMap);
            return resolve({
              fileEvoluationMap,
              // fileEvoluationMap: beautifyEvoluation(fileEvoluationMap),
              statisticData: getTotalStatisticData(fileEvoluationMap),
            });
          }
        });
      }
    })
      .then(({ fileEvoluationMap, statisticData }) => {
        if (
          treemapLayout === null ||
          fileEvoluationMap === null ||
          statisticData === null ||
          svg.current === undefined
        )
          return;
        setRendering(true);
        time = moment();
        const currentChangeFileUuids: string[] = [];
        fileEvoluationMap.forEach((value, fileUuid) => {
          const nodeGroup = (svg.current as d3.Selection<
            d3.BaseType,
            unknown,
            HTMLElement,
            any
          >).select(`g.${generateUnifyClassByFileUuid(fileUuid)}`);
          const change = hasFileChange(value);
          drawRectIsChange(nodeGroup.select('rect'), change);
          if (change) currentChangeFileUuids.push(fileUuid);
          if (change || beforeChangedFileUuids.current.includes(fileUuid)) {
            drawFileDetail(
              nodeGroup.select('g.evoluation'),
              value,
              fileUuid,
              pluginRefs,
              svgWidth,
            );
          }
        });
        setRendering(false);
        beforeChangedFileUuids.current = currentChangeFileUuids;
        console.log('渲染时间', moment().diff(time, 'ms') + 'ms');
        const dashboard = svg.current.select(`g.${IDRef.current}_dashboard`);
        drawStatisticDashboard(dashboard, statisticData);
      })
      .catch((err) => message.error(err));
    return () => {
      function deleteChild(el: HTMLElement) {
        let first = el.firstElementChild;
        while (first) {
          first.remove();
          first = el.firstElementChild;
        }
      }
      // 清空 Plugin
      const plugins = document.getElementById(PLUGIN_MASK_ID);
      if (plugins !== null) deleteChild(plugins);
    };
  }, [
    configs.paddingTop,
    fontSize,
    frameIndex,
    keyList.length,
    pluginRefs,
    requestEvoluation,
    svgHeight,
    svgWidth,
    treeStructure,
    treemapLayout,
  ]);

  return (
    <div style={{ position: 'relative' }}>
      {(loading || requestLoading || rendering) && (
        <div id="treemap-mask">
          <Spin />
          <p>{requestLoading ? '加载数据中……' : rendering ? '渲染中……' : ''}</p>
        </div>
      )}
      <Row style={{ marginBottom: 10 }}>
        <Col span={2}>
          <Checkbox
            checked={animation}
            onChange={(e) => setAnimation(e.target.checked)}
          >
            逐帧动画
          </Checkbox>
        </Col>
        <Col
          span={22}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          <div style={{ maxWidth: '400px', overflow: 'auto' }}>
            <Slider
              // range={{ draggableTrack: true }}
              style={{
                width: keyList.length * 20,
                display: 'inline-block',
                margin: '5px 10px',
                marginRight: '30px',
              }}
              dots
              value={frameIndex}
              min={0}
              max={keyList.length - 1}
              marks={keyList.map((_, index) => ({
                [index]: {
                  label: '' + index,
                },
              }))}
              onChange={(e: number) => {
                setAnimation(false);
                setFrameIndex(e);
              }}
            />
          </div>
          <InputNumber
            style={{ margin: '0 10px' }}
            size="small"
            min={0}
            max={keyList.length - 1}
            value={frameIndex}
            onChange={(e: number) => {
              setAnimation(false);
              setFrameIndex(e);
            }}
          />
          <Typography.Text>commit个数：{keyList.length}</Typography.Text>
        </Col>
        <Col span={14}>
          {Array.isArray(keyList) && frameIndex < keyList.length && (
            <>
              <div className="summary-line">
                <Avatar
                  style={{
                    backgroundColor:
                      COLORLIST[
                        str2number(keyList[frameIndex].extra.committer) %
                          COLORLIST.length
                      ],
                    verticalAlign: 'middle',
                  }}
                  size="small"
                  gap={2}
                >
                  {keyList[frameIndex].extra.committer[0] ?? ''}
                </Avatar>
                <span style={{ marginLeft: '5px' }}>
                  {keyList[frameIndex].extra.committer ?? ''}
                </span>
                <Divider type="vertical" />
                <Typography.Text code>{keyList[frameIndex].id}</Typography.Text>
                <Divider type="vertical" />
                <Typography.Text>
                  {keyList[frameIndex].extra.commitDate}
                </Typography.Text>
              </div>
              <Typography.Paragraph
                style={{ margin: 0, paddingLeft: '15px' }}
                ellipsis={
                  (keyList[frameIndex].extra.message ?? '').length > 10
                    ? { rows: 2, expandable: true, symbol: 'more' }
                    : false
                }
              >
                "{keyList[frameIndex].extra.message ?? '暂无'}"
              </Typography.Paragraph>
            </>
          )}
        </Col>
      </Row>
      <div style={{ position: 'relative' }}>
        <div
          id={`${IDRef.current}_wrapper`}
          // style={{
          //   width: svgWidth,
          //   height: svgHeight,
          //   overflow: 'hidden',
          //   fontSize: `${fontSize}px`,
          // }}
          // viewBox={`0 0 ${svgWidth} ${svgHeight}`}
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
        <div
          id={PLUGIN_MASK_ID}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            pointerEvents: 'none', // 事件透传
          }}
        ></div>
        {plugins}
      </div>
    </div>
  );
};

export default TreeMap3;
