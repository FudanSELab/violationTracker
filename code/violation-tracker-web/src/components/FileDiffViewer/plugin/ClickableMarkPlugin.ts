import BaseMarkPlugin from './BaseMarkPlugin';

class ClickableMarkPlugin extends BaseMarkPlugin<boolean> {
  mark(
    lines: Element[],
    right: boolean = true,
    options?: {
      lineOffset: number;
    },
  ) {
    if (
      lines.length === 0 ||
      lines.length <
        Math.min(this.activeLines.right.length, this.activeLines.left.length)
    )
      return;
    const bools = right ? this.activeLines.right : this.activeLines.left;
    bools?.forEach((bool, index) => {
      if (bool) {
        const gutters = lines[index].querySelectorAll('td[class*=gutter]');
        if (gutters.length >= 2) {
          gutters[right ? 1 : 0].setAttribute('data-clickable', 'true');
        }
      }
    });
  }
  unmark(diffTableLines: NodeListOf<Element>) {
    diffTableLines.forEach((node) => {
      const gutters = node.querySelectorAll('td[class*=gutter]');
      gutters.forEach((gutter) => gutter.removeAttribute('data-clickable'));
    });
  }
}

export default ClickableMarkPlugin;
