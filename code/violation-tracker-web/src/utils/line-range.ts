export type LineRange = { start: number; end: number };

export const expandLineRange = (range: LineRange) => {
  return {
    start: Math.max(range.start - 5, 0),
    end: range.end + 10,
  };
};

export const mergeLineRange = (
  left: LineRange[],
  right: LineRange[],
  gap: number = 0,
) => {
  let i = 0;
  let j = 0;
  const res: LineRange[] = [];
  while (i < left.length || j < right.length) {
    // 右边已没有 lineRange
    if (j >= right.length) {
      // console.log(-1);
      res.push(left[i]);
      i++;
      continue;
    }
    // 左边已没有 lineRange
    if (i >= left.length) {
      // console.log(0);
      res.push(right[j]);
      j++;
      continue;
    }
    /**
     * i |--|
     * j      |--|
     */
    if (left[i].end < right[j].start) {
      // 容错间隙
      if (left[i].end + gap >= right[j].start) {
        left[i].end += gap;
        continue;
      }
      // console.log(1);
      res.push(left[i]);
      i++;
      continue;
    }
    /**
     * i      |--|
     * j |--|
     */
    if (right[j].end < left[i].start) {
      // 容错间隙
      if (right[j].end + gap >= left[i].start) {
        right[j].end += gap;
        continue;
      }
      // console.log(2);
      res.push(right[j]);
      j++;
      continue;
    }
    /**
     * i |---|
     * j  |--|
     */
    if (left[i].end >= right[j].end && left[i].start <= right[j].start) {
      // console.log(3);
      res.push(left[i]);
      i++;
      j++;
      continue;
    }
    /**
     * i |--|
     * j |---|
     */
    if (right[j].end >= left[i].end && right[j].start <= left[i].start) {
      // console.log(4);
      res.push(right[j]);
      i++;
      j++;
      continue;
    }
    /**
     * i |---|
     * j  |---|
     */
    if (left[i].start < right[j].start && left[i].end < right[j].end) {
      // console.log(5);
      res.push({
        start: left[i].start,
        end: right[j].end,
      });
      i++;
      j++;
      continue;
    }
    /**
     * i  |---|
     * j |---|
     */
    if (right[j].start < left[i].start && right[j].end < left[i].end) {
      // console.log(6);
      res.push({
        start: right[j].start,
        end: left[i].end,
      });
      i++;
      j++;
      continue;
    }
  }
  return res;
};

export const compressLineRange = (lineRange: LineRange[], gap: number = 0) => {
  return lineRange.reduce((acc: LineRange[], item) => {
    if (acc.length > 0 && acc[acc.length - 1].end + gap >= item.start) {
      const top = acc.pop() as LineRange;
      acc.push({
        start: top.start,
        end: item.end,
      });
    } else {
      acc.push(item);
    }
    return acc;
  }, []);
};

export const lineRange2Lines = (lineRange: LineRange) => {
  const result = [];
  for (let i = lineRange.start; i <= lineRange.end; i++) {
    result.push(i);
  }
  return result;
};

export const lines2LineRanges = (lines: number[]) => {
  const lineRanges = lines.map((line) => ({ start: line, end: line }));
  return compressLineRange(lineRanges, 1);
};
