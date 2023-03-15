import { IDeveloperRadarItem } from '.';

/**
 * 获取一个圆边上的节点坐标
 * @param {Array} origin 坐标[x,y]
 * @param {Number} r 半径
 * @param {Number} n 数量
 * @param {Number} offset 偏移角度
 * @returns
 */
export function transform2XY(origin: number[], Θ: number, r: number) {
  let ox = origin[0];
  let oy = origin[1];
  return {
    x: ox + r * Math.sin(Θ),
    y: oy - r * Math.cos(Θ),
  };
}

export function getAllItemNum(data: IDeveloperRadarItem[]): number {
  return data.reduce((acc, item) => {
    if (Array.isArray(item.children) && item.children.length > 0) {
      return acc + getAllItemNum(item.children);
    } else {
      return acc + 1;
    }
  }, 0);
}

export function getTextLevel(data: IDeveloperRadarItem[]): number {
  return data.reduce((acc, item) => {
    return Math.max(
      acc,
      1 +
        (Array.isArray(item.children) && item.children.length > 0
          ? getTextLevel(item.children)
          : 0),
    );
  }, 0);
}
