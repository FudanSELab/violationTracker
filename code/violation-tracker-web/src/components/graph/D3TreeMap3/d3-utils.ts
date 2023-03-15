import * as d3 from 'd3';
import { ITreeItemDetail, ITreeMapItem, TreeMapConfig, TreeMapData } from '.';

function generateIdByFileUuid(fileUuid?: string) {
  return fileUuid ? '_' + fileUuid : '';
}

function getValueByFileUuid(
  dataset: ITreeMapItem,
  fileUuid: string,
): ITreeMapItem[] {
  if (dataset.fileUuid !== undefined && dataset.fileUuid === fileUuid) {
    return [dataset];
  }
  if (!Array.isArray(dataset.children) || dataset.children.length === 0)
    return [];
  return dataset.children
    .map((child) => {
      return getValueByFileUuid(child, fileUuid);
    })
    .flat();
}

// function mergeFileTreeAndEvoluation(
//   treemap: ITreeMapItem,
//   fileEvoluationMap: Map<string, CP.FileEvoluationItem>,
// ) {
//   if (!Array.isArray(treemap.children)) {
//     if (treemap.fileUuid !== undefined) {
//       treemap.historyDetail = fileEvoluationMap.get(treemap.fileUuid);
//     }
//   } else {
//     treemap.children.forEach((child) => {
//       mergeFileTreeAndEvoluation(child, fileEvoluationMap);
//     });
//   }
// }
function getTotalStatisticData(
  fileEvoluationMap: Map<string, CP.FileEvoluationItem>,
) {
  let total = 0;
  let create = 0;
  let modify = 0;
  let remove = 0;
  fileEvoluationMap.forEach((value) => {
    total += value.value;
    create += value.change.create[0] + value.change.create[1];
    modify += value.change.modify[0] + value.change.modify[1];
    remove += value.change.remove[0] + value.change.remove[1];
  });
  return [
    { name: 'total', value: total },
    { name: 'create', value: create },
    { name: 'remove', value: remove },
    { name: 'modify', value: modify },
  ];
}
// function calculateData(data: ITreeMapItem, idx: number): number[] {
//   if (data.children) {
//     return data.children.reduce(
//       (acc, item) => {
//         const result = calculateData(item, idx);
//         return acc.map((a, index) => {
//           return a + result[index];
//         });
//       },
//       [0, 0, 0, 0],
//     );
//   } else {
//     if (data.historyDetail === undefined) return [0, 0, 0, 0];
//     else {
//       let detail = Array.isArray(data.historyDetail)
//         ? data.historyDetail[idx]
//         : data.historyDetail;
//       const total = detail.value ?? data.value ?? 0;
//       const res = [
//         detail.change.create[0] + detail.change.create[1],
//         detail.change.remove[0] + detail.change.remove[1],
//         detail.change.modify[0] + detail.change.modify[1],
//       ];
//       return [total, ...res];
//     }
//   }
// }
// const getSumData = (data: ITreeMapItem, idx: number) => {
//   const [total, create, remove, modify] = calculateData(data, idx);
//   return [
//     { name: 'total', value: total },
//     { name: 'create', value: create },
//     { name: 'remove', value: remove },
//     { name: 'modify', value: modify },
//   ];
// };
const beautifyDataset = (dataset: ITreeMapItem) => {
  // const noZero = (noZeroDataset(dataset) ?? {}) as ITreeMapItem;
  const [min, max] = getMinMax(dataset);

  const scaleHistoryLines = d3.scaleLinear().domain([min, max]).range([1, 10]);
  // const linear = d3.scaleLinear().domain([0, max]).range([0, 1]);
  // const compute = d3.interpolate('#BAE7FF', '#0050B3');
  return beautify(
    dataset,
    (v) => scaleHistoryLines(v),
    () => 'white',
    // (n) => compute(linear(n)),
  );
};
// const noZeroDataset = (dataset: ITreeMapItem) => {
//   if (Array.isArray(dataset.children)) {
//     return {
//       name: dataset.name,
//       children: dataset.children.reduce((acc, item) => {
//         const res = noZeroDataset(item);
//         if (res !== null) {
//           acc.push(res);
//         }
//         return acc;
//       }, [] as any[]),
//     };
//   } else {
//     if (getValue(dataset.value) <= 0) return null;
//     return { ...dataset };
//   }
// };
/**
 * 柯布—道格拉斯生产函数
 * L - 变化量（劳动要素）
 * K - 总量（资本要素）
 * alpha - 变化量弹性系数
 * beta - 总量弹性系数
 * 约定: alpha + beta = 1
 */
