import {
  LabelTooltipType,
  WrapperTooltipProps,
} from 'antd/lib/form/FormItemLabel';
import React from 'react';

export const swap = (list: any[], from: number, to: number) => {
  const tmp = list[to];
  list[to] = list[from];
  list[from] = tmp;
};
export const quickSort = (
  list: { project: string; num: number }[],
  from: number,
  to: number,
) => {
  if (from >= to - 1) {
    return list;
  }
  const pivot = list[to - 1];
  let i = from - 1;
  for (let j = from; j < to - 1; j++) {
    if (list[j]?.num > pivot?.num) {
      i++;
      swap(list, i, j);
    }
  }
  i++;
  swap(list, i, to - 1);

  quickSort(list, from, i);
  quickSort(list, i + 1, to);
  return list;
};

export function toTooltipProps(
  tooltip: LabelTooltipType,
): WrapperTooltipProps | null {
  if (!tooltip) {
    return null;
  }

  if (typeof tooltip === 'object' && !React.isValidElement(tooltip)) {
    return tooltip as WrapperTooltipProps;
  }

  return {
    title: tooltip,
  };
}
