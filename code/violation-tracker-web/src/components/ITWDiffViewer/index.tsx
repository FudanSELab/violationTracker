import * as React from 'react';
import ReactDiffViewer, {
  DiffMethod,
  ReactDiffViewerStylesOverride,
} from 'react-diff-viewer';
import Prism from 'prismjs';
import { message } from 'antd';

import MemoCommitTitle from '../RetrospectViewer/components/MemoCommitTitle';
import './ITWDiffViewer.less';
import TipsModal from '@/components/TipsModal';
import { BugLineType } from '@/models/metaStore';
import ReactDOM from 'react-dom';
import { getViewableBlockBottomHeight } from '@/utils/hightAndWidth';
import { checkCodeLanguage } from '@/utils/check';

interface IProps {
  id: string;
  language: string;
  left?: API.CommitCodeInfo;
  right?: API.CommitCodeInfo;
  defaultHighlightLines?: string[];
  activeLines?: { left: boolean[]; right: boolean[] };
  highlightRetrospectedLinesCommitMap?: Map<string, number[]>;
  leftHighlightBugLinesCommitMap?: Map<string, BugLineType>;
  rightHighlightBugLinesCommitMap?: Map<string, BugLineType>;
  level?: API.TLevel;
  styles?: ReactDiffViewerStylesOverride;
  select?: {
    multiple?: boolean;
    useShift?: boolean;
    onSelect?: (
      list: { begin: number; end: number; code: string }[],
      commitId: string,
    ) => void;
  };
  onLineNumberDoubleClickToShowTip?: (
    v: { begin: number; end: number; code: string },
    commitId: string,
  ) => Promise<JSX.Element>;
}
interface IState {
  highlightLines: string[];
}

const includeEmptyGutter = (
  gutter: NodeListOf<Element>,
  right: boolean = true,
): boolean => {
  return gutter[right ? 1 : 0].className.includes('empty-gutter');
};

const getValidLines = (diffTableLines: NodeListOf<Element>, right: boolean) => {
  const lines: Element[] = [];
  diffTableLines.forEach((node) => {
    const gutters = node.querySelectorAll('td[class*=gutter]');
    if (!includeEmptyGutter(gutters, right)) {
      lines.push(node);
    }
  });
  return lines;
};

const GUTTER_TIP_CONTAINER = '_gutter_tip_container_';
const GUTTER_TIP_ID = '_gutter_tip_';