const CobbDouglasProductionFunction = (
  K: number,
  alpha: number,
  beta: number,
) => (L: number) => {
  return Math.pow(L, alpha) * Math.pow(K, beta);
};
/**
 * 类正弦函数
 * L - 变化量
 * K - 总量
 * alpha - 正弦弹性系数
 */
const likelySinFunction = (K: number, alpha: number) => (L: number) => {
  if (L === 0) return 0;
  return alpha * K * Math.sin((-1 * L * 2 * Math.PI) / K) + L;
};
/**
 * 类正弦反函数
 * L - 变化量
 * K - 总量
 */
const likelyArcSinFunction = (K: number) => (L: number) => {
  if (L === 0) return 0;
  const p = K / 2;
  return p * ((Math.asin(L / p - 1) * 2) / Math.PI + 1);
};

/**
 * @param deltaX - 变化量
 * @param offset - 偏移量
 * @returns number
 */
const deltaFunction = (
  deltaX: number,
  offset: number,
  func: (L: number) => number,
) => {
  const y1 = func(offset);
  const y2 = func(offset + deltaX);
  // console.log('delta:', offset + deltaX, y2, offset, y1);
  return y2 - y1;
};

const beautifyEvoluation = (
  fileEvoluationMap: Map<string, CP.FileEvoluationItem>,
  computeColor?: (n: number) => string,
) => {
  // const map = new Map<string, ITreeItemDetail>();
  fileEvoluationMap.forEach((value, key) => {
    //@ts-ignore
    value.heatColor = value.value ? computeColor?.(value.value) : undefined;
    // map.set(key, {
    //   ...value,
    //   heatColor: value.value ? computeColor?.(value.value) : undefined,
    // } as ITreeItemDetail);
  });
  // return map;
};

const beautify = (
  dataset: ITreeMapItem,
  computeValue: (v: number) => number,
  computeColor?: (n: number) => string,
): ITreeMapItem => {
  if (Array.isArray(dataset.children)) {
    return {
      key: dataset.key,
      name: dataset.name,
      children: dataset.children.map((item) =>
        beautify(item, computeValue, computeColor),
      ),
    };
  } else {
    return {
      ...dataset,
      // historyDetail: Array.isArray(dataset.historyDetail)
      //   ? dataset.historyDetail.map((v) => ({
      //       ...v,
      //       // realValue: v.value,
      //       heatColor: v.value ? computeColor(v.value) : undefined,
      //     }))
      //   : dataset.historyDetail !== undefined
      //   ? {
      //       ...dataset.historyDetail,
      //       // realValue: v.value,
      //       heatColor: dataset.historyDetail.value
      //         ? computeColor(dataset.historyDetail.value)
      //         : undefined,
      //     }
      //   : undefined,
      value: dataset.historyLines ? computeValue(dataset.historyLines) : 1,
    };
  }
};
const getMinMax = (dataset: ITreeMapItem) => {
  if (Array.isArray(dataset.children)) {
    return dataset.children.reduce(
      (acc, item) => {
        const [min, max] = getMinMax(item);
        if (acc[0] > min) acc[0] = min;
        if (acc[1] < max) acc[1] = max;
        return acc;
      },
      [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER],
    );
  } else {
    return [
      getValue(dataset.historyLines, Number.MAX_SAFE_INTEGER),
      getValue(dataset.historyLines, Number.MIN_SAFE_INTEGER),
    ];
  }
};

const format = d3.format(',d');
const getColorSchema = (data: any[] = []) => {
  // 这里的 data 是处理过后的 children 内容
  return d3.scaleOrdinal(
    data.map((d) => d.name),
    d3.schemeCategory10.map((d) => d3.interpolateRgb(d, 'white')),
  );
};

