const sum = (x: number, y: number) => x + y;
const square = (x: number) => x * x;

export const average = (X: number[]) => {
  const sums = X.reduce(sum, 0);
  return sums / X.length;
};

export const quantile = (X: number[], quantPercent: number) => {
  const selfX = [...X];
  selfX.sort((a, b) => a - b);
  if (Number.isInteger((selfX.length + 1) * quantPercent)) {
    return selfX[(selfX.length + 1) * quantPercent];
  } else {
    const prev = Math.floor((selfX.length + 1) * quantPercent);
    const next = prev + 1;
    return prev * (1 - quantPercent) + next * quantPercent;
  }
};

const mapKeepPos = <T>(list: T[], func: (v: T) => T) => {
  // const result = [];
  // for (let i = 0; i < list.length; i++) {
  //   result[i] = func(list[i]);
  // }
  // return result;
  return list.map(func);
};

// const median = (X: number[]) => {
//   X.sort((a, b) => a - b);
//   const middle = Math.floor(X.length / 2);
//   if (X.length % 2 === 0) {
//     return (X[middle] + X[middle + 1]) / 2;
//   } else {
//     return X[middle];
//   }
// };

const standardDeviation = (X: number[]) => {
  const mean = average(X);
  const divs = mapKeepPos(X, (x) => x - mean);
  return Math.sqrt(mapKeepPos(divs, square).reduce(sum) / (X.length - 1));
};

/**
 * 最大最小值归一化（min-max normalization）：将数值范围缩放到 [0, 1] 区间里
 * @param X 数组
 */
export function minMaxNormalization(X: number[]) {
  const min = Math.min(...X);
  const max = Math.max(...X);
  return mapKeepPos(X, (x) => (x - min) / (max - min));
}

/**
 * 均值归一化（mean normalization）：将数值范围缩放到 [-1, 1] 区间里，且数据的均值变为0
 * @param X 数组
 */
export function meanNormalization(X: number[]) {
  const min = Math.min(...X);
  const max = Math.max(...X);
  const mean = average(X);
  return mapKeepPos(X, (x) => (x - mean) / (max - min));
}

/**
 * 标准化 / z值归一化（standardization / z-score normalization）
 * 将数值缩放到0附近，且数据的分布变为均值为0，标准差为1的标准正态分布
 * （先减去均值来对特征进行 中心化 mean centering 处理，再除以标准差进行缩放）
 * @param X 数组
 */
export function standardNormalization(X: number[]) {
  const mean = average(X);
  const standardDev = standardDeviation(X);
  return mapKeepPos(X, (x) => (x - mean) / standardDev);
}

/**
 * 最大绝对值归一化（max abs normalization ）
 * 也就是将数值变为单位长度（scaling to unit length），将数值范围缩放到 [-1, 1] 区间里
 * @param X 数组
 */
export function maxAbsNormalization(X: number[]) {
  const absMax = Math.abs(Math.max(...X));
  return mapKeepPos(X, (x) => x / absMax);
}

/**
 * 稳键归一化（robust normalization）
 * 先减去中位数，再除以四分位间距（interquartile range），因为不涉及极值，因此在数据里有异常值的情况下表现比较稳健
 * @param X 数组
 */
export function robustNormalization(X: number[]) {
  const med = quantile(X, 0.5);
  const q1 = quantile(X, 0.25);
  const q3 = quantile(X, 0.75);
  const IQR = q3 - q1;
  return mapKeepPos(X, (x) => (x - med) / IQR);
}
