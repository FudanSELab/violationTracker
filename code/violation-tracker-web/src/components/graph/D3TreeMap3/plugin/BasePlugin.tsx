// import { LineRange } from '@/utils/line-range';
import { Button } from 'antd';
import React, {
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
} from 'react';
import { FileDetailClickData } from '..';

import './styles.less';

type PluginTiggerType = 'onclick' | 'onmove';

export interface BasePluginProps {
  trigger: PluginTiggerType;
}

export interface PluginRefProps {
  trigger: () => PluginTiggerType;
  tag: (
    data: FileDetailClickData,
    // relativeSvgPos: { x: number; y: number },
    key: string,
  ) => JSX.Element | undefined;
  show: (
    svgLayer: {
      layerX: number;
      layerY: number;
    },
    data: FileDetailClickData,
  ) => void;
  hidden: () => void;
}

const ID = 'treemap-3-base-plugin';

const BasePlugin: React.ForwardRefExoticComponent<BasePluginProps> = React.forwardRef(
  (props, ref) => {
    const hidden = useCallback(() => {
      document.getElementById(ID)?.setAttribute('style', 'display: none');
    }, []);
    /**
     * 解决父组件获取子组件的数据或者调用子组件的里声明的函数。
     */
    useImperativeHandle(
      ref,
      () => ({
        trigger: () => props.trigger,
        tag: () => undefined,
        show: (e: MouseEvent) => {
          // setShow(true);
          const clickBias = 2;
          const event = e as any;
          document
            .getElementById(ID)
            ?.setAttribute(
              'style',
              `display: inline-block; position: absolute; left: ${
                event.layerX - clickBias
              }px; top: ${event.layerY - clickBias}px`,
            );
        },
        hidden,
      }),
      [hidden, props.trigger],
    );
    useLayoutEffect(() => {
      hidden();
    }, [hidden]);
    return (
      <>
        <div id={ID} className="treemap-plugin">
          {props.children ?? 'BasePlugin'}
          <Button
            size="small"
            type="text"
            onClick={hidden}
            style={{ marginRight: -5 }}
          >
            x
          </Button>
        </div>
      </>
    );
  },
);

export default BasePlugin;
