import { IssueItem } from '@/models/issueStore';
import BaseMarkPlugin from './BaseMarkPlugin';

class BugMarkPlugin extends BaseMarkPlugin<IssueItem> {
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
    const highlightBugLines = right
      ? this.activeLines.right
      : this.activeLines.left;
    highlightBugLines.forEach((currentBugLine) => {
      if (currentBugLine === undefined) return;
      const nums = currentBugLine?.lines
        ?.map((num) => num - lineOffset - 1) // 为什么要-1我也不知道，但是和后端返回的startLine一致
        .filter((num) => num >= 0 && num < lines.length);
      new Set(nums)?.forEach((num) => {
        const gutters = lines[num].querySelectorAll('td[class*=gutter]');
        if (gutters.length >= 2) {
          gutters[right ? 1 : 0].setAttribute('data-bug-line', 'true');
        }
        const contents = lines[num].querySelectorAll('td[class*=content]');
        if (contents.length >= 2) {
          if (
            currentBugLine.detail !== undefined &&
            currentBugLine.detail !== ''
          ) {
            const p = document.createElement('p');
            p.setAttribute('class', 'bug-detail');
            p.innerText = currentBugLine.detail;
            contents[right ? 1 : 0].append(p);
          }
        }
      });
    });
  }
  unmark(diffTableLines: NodeListOf<Element>) {
    diffTableLines.forEach((node) => {
      const gutters = node.querySelectorAll('td[class*=gutter]');
      gutters.forEach((gutter) => gutter.removeAttribute('data-bug-line'));
      const bugLines = node.querySelectorAll(
        'td[class*=content] > .bug-detail',
      );
      bugLines.forEach((line) => line.remove());
    });
  }
}

export default BugMarkPlugin;
