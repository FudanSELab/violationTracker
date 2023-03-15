import { Menu } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import * as React from 'react';
import { ellipsisText } from '@/utils/utils';
import transformIssueName from '@/utils/transformIssueName';

const { SubMenu } = Menu;

interface IProps {
  options: API.SideMenuItem[];
  initialSelectedKeys?: string;
  type?: string;
  onMenuItemChange?: (key: string) => void;
}

const SideMenu: React.FC<IProps> = ({
  options,
  initialSelectedKeys,
  onMenuItemChange,
}) => {
  const [openKeys, setOpenKeys] = useState<string[]>();
  const [selectedKeys, setSelectedKeys] = useState<string>(
    initialSelectedKeys ?? '',
  );

  const onOpenChange = useCallback(
    (key: string) => {
      // const latestOpenKey = keys.find((key) => !openKeys.includes(key)) as string;
      // setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
      if (openKeys?.includes(key)) {
        setOpenKeys([]);
      } else {
        setOpenKeys([key]);
      }
    },
    [openKeys],
  );
  const onMenuItemGroupClick = useCallback(
    (language: string, name: string) => {
      if (openKeys?.includes(name)) {
        setOpenKeys([language]);
      } else {
        setOpenKeys([language, name]);
      }
    },
    [openKeys],
  );
  const onMenuItemClick = useCallback(
    (key: string | number) => {
      if (key === selectedKeys) {
        setSelectedKeys('');
        if (onMenuItemChange) onMenuItemChange('');
        return;
      }
      setSelectedKeys(key as string);
      if (onMenuItemChange) onMenuItemChange(key as string);
    },
    [onMenuItemChange, selectedKeys],
  );
  // 刷新保持数据
  useEffect(() => {
    setSelectedKeys(initialSelectedKeys ?? '');
    let openLang = options.length > 0 ? options[0].language : '';
    let openName =
      options.length > 0 && options[0]?.categories.length > 0
        ? options[0].categories[0].name
        : '';
    options.forEach(({ language, categories }) => {
      categories.forEach(({ name, types }) => {
        if (types.map(({ type }) => type).includes(initialSelectedKeys ?? '')) {
          openLang = language;
          openName = name;
        }
      });
    });
    setOpenKeys([openLang, openName]);
  }, [initialSelectedKeys, options]);
  // useEffect(() => {
  //   setOpenKeys([
  //     options.find(({ categories }) =>
  //       categories.some(({ types }) =>
  //         types.some(({ type }) => type === initialSelectedKeys),
  //       ),
  //     )?.language ??
  //       options[0]?.language ??
  //       '',
  //   ]);
  // }, [initialSelectedKeys, options]);
  return (
    <>
      {/* {JSON.stringify(openKeys)} */}
      <Menu mode="inline" openKeys={openKeys} selectedKeys={[selectedKeys]}>
        {options.map(({ language, categories }) => (
          <SubMenu
            key={language}
            onTitleClick={() => onOpenChange(language)}
            title={
              <span>
                <span>{language}</span>
              </span>
            }
          >
            {categories.map(({ name, total, types }) => (
              <SubMenu
                key={name}
                onTitleClick={() => onMenuItemGroupClick(language, name)}
                title={
                  <span>
                    {name} ({total})
                  </span>
                }
              >
                {types.map(({ type, count }) => (
                  <Menu.Item
                    key={`${name}__${type}`}
                    onClick={({ key }) => onMenuItemClick(key.split('__')[1])}
                  >
                    {ellipsisText(transformIssueName(type), '150px')} ({count})
                  </Menu.Item>
                ))}
              </SubMenu>
            ))}
          </SubMenu>
        ))}
      </Menu>
    </>
  );
};

export default SideMenu;
