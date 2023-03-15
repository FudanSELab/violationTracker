import * as React from 'react';
import ReactDiffViewer, {
  DiffMethod,
  ReactDiffViewerStylesOverride,
} from 'react-diff-viewer';
import Prism from 'prismjs';
import { Typography } from 'antd';

import './FileDiffViewer.less';
import ReactDOM from 'react-dom';
import { getViewableBlockBottomHeight } from '@/utils/hightAndWidth';
import { getFileCode } from '@/services/file';
// import { IssueItem } from '@/models/issueStore';
import { checkCodeLanguage } from '@/utils/check';
import BaseMarkPlugin from './plugin/BaseMarkPlugin';

interface IProps {
  id: string;
  language: string;
  repoUuid: string;
  left?: Partial<API.CommitCodeInfoTitle> & {
    commitId: string;
    filePath?: string;
  };
  right: Partial<API.CommitCodeInfoTitle> & {
    commitId: string;
    filePath?: string;
  };
  initialLines?: { start: number; end: number };
  defaultHighlightLines?: string[];
  style?: React.CSSProperties;
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
    filePath: string,
  ) => Promise<JSX.Element>;
  plugins?: BaseMarkPlugin<any>[];
  renderTitle?: (
    title: Partial<API.CommitCodeInfoTitle> & {
      commitId: string;
      filePath?: string;
    },
  ) => JSX.Element;
}
interface IState {
  highlightLines: string[];
  leftCode: string;
  rightCode: string;
  currLeft: {
    start: number;
    end: number;
    done: boolean;
  };
  currRight: {
    start: number;
    end: number;
    done: boolean;
  };
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
const PAGE_SIZE = 30;

class FileDiffViewer extends React.Component<IProps, IState> {
  diffTableLines?: NodeListOf<Element>;
  private lineNumberCount: number = 0;
  constructor(props: IProps) {
    super(props);
    const lines = props.initialLines ?? {
      start: 0,
      end: 0,
    };
    this.state = {
      highlightLines: props.defaultHighlightLines ?? [],
      leftCode: '',
      rightCode: '',
      currLeft: {
        start: lines.start,
        end: lines.end,
        done: false,
      },
      currRight: {
        start: lines.start,
        end: lines.end,
        done: false,
      },
    };
  }