const hasFileChange = (evoluation?: ITreeItemDetail) => {
  if (evoluation === undefined) return false;
  const change = evoluation.change;
  return (
    change.create[0] +
      change.create[1] +
      change.modify[0] +
      change.modify[1] +
      change.remove[0] +
      change.remove[1] >
    0
  );
};
// const hasFileChange = (d: ITreeMapItem, idx: number) => {
//   if (d.historyDetail === undefined) return false;
//   else {
//     let detail = Array.isArray(d.historyDetail)
//       ? d.historyDetail[idx]
//       : d.historyDetail;
//     const change = detail.change;
//     return (
//       change.create[0] +
//         change.create[1] +
//         change.modify[0] +
//         change.modify[1] +
//         change.remove[0] +
//         change.remove[1] >
//       0
//     );
//   }
// };

const validateDatasets = (data: TreeMapData[], index: number) => {
  return Array.isArray(data) && data.length > index && index !== -1;
};

const getValue = (num?: number, fallback?: number) => {
  return num === undefined ? fallback ?? 0 : num;
};

const getLayout = (mapdata: ITreeMapItem, configs: TreeMapConfig) => {
  const {
    width = 400,
    height = 300,
    // tileType = 'treemapSlice'
  } = configs;
  const treemapLayout = d3
    .treemap<ITreeMapItem>()
    // @ts-ignore
    .tile(d3.treemapBinary)
    .size([width, height])
    .paddingInner(2)
    .paddingOuter(1)
    // .paddingTop(0)
    .round(false);

  const root = treemapLayout(
    d3
      .hierarchy(mapdata) // 用于根据给定的分层数据构造根节点数据
      .sum((d) => {
        return getValue(d.value);
      }) // 返回 nodeList，并设置 node.value 的值
      .sort((a, b) => {
        // return getValue(b.value) - getValue(a.value);
        return a.data.name.localeCompare(b.data.name);
      }),
  );

  return () => {
    // const maxIndex = maxLayout ? -1 : index;
    // const k = Math.sqrt(
    //   getValue(root.sum((d) => (d.values ? d.values[index] : 0)).value) /
    //     getMaxs(mapdata, maxIndex),
    // );
    const k = Math.sqrt(1);
    const x = ((1 - k) / 2) * width;
    const y = ((1 - k) / 2) * height;

    return (
      treemapLayout
        .size([width * k, height * k])(root)
        // eslint-disable-next-line no-sequences
        .each((d) => ((d.x0 += x), (d.x1 += x), (d.y0 += y), (d.y1 += y)))
        // .leaves()
        .descendants()
    );

    // const leaves = treemapLayout
    //   .size([width * k, height * k])(root)
    //   // eslint-disable-next-line no-sequences
    //   .each((d) => ((d.x0 += x), (d.x1 += x), (d.y0 += y), (d.y1 += y)))
    //   .leaves();

    // // 不固定排序布局
    // if (
    //   !Array.isArray(mapdata.children) ||
    //   !mapdata.children[0].value ||
    //   !sortTransition
    // )
    //   return leaves;

    // const newLeaves = new Array(leaves.length);
    // const keyList = mapdata.children.map(({ name }) => name);
    // // eslint-disable-next-line array-callback-return
    // leaves.map((item) => {
    //   const itemIndex = keyList.indexOf(item.data.name);
    //   newLeaves[itemIndex] = item;
    // });

    // return newLeaves;
  };
};

/**
 * 唯一 UID 生成器
 * @param {*} name
 */
const UID = (name: string, fixed = false) => {
  let UID_CONST_COUNT = 0;
  return () =>
    new Id(
      'O-' +
        (name == null ? '' : name + '-') +
        (fixed ? 'const' : ++UID_CONST_COUNT),
    );
};

class Id {
  id: string;
  href: string;
  constructor(id: string) {
    this.id = id;
    this.href = window.location.href + '#' + id;
  }
}
Id.prototype.toString = function () {
  return 'url(' + this.href + ')';
};

export {
  UID,
  format,
  getColorSchema,
  hasFileChange,
  validateDatasets,
  getLayout,
  // getSumData,
  getTotalStatisticData,
  beautifyDataset,
  getValueByFileUuid,
  generateIdByFileUuid,
  CobbDouglasProductionFunction,
  likelySinFunction,
  likelyArcSinFunction,
  deltaFunction,
  beautifyEvoluation,
  // mergeFileTreeAndEvoluation,
};
