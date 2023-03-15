import BaseMarkPlugin from './BaseMarkPlugin';

class RetrospectedMarkPlugin extends BaseMarkPlugin<number> {
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
    const lineOffset = options?.lineOffset ?? 0;
    const highlightRetrospectedLines = right
      ? this.activeLines.right
      : this.activeLines.left;
    const nums = highlightRetrospectedLines
      ?.map((num) => num - lineOffset - 1)
      .filter((num) => num >= 0 && num < lines.length);
    nums?.forEach((num) => {
      const gutters = lines[num].querySelectorAll('td[class*=gutter]');
      if (gutters.length >= 2) {
        gutters[right ? 1 : 0].setAttribute('data-retrospected', 'true');
      }
    });
  }
  unmark(diffTableLines: NodeListOf<Element>) {
    diffTableLines.forEach((node) => {
      const gutters = node.querySelectorAll('td[class*=gutter]');
      gutters.forEach((gutter) => gutter.removeAttribute('data-retrospected'));
    });
  }
}

export default RetrospectedMarkPlugin;