  // 重新选择其他节点时 ↓
  UNSAFE_componentWillReceiveProps(nextProps: IProps) {
    if (nextProps.defaultHighlightLines !== this.props.defaultHighlightLines) {
      this.setState({
        highlightLines: nextProps.defaultHighlightLines ?? [],
      });
    }
    if (
      nextProps.left?.commitId !== this.props.left?.commitId ||
      nextProps.right?.commitId !== this.props.right?.commitId
    ) {
      console.log('UNSAFE');
      // currLeft 和 currRight不要重置，而是延用新更新的props
      const lineRange = this.props.initialLines ?? { start: 0, end: 0 };
      this.setState(
        {
          leftCode: '',
          currLeft: {
            start: lineRange.start,
            end: lineRange.end,
            done: false,
          },
          rightCode: '',
          currRight: {
            start: lineRange.start,
            end: lineRange.end,
            done: false,
          },
        },
        () => {
          this.queryCode(true, true).then(() => {
            this.updateFileCodeButton();
            this.updateMarkedIcon();
          });
        },
      );
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
      highlightLines.some((line: string) => line[0] !== direction)
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
          const offset = 1;
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
  getCodeContent = (lineNumber: number, right: boolean = true) => {
    if (!this.diffTableLines || this.diffTableLines.length === 0) return '';
    // 因为行号时真实行号，所以和getValidLines()返回值（String[]）的index范围不匹配
    const beginLine = right
      ? this.state.currRight.start
      : this.state.currLeft.start;
    // getValidLines返回值的index
    const index = lineNumber - beginLine - 1;
    const codeContentELements = getValidLines(this.diffTableLines, right)[
      index
    ].querySelectorAll('td[class*=content] > pre[class$=content-text]');
    if (codeContentELements.length < 2) {
      console.error('获取语句失败');
      return '';
    }
    return (codeContentELements[
      right ? 1 : 0
    ] as HTMLElement).innerText.replace(/\n/, '');
  };

  getDiffTableLines = () => {
    return document.querySelectorAll(
      `#file-diff-viewer-${this.props.id} > table tr[class$=line]`,
    );
  };

  queryCode = async (down: boolean = true, first: boolean = false) => {
    const { left, right, repoUuid } = this.props;
    const { currLeft, currRight, leftCode, rightCode } = this.state;
    const nextLeftLines = first
      ? currLeft
      : down
      ? {
          start: currLeft.done ? currLeft.end : currLeft.end,
          end: currLeft.done ? currLeft.end : currLeft.end + PAGE_SIZE,
        }
      : {
          start: currLeft.done
            ? currLeft.start
            : Math.max(0, currLeft.start - PAGE_SIZE),
          end: currLeft.done ? currLeft.start : currLeft.start,
        };
    console.log(nextLeftLines);
    const nextRightLines = first
      ? currRight
      : down
      ? {
          start: currRight.done ? currRight.end : currRight.end,
          end: currRight.done ? currRight.end : currRight.end + PAGE_SIZE,
        }
      : {
          start: currRight.done
            ? currRight.start
            : Math.max(0, currRight.start - PAGE_SIZE),
          end: currRight.done ? currRight.start : currRight.start,
        };
    let leftMoreCode = {
      data: '',
      line: Number.MAX_SAFE_INTEGER,
    };
    let rightMoreCode = {
      data: '',
      line: Number.MAX_SAFE_INTEGER,
    };
    if (
      left !== undefined &&
      left.filePath !== undefined &&
      !currLeft.done &&
      nextLeftLines.start !== nextLeftLines.end
    ) {
      const code = await getFileCode({
        repo_uuid: repoUuid,
        commit_id: left.commitId,
        file_path: left.filePath,
        start: nextLeftLines.start,
        end: nextLeftLines.end,
      });
      if (typeof code !== 'boolean' && code !== null) {
        leftMoreCode = code;
      }
    }
    if (
      right.filePath !== undefined &&
      !currRight.done &&
      nextRightLines.start !== nextRightLines.end
    ) {
      const code = await getFileCode({
        repo_uuid: repoUuid,
        commit_id: right.commitId,
        file_path: right.filePath,
        start: nextRightLines.start,
        end: nextRightLines.end,
      });
      if (typeof code !== 'boolean' && code !== null) {
        rightMoreCode = code;
      }
    }
    this.setState({
      leftCode: down
        ? leftCode + leftMoreCode.data
        : leftMoreCode.data + leftCode,
      currLeft: {
        start: down ? currLeft.start : nextLeftLines.start,
        end: down
          ? Math.min(nextLeftLines.end, +leftMoreCode.line)
          : currLeft.end,
        done: down
          ? nextLeftLines.end >= +leftMoreCode.line
          : // : nextLeftLines.start === 0,
            // 这里不应该是文件到头不显示范围了，而是沿用之前的 done
            this.state.currLeft.done,
      },
      rightCode: down
        ? rightCode + rightMoreCode.data
        : rightMoreCode.data + rightCode,
      currRight: {
        start: down ? currRight.start : nextRightLines.start,
        end: down
          ? Math.min(nextRightLines.end, +rightMoreCode.line)
          : currRight.end,
        done: down
          ? nextRightLines.end >= +rightMoreCode.line
          : // : nextRightLines.start === 0,
            // 这里不应该是文件到头不显示范围了，而是沿用之前的 done
            this.state.currRight.done,
      },
    });
  };

  componentDidMount() {
    const { left, right, repoUuid } = this.props;
    const { currLeft, currRight } = this.state;
    // console.log(this.props.initialLines);
    // 未初始化代码范围
    if (currLeft.start === currLeft.end && currRight.start === currRight.end) {
      this.queryCode().then(() => {
        this.updateFileCodeButton();
        this.updateMarkedIcon();
      });
    } else {
      Promise.all([
        left === undefined || left.filePath === undefined
          ? Promise.resolve(null)
          : getFileCode({
              repo_uuid: repoUuid,
              commit_id: left.commitId,
              file_path: left.filePath,
              start: currLeft.start,
              end: currLeft.end,
            }),
        right.filePath === undefined
          ? Promise.resolve(null)
          : getFileCode({
              repo_uuid: repoUuid,
              commit_id: right.commitId,
              file_path: right.filePath,
              start: currRight.start,
              end: currRight.end,
            }),
      ]).then(([leftResp, rightResp]) => {
        let leftMoreCode = {
          data: '',
          line: Number.MAX_SAFE_INTEGER,
        };
        let rightMoreCode = {
          data: '',
          line: Number.MAX_SAFE_INTEGER,
        };
        if (typeof leftResp !== 'boolean' && leftResp !== null) {
          leftMoreCode = leftResp;
        }
        if (typeof rightResp !== 'boolean' && rightResp !== null) {
          rightMoreCode = rightResp;
        }
        this.setState({
          leftCode: leftMoreCode.data,
          currLeft: {
            start: currLeft.start,
            end: Math.min(currLeft.end, +leftMoreCode.line),
            done: currLeft.end >= +leftMoreCode.line,
          },
          rightCode: rightMoreCode.data,
          currRight: {
            start: currRight.start,
            end: Math.min(currRight.end, +rightMoreCode.line),
            done: currRight.end >= +rightMoreCode.line,
          },
        });
      });
    }
  }

  componentDidUpdate() {
    this.updateFileCodeButton();
    this.updateMarkedIcon();
  }

  updateMarkedIcon = () => {
    const { plugins } = this.props;
    this.diffTableLines = this.getDiffTableLines();
    if (this.diffTableLines !== undefined) {
      const rightLines = getValidLines(this.diffTableLines, true);
      const leftLines = getValidLines(this.diffTableLines, false);
      plugins?.forEach((plugin) => {
        // 清除之前的 className
        plugin.unmark(this.diffTableLines as NodeListOf<Element>);
        // 标记右
        plugin.mark(rightLines, true, {
          lineOffset: this.state.currRight.start,
        });
        // 标记左
        plugin.mark(leftLines, false, {
          lineOffset: this.state.currLeft.start,
        });
      });
    }
  };

  updateFileCodeButton = () => {
    const { currLeft, currRight } = this.state;
    const table = document.querySelector(
      `#file-diff-viewer-${this.props.id} > table > tbody`,
    );
    if (table === null) return;
    table.querySelector('[data-before]')?.remove();
    table.querySelector('[data-after]')?.remove();
    const tableLines = table.children;
    if (tableLines && tableLines?.length > 1) {
      const beforeLine = document.createElement('tr');
      beforeLine.setAttribute('data-before', 'true');
      const afterLine = document.createElement('tr');
      afterLine.setAttribute('data-after', 'true');
      // 左边
      const beforeLButton = document.createElement('td');
      beforeLButton.setAttribute('colspan', '3');
      beforeLButton.setAttribute('data-before-left', 'true');
      beforeLButton.innerText = `... @@@ s${currLeft.start + 1} | e${
        currLeft.end
      } @@@ ...`;
      beforeLButton.onclick = () => {
        this.queryCode(false);
      };
      beforeLine.append(beforeLButton);
      if (!currLeft.done) {
        const afterLButton = document.createElement('td');
        afterLButton.setAttribute('colspan', '3');
        afterLButton.setAttribute('data-after-left', 'true');
        afterLButton.innerText = `... @@@ s${currLeft.start + 1} | e${
          currLeft.end
        } @@@ ...`;
        afterLButton.onclick = () => {
          this.queryCode();
        };
        afterLine.append(afterLButton);
      }
      // 右边
      const beforeRButton = document.createElement('td');
      beforeRButton.setAttribute('colspan', '3');
      beforeRButton.setAttribute('data-before-right', 'true');
      beforeRButton.innerText = `... @@@ s${currRight.start + 1} | e${
        currRight.end
      } @@@ ...`;
      beforeRButton.onclick = () => {
        this.queryCode(false);
      };
      beforeLine.append(beforeRButton);
      if (!currRight.done) {
        const afterRButton = document.createElement('td');
        afterRButton.setAttribute('colspan', '3');
        afterRButton.setAttribute('data-after-right', 'true');
        afterRButton.innerText = `... @@@ s${currRight.start + 1} | e${
          currRight.end
        } @@@ ...`;
        afterRButton.onclick = () => {
          this.queryCode();
        };
        afterLine.append(afterRButton);
      }
      table.insertBefore(beforeLine, tableLines[1]);
      table.appendChild(afterLine);
    }
  };

  renderTips = (
    tips: JSX.Element,
    lineNumber: number,
    right: boolean = true,
  ) => {
    if (!this.diffTableLines || this.diffTableLines.length === 0) return '';
    // 因为行号时真实行号，所以和getValidLines()返回值（String[]）的index范围不匹配
    const beginLine = right
      ? this.state.currRight.start
      : this.state.currLeft.start;
    // getValidLines返回值的index
    const index = lineNumber - beginLine - 1;
    const gutterELements = getValidLines(this.diffTableLines, right)[
      index
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

  defaultRenderTitle = (title: { commitId: string; filePath?: string }) => {
    return (
      <div>
        <Typography.Text code style={{ whiteSpace: 'pre' }}>
          {title.commitId}
        </Typography.Text>
      </div>
    );
  };

  render() {
    const {
      language,
      left,
      right,
      styles,
      style,
      renderTitle = this.defaultRenderTitle,
    } = this.props;
    const { highlightLines, leftCode, rightCode } = this.state;
    // 强制解决 '\n\n' 空行被删除问题
    // 强制解决 '\r\n' 被认为是两个换行的问题
    const safeLeftCode = leftCode
      .replace(/\n\n/g, '\n \n')
      .replace(/\r\n/g, '\n');
    const safeRightCode = rightCode
      .replace(/\n\n/g, '\n \n')
      .replace(/\r\n/g, '\n');
    const leftTitle = left === undefined ? <></> : renderTitle(left);
    const rightTitle = renderTitle(right);
    return (
      <div
        style={{
          ...style,
        }}
        id={`file-diff-viewer-${this.props.id}`}
      >
        <div className="file-change">
          <Typography.Text className="from" italic>
            {left === undefined ? '未知文件路径' : left.filePath}
          </Typography.Text>
          <br />
          <Typography.Text className="to" italic>
            {right.filePath}
          </Typography.Text>
        </div>
        <ReactDiffViewer
          linesOffset={this.state.currRight.start}
          styles={styles}
          showDiffOnly={false}
          leftTitle={leftTitle}
          oldValue={safeLeftCode}
          rightTitle={rightTitle}
          newValue={safeRightCode}
          compareMethod={DiffMethod.TRIMMED_LINES}
          renderContent={this.highlightSyntax(language)}
          highlightLines={highlightLines}
          onLineNumberClick={(current, event) => {
            event.stopPropagation();
            this.lineNumberCount++;
            const [pos, num] = (current as string).split('-');
            const position = pos === 'R' ? 'right' : 'left';
            // if (activeLines && !activeLines[position][+num - 1]) {
            //   message.warning('该语句无效，请重新选择');
            // } else {
            const SHIFT = event.shiftKey;
            setTimeout(() => {
              // 单击
              if (this.lineNumberCount === 1) {
                this.onLineNumberSelect(current, { shiftKey: SHIFT });
              }
              // 双击
              else if (this.lineNumberCount === 2) {
                const offset = 1;
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
                    (pos === 'L'
                      ? this.props.left?.filePath
                      : this.props.right?.filePath) ?? '',
                  )
                  .then((tips) => {
                    this.renderTips(tips, +num, position === 'right');
                  });
              }
              this.lineNumberCount = 0;
            }, 200);
            // }
          }}
        />
      </div>
    );
  }
}

export default FileDiffViewer;
