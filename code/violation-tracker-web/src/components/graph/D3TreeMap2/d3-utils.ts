export default {};
// import * as d3 from 'd3';
// import { ITreeMapItem, TreeMapConfig, TreeMapFrameItem } from '.';

// function getValueByFileUuid(
//   dataset: ITreeMapItem,
//   fileUuid: string,
// ): ITreeMapItem[] {
//   if (dataset.fileUuid !== undefined && dataset.fileUuid === fileUuid) {
//     return [dataset];
//   }
//   if (!Array.isArray(dataset.children) || dataset.children.length === 0)
//     return [];
//   return dataset.children
//     .map((child) => {
//       return getValueByFileUuid(child, fileUuid);
//     })
//     .flat();
// }

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
//     // console.log('calculateData', data.detail, idx);
//     const total = data.detail?.[idx].realValue ?? data.value ?? 0;
//     if (!Array.isArray(data.detail)) return [total, 0, 0, 0];
//     // const res = Object.values(data.detail).map((list) => list[0] + list[1]);
//     const res = [
//       data.detail[idx].change.create[0] + data.detail[idx].change.create[1],
//       data.detail[idx].change.remove[0] + data.detail[idx].change.remove[1],
//       data.detail[idx].change.modify[0] + data.detail[idx].change.modify[1],
//     ];
//     return [total, ...res];
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
// const beautifyDataset = (dataset: ITreeMapItem) => {
//   // const noZero = (noZeroDataset(dataset) ?? {}) as ITreeMapItem;
//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   const [_, max] = getMinMax(dataset);

//   const linear = d3.scaleLinear().domain([0, max]).range([0, 1]);
//   const compute = d3.interpolate('#BAE7FF', '#0050B3');
//   return beautify(dataset, (n) => compute(linear(n)));
// };
// // const noZeroDataset = (dataset: ITreeMapItem) => {
// //   if (Array.isArray(dataset.children)) {
// //     return {
// //       name: dataset.name,
// //       children: dataset.children.reduce((acc, item) => {
// //         const res = noZeroDataset(item);
// //         if (res !== null) {
// //           acc.push(res);
// //         }
// //         return acc;
// //       }, [] as any[]),
// //     };
// //   } else {
// //     if (getValue(dataset.value) <= 0) return null;
// //     return { ...dataset };
// //   }
// // };
// const beautify = (
//   dataset: ITreeMapItem,
//   computeColor: (n: number) => string,
// ): ITreeMapItem => {
//   if (Array.isArray(dataset.children)) {
//     return {
//       name: dataset.name,
//       children: dataset.children.map((item) => beautify(item, computeColor)),
//     };
//   } else {
//     return {
//       ...dataset,
//       detail: dataset.detail?.map((v) => ({
//         ...v,
//         realValue: v.value,
//         heatColor: v.value ? computeColor(v.value) : undefined,
//       })),
//       value: 1,
//     };
//   }
// };
// const getMinMax = (dataset: ITreeMapItem) => {
//   if (Array.isArray(dataset.children)) {
//     return dataset.children.reduce(
//       (acc, item) => {
//         const [min, max] = getMinMax(item);
//         if (acc[0] > min) acc[0] = min;
//         if (acc[1] < max) acc[1] = max;
//         return acc;
//       },
//       [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER],
//     );
//   } else {
//     if (!Array.isArray(dataset.detail))
//       return [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER];
//     const values = dataset.detail.map(({ value }) => value);
//     return [
//       getValue(Math.min(...values), Number.MAX_SAFE_INTEGER),
//       getValue(Math.max(...values), Number.MIN_SAFE_INTEGER),
//     ];
//   }
// };

// const format = d3.format(',d');
// const getColorSchema = (data: any[] = []) => {
//   // 这里的 data 是处理过后的 children 内容
//   return d3.scaleOrdinal(
//     data.map((d) => d.name),
//     d3.schemeCategory10.map((d) => d3.interpolateRgb(d, 'white')),
//   );
// };

