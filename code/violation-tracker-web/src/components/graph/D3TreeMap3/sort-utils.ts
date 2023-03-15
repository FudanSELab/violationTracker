export function getMiddleSortPosition(idx: number, length: number) {
  const a0 = Math.floor(length / 2);
  if (idx === 0) return a0;
  else {
    const left = a0;
    const right = length - 1 - a0;
    const firstStep = left === right ? 1 : -1;
    return a0 + (idx % 2 === 0 ? -1 : 1) * firstStep * Math.ceil(idx / 2);
  }
}

export function middleSort(arr: any[]) {
  const result = new Array(arr.length);
  for (let i = 0; i < arr.length; i++) {
    const middlePos = getMiddleSortPosition(i, arr.length);
    result[middlePos] = arr[i];
  }
  return result;
}

export function quickSort(
  arr: { value: number; [key: string]: any }[],
  start: number,
  end: number,
) {
  const len = end - start + 1;
  if (len <= 1) return;
  let pivot = end;
  let i = start;
  let j = end - 1;
  while (i <= j) {
    if (arr[i].value < arr[pivot].value) {
      i++;
    } else {
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
      j--;
    }
  }
  const tmp = arr[i];
  arr[i] = arr[pivot];
  arr[pivot] = tmp;
  quickSort(arr, start, i - 1);
  quickSort(arr, i + 1, end);
}
