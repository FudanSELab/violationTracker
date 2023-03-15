export default class BaseMarkPlugin<T> {
  activeLines: { left: T[]; right: T[] };
  constructor(activeLines: { left: T[]; right: T[] }) {
    this.activeLines = activeLines;
  }

  mark(
    lines: Element[],
    right: boolean = true,
    options?: {
      lineOffset: number;
    },
  ) {
    // do nothing
  }

  unmark(diffTableLines: NodeListOf<Element>) {
    // do nothing
  }
}