// const hasFileChange = (d: ITreeMapItem, idx: number) => {
//   if (Array.isArray(d.detail)) {
//     return (
//       Object.values(d.detail[idx].change)
//         .map((list) => list[0] + list[1])
//         .reduce((a, b) => a + b, 0) > 0
//     );
//   } else {
//     return false;
//   }
// };

// const validateDatasets = (data: TreeMapFrameItem[], index: number) => {
//   return Array.isArray(data) && data.length > index && index !== -1;
// };

// const getValue = (num?: number, fallback?: number) => {
//   return num === undefined ? fallback ?? 0 : num;
// };

// const getLayout = (mapdata: ITreeMapItem, configs: TreeMapConfig) => {
//   const {
//     width = 400,
//     height = 300,
//     // tileType = 'treemapSlice'
//   } = configs;
//   const treemapLayout = d3
//     .treemap<ITreeMapItem>()
//     // @ts-ignore
//     .tile(d3.treemapBinary)
//     .size([width, height])
//     .paddingInner(2)
//     // .paddingOuter(1)
//     // .paddingTop(0)
//     .round(false);

//   const root = treemapLayout(
//     d3
//       .hierarchy(mapdata) // 用于根据给定的分层数据构造根节点数据
//       .sum((d) => {
//         return getValue(d.value);
//       }) // 返回 nodeList，并设置 node.value 的值
//       .sort((a, b) => {
//         // return getValue(b.value) - getValue(a.value);
//         return a.data.name.localeCompare(b.data.name);
//       }),
//   );

//   return () => {
//     // const maxIndex = maxLayout ? -1 : index;
//     // const k = Math.sqrt(
//     //   getValue(root.sum((d) => (d.values ? d.values[index] : 0)).value) /
//     //     getMaxs(mapdata, maxIndex),
//     // );
//     const k = Math.sqrt(1);
//     const x = ((1 - k) / 2) * width;
//     const y = ((1 - k) / 2) * height;

//     return (
//       treemapLayout
//         .size([width * k, height * k])(root)
//         // eslint-disable-next-line no-sequences
//         .each((d) => ((d.x0 += x), (d.x1 += x), (d.y0 += y), (d.y1 += y)))
//         .leaves()
//       // .descendants()
//     );

//     // const leaves = treemapLayout
//     //   .size([width * k, height * k])(root)
//     //   // eslint-disable-next-line no-sequences
//     //   .each((d) => ((d.x0 += x), (d.x1 += x), (d.y0 += y), (d.y1 += y)))
//     //   .leaves();

//     // // 不固定排序布局
//     // if (
//     //   !Array.isArray(mapdata.children) ||
//     //   !mapdata.children[0].value ||
//     //   !sortTransition
//     // )
//     //   return leaves;

//     // const newLeaves = new Array(leaves.length);
//     // const keyList = mapdata.children.map(({ name }) => name);
//     // // eslint-disable-next-line array-callback-return
//     // leaves.map((item) => {
//     //   const itemIndex = keyList.indexOf(item.data.name);
//     //   newLeaves[itemIndex] = item;
//     // });

//     // return newLeaves;
//   };
// };

// /**
//  * 唯一 UID 生成器
//  * @param {*} name
//  */
// const UID = (name: string, fixed = false) => {
//   let UID_CONST_COUNT = 0;
//   return () =>
//     new Id(
//       'O-' +
//         (name == null ? '' : name + '-') +
//         (fixed ? 'const' : ++UID_CONST_COUNT),
//     );
// };

// class Id {
//   id: string;
//   href: string;
//   constructor(id: string) {
//     this.id = id;
//     this.href = window.location.href + '#' + id;
//   }
// }
// Id.prototype.toString = function () {
//   return 'url(' + this.href + ')';
// };

// export {
//   UID,
//   format,
//   getColorSchema,
//   hasFileChange,
//   validateDatasets,
//   getLayout,
//   getSumData,
//   beautifyDataset,
//   getValueByFileUuid,
// };
