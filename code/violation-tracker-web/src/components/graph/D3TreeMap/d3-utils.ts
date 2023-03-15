import * as d3 from 'd3';
import { ITreeMapItem, TreeMapConfig, TreeMapFrameItem } from '.';

// export function getDepth(data: d3.HierarchyNode<ITreeMapItem>): number {
//   if (Array.isArray(data.children)) {
//     return (
//       1 +
//       data.children.reduce((acc, item) => {
//         const dep = getDepth(item);
//         return Math.max(acc, dep);
//       }, -1)
//     );
//   } else {
//     return 1;
//   }
// }
function getValueByFileUuid(
  dataset: ITreeMapItem,
  fileUuid: string,
): ITreeMapItem[] {
  if (dataset.fileUuid !== undefined && dataset.fileUuid === fileUuid) {
    return [dataset];
  }
  if (!Array.isArray(dataset.children) || dataset.children.length === 0)
    return [];
  // for (let child of dataset.children) {
  //   const childV = getValueByFileUuid(child, fileUuid);
  //   if (childV === null) continue;
  //   return childV;
  // }
  // return null;
  return dataset.children
    .map((child) => {
      return getValueByFileUuid(child, fileUuid);
    })
    .flat();
}

function calculateData(data: ITreeMapItem): number[] {
  if (data.children) {
    return data.children.reduce(
      (acc, item) => {
        const result = calculateData(item);
        return acc.map((a, index) => {
          return a + result[index];
        });
      },
      [0, 0, 0, 0],
    );
  } else {
    const total = data.realValue ?? data.value ?? 0;
    if (data.detail === undefined) return [total, 0, 0, 0];
    // const res = Object.values(data.detail).map((list) => list[0] + list[1]);
    const res = [
      data.detail.create[0] + data.detail.create[1],
      data.detail.remove[0] + data.detail.remove[1],
      data.detail.modify[0] + data.detail.modify[1],
    ];
    return [total, ...res];
  }
}
const getSumData = (data: ITreeMapItem) => {
  const [total, create, remove, modify] = calculateData(data);
  return [
    { name: 'total', value: total },
    { name: 'create', value: create },
    { name: 'remove', value: remove },
    { name: 'modify', value: modify },
  ];
};
const beautifyDataset = (dataset: ITreeMapItem) => {
  const noZero = (noZeroDataset(dataset) ?? {}) as ITreeMapItem;
  const [min, max] = getMinMax(noZero);

  return beautify(noZero, min, max);
};
const noZeroDataset = (dataset: ITreeMapItem) => {
  if (Array.isArray(dataset.children)) {
    return {
      name: dataset.name,
      children: dataset.children.reduce((acc, item) => {
        const res = noZeroDataset(item);
        if (res !== null) {
          acc.push(res);
        }
        return acc;
      }, [] as any[]),
    };
  } else {
    if (getValue(dataset.value) <= 0) return null;
    return { ...dataset };
  }
};
const beautify = (
  dataset: ITreeMapItem,
  min: number,
  max: number,
): ITreeMapItem => {
  if (Array.isArray(dataset.children)) {
    return {
      name: dataset.name,
      children: dataset.children.map((item) => beautify(item, min, max)),
    };
  } else {
    // 最大最小倍数比
    const multiplyRadio = min === 0 ? 100 : max / min;
    const base = Math.min(33, max / 10);
    // 区间 1，由双曲正切函数调整，输出增长率快到缓慢
    const reviseMethod = (i: number) => Math.tanh(i / 20) * 26;
    const computeVote = (vote: number, quota: number) => {
      if (vote === 0) return 0;
      // 基底 + 倍数 * 每倍的份额
      return base + (vote / min - 1) * quota;
    };
    const stage1 = 10;
    const stage2 = 30;
    // 10倍区间
    const ceilStage1 = 600;
    // 30倍区间
    const ceilStage2 = 1000;
    // 30倍以上区间
    const ceilStage3 = 1300;
    const i = getValue(dataset.value);
    let finalVote: number = 0;
    let quota;
    // 不同阶段处理方案
    if (multiplyRadio <= stage1 + 1) {
      quota = (ceilStage1 - base) / stage1;
      const reviseValue = reviseMethod(i);
      finalVote = computeVote(reviseValue, quota);
    } else if (multiplyRadio <= stage2 + 1) {
      quota = (ceilStage2 - base) / stage2;
      finalVote = computeVote(i, quota);
    } else {
      // 需要隐藏部分票数，隐藏部分尖角等
      quota = ceilStage3 / multiplyRadio;
      finalVote = computeVote(i, quota);
    }
    return {
      ...dataset,
      realValue: dataset.value,
      value: finalVote,
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
      getValue(dataset.value, Number.MAX_SAFE_INTEGER),
      getValue(dataset.value, Number.MIN_SAFE_INTEGER),
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

const hasFileChange = (d: ITreeMapItem) => {
  if (d.detail) {
    return (
      Object.values(d.detail)
        .map((list) => list[0] + list[1])
        .reduce((a, b) => a + b, 0) > 0
    );
  } else {
    return false;
  }
};

// const getMaxs = (
//   data: ITreeMapItem & {
//     keys: number[];
//     children: ITreeMapItem[];
//   },
//   index = -1,
// ) => {
//   const sums = data.keys.map(
//     (_, i) =>
//       getValue(d3.hierarchy(data).sum((d) => (d.values ? Math.round(d.values[i]) : 0))
//         .value),
//   );
//   return index === -1 ? d3.max(sums) ?? 0 : sums[index];
// };
const validateDatasets = (data: TreeMapFrameItem[], index: number) => {
  return Array.isArray(data) && data.length > index && index !== -1;
};

const getValue = (num?: number, fallback?: number) => {
  return num === undefined ? fallback ?? 0 : num;
};

const getLayout = (mapdata: ITreeMapItem, configs: TreeMapConfig) => {
  const {
    width = 400,
    height = 300,
    tileType = 'treemapSlice',
    paddingTop = 3,
    // maxLayout,
    // sortTransition,
  } = configs;
  const treemapLayout = d3
    .treemap<ITreeMapItem>()
    // @ts-ignore
    .tile(d3[tileType])
    .size([width, height])
    .paddingInner(3)
    .paddingOuter(3)
    .paddingTop(paddingTop)
    .round(true);

  const root = treemapLayout(
    d3
      .hierarchy(mapdata) // 用于根据给定的分层数据构造根节点数据
      .sum((d) => {
        return getValue(d.value);
      }) // 返回 nodeList，并设置 node.value 的值
      .sort((a, b) => {
        return getValue(b.value) - getValue(a.value);
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
  getSumData,
  beautifyDataset,
  getValueByFileUuid,
};