class ITWDiffViewer extends React.Component<IProps, IState> {
  private lineNumberCount: number = 0;
  constructor(props: IProps) {
    super(props);
    this.state = {
      highlightLines: props.defaultHighlightLines ?? [],
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps: IProps) {
    if (nextProps.defaultHighlightLines !== this.props.defaultHighlightLines) {
      this.setState({
        highlightLines: nextProps.defaultHighlightLines ?? [],
      });
    }
  }

  highlightSyntax = (language: string) => (source?: string) => {
    const pre = source?.startsWith('    ') ? source.slice(4) : source;
    return !checkCodeLanguage(language) ? (
      <>{source}</>
    ) : (
      <span
        style={{ minWidth: '400px' }}
        dangerouslySetInnerHTML={{
          __html: Prism.highlight(
            pre ?? '',
            Prism.languages[language],
            language,
          ),
        }}
      />
    );
  };

  clearSelectLines = () => {
    this.setState({
      highlightLines: [],
    });
  };

  lastClickLine: string = '';
  onLineNumberSelect = (current: string, event: { shiftKey: boolean }) => {
    const { highlightLines } = this.state;
    const { select } = this.props;
    // current[0]，即第一个字符表示 R/L
    const direction = current[0];
    const currentNum = +current.split('-')[1];
    let resultHighlightLines = [];
    if (
      // 不同边的点击
      highlightLines.some((line: string) => line[0] !== current[0])
    ) {
      resultHighlightLines = [current];
    }
    // 按住 shift 且上次选中
    else if (
      (select?.useShift ?? true) &&
      event.shiftKey &&
      highlightLines.includes(this.lastClickLine)
    ) {
      const lastNum = +this.lastClickLine.split('-')[1];
      const min = Math.min(currentNum, lastNum);
      const max = Math.max(currentNum, lastNum);
      let result = [];
      for (let i = min; i <= max; i++) {
        result.push(`${direction}-${i}`);
      }
      resultHighlightLines = Array.from(
        new Set(highlightLines.concat(result)),
      ).sort((a, b) => (a < b ? -1 : 1));
    }
    // 一般情况
    else {
      if (select?.multiple) {
        if (highlightLines.includes(current)) {
          resultHighlightLines = highlightLines
            .filter((line: string) => line !== current)
            .sort((a, b) => (a < b ? -1 : 1));
        } else {
          resultHighlightLines = highlightLines
            .concat([current])
            .sort((a, b) => (a < b ? -1 : 1));
        }
      } else {
        // 单选
        resultHighlightLines = [current];
      }
    }
    this.setState({
      highlightLines: resultHighlightLines,
    });
    this.lastClickLine = current;
    // 发送事件到外部
    if (this.props.select?.onSelect) {
      this.props.select.onSelect(
        resultHighlightLines.map((line) => {
          const [pos, num] = (line as string).split('-');
          const position = pos === 'R' ? 'right' : 'left';
          const offset = this.props[position]?.lineBegin ?? 1;
          const begin = +num + offset - 1,
            end = +num + offset - 1;
          return {
            begin,
            end,
            code: this.getCodeContent(+num, position === 'right'),
          };
        }),
        (direction === 'L'
          ? this.props.left?.commitId
          : this.props.right?.commitId) ?? '',
      );
    }
  };

  diffTableLines?: NodeListOf<Element>;

  getCodeContent = (lineNumber: number, right: boolean = true) => {
    if (!this.diffTableLines || this.diffTableLines.length === 0) return '';
    const number = lineNumber - 1;
    const codeContentELements = getValidLines(this.diffTableLines, right)[
      number
    ].querySelectorAll('td[class*=content] > pre[class$=content-text]');
    if (codeContentELements.length < 2) {
      console.error('获取语句失败');
      return '';
    }
    return (codeContentELements[
      right ? 1 : 0
    ] as HTMLElement).innerText.replace(/\n/, '');
  };

  // 标记可点语句
  markClickable = (
    diffTableLines: NodeListOf<Element>,
    activeLines?: { left: boolean[]; right: boolean[] },
    right: boolean = true,
  ) => {
    if (
      !this.diffTableLines ||
      this.diffTableLines.length === 0 ||
      !activeLines
    ) {
      return;
    } else {
      const lines = getValidLines(diffTableLines, right);
      const bools = right ? activeLines.right : activeLines.left;
      bools?.forEach((bool, index) => {
        if (bool) {
          const gutters = lines[index].querySelectorAll('td[class*=gutter]');
          if (gutters.length >= 2) {
            gutters[right ? 1 : 0].setAttribute('data-clickable', 'true');
          }
        }
      });
    }
  };

  unmarkClickable = (diffTableLines: NodeListOf<Element>) => {
    diffTableLines.forEach((node) => {
      const gutters = node.querySelectorAll('td[class*=gutter]');
      gutters.forEach((gutter) => gutter.removeAttribute('data-clickable'));
    });
  };

  // 标记 bug 行
  markBugLine = (
    diffTableLines: NodeListOf<Element>,
    highlightBugLinesCommitMap: Map<string, BugLineType> = new Map<
      string,
      BugLineType
    >(),
    commitId: string,
    right: boolean = true,
    lineOffset: number,
  ) => {
    if (!this.diffTableLines || this.diffTableLines.length === 0) {
      return;
    } else {
      const lines = getValidLines(diffTableLines, right);
      const currentBugLine = highlightBugLinesCommitMap.get(commitId);
      if (currentBugLine === undefined) return;
      const nums = currentBugLine?.lines
        ?.map((num) => num - lineOffset)
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
    }
  };

  unmarkBugLine = (diffTableLines: NodeListOf<Element>) => {
    diffTableLines.forEach((node) => {
      const gutters = node.querySelectorAll('td[class*=gutter]');
      gutters.forEach((gutter) => gutter.removeAttribute('data-bug-line'));
      const bugLines = node.querySelectorAll(
        'td[class*=content] > .bug-detail',
      );
      bugLines.forEach((line) => line.remove());
    });
  };

  // 标记已经追踪的行
  markRetrospected = (
    diffTableLines: NodeListOf<Element>,
    highlightRetrospectedLinesCommitMap: Map<string, number[]> = new Map<
      string,
      number[]
    >(),
    commitId: string,
    right: boolean = true,
    lineOffset: number,
  ) => {
    if (!this.diffTableLines || this.diffTableLines.length === 0) {
      return;
    } else {
      const lines = getValidLines(diffTableLines, right);
      const nums = highlightRetrospectedLinesCommitMap
        .get(commitId)
        ?.map((num) => num - lineOffset)
        .filter((num) => num >= 0 && num < lines.length);
      nums?.forEach((num) => {
        const gutters = lines[num].querySelectorAll('td[class*=gutter]');
        if (gutters.length >= 2) {
          gutters[right ? 1 : 0].setAttribute('data-retrospected', 'true');
        }
      });
    }
  };

  unmarkRetrospected = (diffTableLines: NodeListOf<Element>) => {
    diffTableLines.forEach((node) => {
      const gutters = node.querySelectorAll('td[class*=gutter]');
      gutters.forEach((gutter) => gutter.removeAttribute('data-retrospected'));
    });
  };

  getDiffTableLines = () => {
    return document.querySelectorAll(
      `#diff-viewer-${this.props.id} > table tr[class$=line]`,
    );
  };

  componentDidMount() {
    this.updateMarkedIcon();
  }

  componentDidUpdate() {
    this.updateMarkedIcon();
  }

  updateMarkedIcon = () => {
    this.diffTableLines = this.getDiffTableLines();
    // 清除之前的 className
    this.unmarkRetrospected(this.diffTableLines);
    this.unmarkBugLine(this.diffTableLines);
    this.unmarkClickable(this.diffTableLines);
    // 标记右
    this.markRetrospected(
      this.diffTableLines,
      this.props.highlightRetrospectedLinesCommitMap,
      this.props.right?.commitId ?? '',
      true,
      this.props.right?.lineBegin ?? 0,
      // 0,
    );
    this.markBugLine(
      this.diffTableLines,
      this.props.rightHighlightBugLinesCommitMap,
      this.props.right?.commitId ?? '',
      true,
      // this.props.right?.lineBegin ?? 0,
      0,
    );
    this.markClickable(this.diffTableLines, this.props.activeLines, true);
    // 标记左
    this.markRetrospected(
      this.diffTableLines,
      this.props.highlightRetrospectedLinesCommitMap,
      this.props.left?.commitId ?? '',
      false,
      this.props.left?.lineBegin ?? 0,
      // 0,
    );
    this.markBugLine(
      this.diffTableLines,
      this.props.leftHighlightBugLinesCommitMap,
      this.props.left?.commitId ?? '',
      false,
      // this.props.left?.lineBegin ?? 0,
      0,
    );
    this.markClickable(this.diffTableLines, this.props.activeLines, false);
  };

  renderTips = (
    tips: JSX.Element,
    lineNumber: number,
    right: boolean = true,
  ) => {
    if (!this.diffTableLines || this.diffTableLines.length === 0) return '';
    const number = lineNumber - 1;
    const gutterELements = getValidLines(this.diffTableLines, right)[
      number
    ].querySelectorAll('td[class*=gutter]');
    if (gutterELements.length < 2) {
      console.error('获取行号失败');
      return;
    }
    const target = gutterELements[right ? 1 : 0] as HTMLElement;
    target.setAttribute('style', 'position: relative');
    // 创建 TIPS
    const TIPS = document.createElement('div');
    TIPS.setAttribute('id', GUTTER_TIP_ID);
    TIPS.setAttribute('class', 'gutter-tips');
    TIPS.setAttribute('style', `left: ${target.offsetWidth}px`);
    // 添加 箭头底层
    const arrowLayerBottom = document.createElement('span');
    arrowLayerBottom.setAttribute('class', 'gutter-tips-arrow-bottom');
    TIPS.appendChild(arrowLayerBottom);
    // 添加 内容
    const detailMenu = document.createElement('detail-menu');
    detailMenu.setAttribute('id', GUTTER_TIP_CONTAINER);
    // detailMenu.setAttribute('style', 'width: max-content');
    TIPS.appendChild(detailMenu);
    // 添加 箭头顶层
    const arrowLayerTop = document.createElement('span');
    arrowLayerTop.setAttribute('class', 'gutter-tips-arrow-top');
    TIPS.appendChild(arrowLayerTop);

    target.appendChild(TIPS);
    // 渲染
    ReactDOM.render(tips, document.getElementById(GUTTER_TIP_CONTAINER));

    // 判断显示范围
    const detailMenuHeight = detailMenu.offsetHeight;
    const isTargetAtBottom =
      getViewableBlockBottomHeight(target) < detailMenuHeight;
    const moveHeight = detailMenuHeight - target.offsetHeight - 10;
    detailMenu.setAttribute(
      'style',
      isTargetAtBottom ? `top: -${moveHeight}px` : '',
    );
    detailMenu.addEventListener('click', (event: MouseEvent) => {
      event.stopPropagation();
    });
    const handler: EventListener = () => {
      document.getElementById(GUTTER_TIP_ID)?.remove();
      document.removeEventListener('click', handler);
    };
    document.addEventListener('click', handler);
  };

  render() {
    const { language, left, right, activeLines, styles } = this.props;
    const { highlightLines } = this.state;
    const leftTitle = left ? (
      <MemoCommitTitle {...left} level={this.props.level} />
    ) : undefined;
    const rightTitle = right ? (
      <MemoCommitTitle {...right} level={this.props.level} />
    ) : undefined;
    // 强制解决 '\n\n' 空行被删除问题
    // 强制解决 '\r\n' 被认为是两个换行的问题
    if (left?.body)
      left.body = left?.body.replace(/\n\n/g, '\n \n').replace(/\r\n/g, '\n');
    if (right?.body)
      right.body = right?.body.replace(/\n\n/g, '\n \n').replace(/\r\n/g, '\n');
    return (
      <div
        style={{ margin: '2em 0', padding: '0 13px', width: 'fit-content' }}
        id={`diff-viewer-${this.props.id}`}
      >
        <TipsModal />
        <ReactDiffViewer
          // linesOffset={this.props.right?.lineBegin}
          styles={styles}
          showDiffOnly={false}
          leftTitle={leftTitle}
          oldValue={left?.body}
          rightTitle={rightTitle}
          newValue={right?.body}
          compareMethod={DiffMethod.TRIMMED_LINES}
          renderContent={this.highlightSyntax(language)}
          highlightLines={highlightLines}
          onLineNumberClick={(current, event) => {
            event.stopPropagation();
            this.lineNumberCount++;
            const [pos, num] = (current as string).split('-');
            const position = pos === 'R' ? 'right' : 'left';
            if (activeLines && !activeLines[position][+num - 1]) {
              message.warning('该语句没有历史追溯数据，请重新选择');
            } else {
              const SHIFT = event.shiftKey;
              setTimeout(() => {
                // 单击
                if (this.lineNumberCount === 1) {
                  this.onLineNumberSelect(current, { shiftKey: SHIFT });
                }
                // 双击
                else if (this.lineNumberCount === 2) {
                  const offset = this.props[position]?.lineBegin ?? 1;
                  const begin = +num + offset - 1,
                    end = +num + offset - 1;
                  this.props
                    .onLineNumberDoubleClickToShowTip?.(
                      {
                        begin,
                        end,
                        code: this.getCodeContent(+num, position === 'right'),
                      },
                      (pos === 'L'
                        ? this.props.left?.commitId
                        : this.props.right?.commitId) ?? '',
                    )
                    .then((tips) => {
                      this.renderTips(tips, +num, position === 'right');
                    });
                }
                this.lineNumberCount = 0;
              }, 200);
            }
          }}
        />
      </div>
    );
  }
}

export default ITWDiffViewer;
