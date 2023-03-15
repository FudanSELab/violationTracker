import React, { useCallback, useEffect, useState } from 'react';
import { createPatch } from 'diff';
import { html, parse } from 'diff2html';
import { Diff2HtmlUI } from 'diff2html/lib/ui/js/diff2html-ui';
// import yaml from 'js-yaml';
import {
  DiffFile,
  LineMatchingType,
  OutputFormatType,
} from 'diff2html/lib/types';
import 'highlight.js/styles/github.css';
import 'diff2html/bundles/css/diff2html.min.css';

// diffDataList 对比文件列表数据 [ {...diffDataItem} ]
// diffDataItem :
// {
//   prevData: any(string、json), // 旧数据
//   newData: any(string、json),  // 新数据
//   isYaml?: boolean,            // 是否yaml文件
//   isJson?: boolean,            // 是否json
//   fileName?: string,           // 文件名
//   oldHeader?: string,          // 重命名，旧文件名
//   newHeader?: string           // 重命名，新文件名
// },
// outputFormat diff格式，line-by-line || side-by-side
// isUseUi 是否使用Diff2HtmlUI
// id Diff2HtmlUI 挂载html的id，多实例的情况下，各个实例需要唯一id，防止页面冲突
// fileListToggle Diff2HtmlUI 文件目录概要是否要隐藏，true显示，false隐藏

type DiffDataItem = {
  prevData: string; // 旧数据
  newData: string; // 新数据
  // isYaml?: boolean; // 是否yaml文件
  isJson?: boolean; // 是否json
  fileName?: string; // 文件名
  oldHeader?: string; // 重命名，旧文件名
  newHeader?: string; // 重命名，新文件名
};

interface CodeDiffProps {
  diffDataList: DiffDataItem[];
  outputFormat: OutputFormatType;
  isUseUi?: boolean;
  id?: string;
  fileListToggle?: boolean;
}

const DEFAULT_ID = 'code-diff-ui';

const CodeDiff = ({
  diffDataList,
  outputFormat,
  isUseUi,
  id,
  fileListToggle,
}: CodeDiffProps) => {
  const [diffData, setDiffData] = useState('');

  const createDiffData = useCallback(
    (fileList: DiffDataItem[]) => {
      let diffJsonList: DiffFile[] = [];
      fileList.forEach((item) => {
        let {
          fileName,
          oldHeader,
          newHeader,
          prevData,
          newData,
          isJson,
          // isYaml,
        } = item;
        let oldString = prevData || '';
        let newString = newData || '';
        // 特定需求处理
        // if (isYaml) {
        // 将json转化为yaml格式
        // oldString = yaml.dump(prevData);
        // newString = yaml.dump(newData);
        // } else
        if (isJson) {
          // 格式化json
          oldString = JSON.stringify(prevData, null, 2);
          newString = JSON.stringify(newData, null, 2);
        }
        // 对比差异
        const diffStr = createPatch(
          fileName || '',
          oldString,
          newString,
          oldHeader || '',
          newHeader || '',
          { context: 99999 },
        );
        // 差异json化
        const diffJson = parse(diffStr);
        diffJsonList.push(diffJson[0]);
      });
      if (isUseUi ?? false) {
        // 使用diff2html-ui
        const targetElement = document.getElementById(id ?? DEFAULT_ID);
        const configuration = {
          drawFileList: true,
          matching: 'lines' as LineMatchingType,
          highlight: true,
          outputFormat,
        };
        if (targetElement !== null) {
          const diff2htmlUi = new Diff2HtmlUI(
            targetElement,
            diffJsonList,
            configuration,
          );
          diff2htmlUi.draw(); //绘制页面
          diff2htmlUi.highlightCode(); // 高亮数据
          diff2htmlUi.fileListToggle(fileListToggle ?? false); // 是否折叠概要
        }
      } else {
        // 使用html方法
        const diffHtml = html(diffJsonList, {
          drawFileList: true,
          matching: 'lines',
          // showFiles: true,
          outputFormat,
        });
        setDiffData(diffHtml);
      }
    },
    [fileListToggle, id, isUseUi, outputFormat],
  );

  useEffect(() => {
    createDiffData(diffDataList);
  }, [createDiffData, diffDataList]);

  return isUseUi ? (
    <div id={id ?? DEFAULT_ID} />
  ) : (
    <div id="code-diff" dangerouslySetInnerHTML={{ __html: diffData }} />
  );
};

export default CodeDiff;
