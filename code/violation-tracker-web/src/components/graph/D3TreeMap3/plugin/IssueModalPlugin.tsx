import { Button, Divider, Typography } from 'antd';
import React, { useCallback, useImperativeHandle, useState } from 'react';
import { FileDetailClickData } from '..';
import { BasePluginProps } from './BasePlugin';

import './styles.less';

// const ID = 'treemap-3-base-plugin';
const IssueModal: React.FC<{
  data: FileDetailClickData;
}> = ({ data }) => {
  const [show, setShow] = useState<boolean>(false);
  const [filePath, setFilePath] = useState<string>('暂无数据');
  const [issueList, setIssueList] = useState<string[]>([]);
  const onShow = useCallback((data: FileDetailClickData) => {
    // console.log(svgLayer, data);
    setFilePath(data.filePath);
    setIssueList([
      '"@Deprecated" code marked for removal should never be used',
      '不应该在程序中使用 @Deprecated 标注的接口、类和方法',
    ]);
    setShow((cur) => !cur);
    // const clickBias = 2;
    // document
    //   .getElementById(ID)
    //   ?.setAttribute(
    //     'style',
    //     `display: inline-block; position: absolute; left: ${
    //       svgLayer.layerX - clickBias
    //     }px; top: ${svgLayer.layerY - clickBias}px`,
    //   );
  }, []);
  return (
    <>
      <div
        onClick={(e) => {
          // console.log(e);
          onShow(data);
        }}
        className="issue-tag"
      >
        <span>+</span>
      </div>
      {show && (
        <div
          className="treemap-plugin"
          style={{ position: 'relative', minWidth: 400, margin: '2px 0' }}
        >
          <header
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h3 style={{ margin: 0 }}>缺陷洞察</h3>
            <Button
              size="small"
              type="text"
              style={{ marginRight: -5 }}
              onClick={() => setShow(false)}
            >
              x
            </Button>
          </header>
          <main>
            <Typography.Text code>{filePath}</Typography.Text>
            <ul style={{ paddingInlineStart: 17 }}>
              {Array.isArray(issueList) &&
                issueList.map((issue, index) => {
                  return (
                    <li key={index}>
                      <a href="#test">#{index}</a>
                      <Divider type="vertical" />
                      <span>
                        1{index}2-1{index}6
                      </span>
                      <p>{issue}</p>
                    </li>
                  );
                })}
            </ul>
          </main>
        </div>
      )}
    </>
  );
};

const IssueModalPlugin: React.ForwardRefExoticComponent<BasePluginProps> = React.forwardRef(
  (props, ref) => {
    // const hidden = useCallback(() => {
    //   document.getElementById(ID)?.setAttribute('style', 'display: none');
    // }, []);

    /**
     * 解决父组件获取子组件的数据或者调用子组件的里声明的函数。
     */
    useImperativeHandle(
      ref,
      () => {
        return {
          trigger: () => props.trigger,
          tag: (
            data: FileDetailClickData,
            // relativeSvgPos: { x: number; y: number },
            key: string,
          ) => <IssueModal key={key} data={data} />,
          show: () => {},
          hidden: () => {},
        };
      },
      [props.trigger],
    );
    // useLayoutEffect(() => {
    //   hidden();
    // }, [hidden]);
    return <div id="issue-modal-plugin" />;
  },
);

export default IssueModalPlugin;
