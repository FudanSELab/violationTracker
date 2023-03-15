export function throttle(fn: Function, wait: number) {
  let handle: NodeJS.Timeout | null = null;
  return (...args: any[]) => {
    if (handle === null) {
      handle = setTimeout(() => {
        fn.apply(null, args);
        handle = null;
      }, wait);
    }
  };
}
