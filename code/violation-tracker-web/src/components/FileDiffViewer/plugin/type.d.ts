declare type MarkFuncType = (
  lines: Element[],
  activeLines: any[],
  right: boolean,
  options?: {
    lineOffset: number;
  },
) => void;
declare type UnmarkFuncType = (diffTableLines: NodeListOf<Element>) => void;
declare interface MarkPluginRefProps {
  mark: MarkFuncType;
  unmark: UnmarkFuncType;
}
