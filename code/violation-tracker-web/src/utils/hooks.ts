import { Dispatch, useCallback, useEffect, useRef, useState } from 'react';

export function useDebounce(
  fn: (...args: any[]) => any,
  delay: number,
  dep: any[] = [],
) {
  const { current } = useRef<{
    fn: (...args: any[]) => void;
    timer: NodeJS.Timeout | null;
  }>({ fn, timer: null });
  useEffect(() => {
    current.fn = fn;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fn]);
  return useCallback((...args) => {
    if (current.timer) {
      clearTimeout(current.timer);
    }
    current.timer = setTimeout(() => {
      // @ts-ignore
      current.fn.call(this, ...args);
    }, delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dep);
}

export function useFetchState<T>(props: any): [T, Dispatch<T>] {
  const focus = useRef<boolean>();
  const [state, setState] = useState<T>(props);
  useEffect(() => {
    focus.current = true;
    return () => {
      focus.current = false;
    };
  }, []);
  const setFetchState = useCallback((params: T) => {
    focus.current && setState(params);
  }, []);
  return [state, setFetchState];
}
