import DeveloperRadar from '@/components/graph/DeveloperRadar';
import { Typography, Card } from 'antd';
import listShow from './developer4project.json';

const Test = () => {
  listShow.forEach(({ developers }) => {
    const maxData = developers.reduce((acc, { data }) => {
      if (acc.length === 0) {
        acc = JSON.parse(JSON.stringify(data));
      } else {
        acc.forEach(({ star }, index, arr) => {
          if (star < data[index].star) {
            arr[index].star = data[index].star;
          }
        });
      }
      return acc;
    }, [] as any[]);
    developers
      .filter(({ show }) => show)
      .forEach(({ data }, index, arr) => {
        arr[index].data = data.map((item, idx) => {
          const rate = (item.star / maxData[idx].star) * 5;
          return {
            ...item,
            star: +(Number.isNaN(rate) ? 0 : rate).toFixed(2),
          };
        });
      });
  });
  return (
    <>
      {listShow.map(({ sheetName, developers }) => (
        <>
          <h2>{sheetName}</h2>
          <div style={{ display: 'flex' }}>
            {developers
              .filter(({ show }) => show)
              .map(({ name, data }, index) => {
                return (
                  <Card style={{ margin: '10px' }} key={`${name}-${index}`}>
                    <DeveloperRadar data={data} />
                    <Typography.Text style={{ textAlign: 'center' }}>
                      {name}
                    </Typography.Text>
                  </Card>
                );
              })}
          </div>
        </>
      ))}
      <Card style={{ margin: '10px' }}>
        <DeveloperRadar
          data={[
            // { name: '自己引入缺陷消除', star: 0 },
            // { name: '他人引入缺陷消除', star: 0 },
            // { name: '缺陷引入', star: 0 },
            // { name: '代码与他人重复率', star: 0.5 },
            // { name: '代码与自己重复率', star: 4.67 },
            // { name: '代码存活', star: 2.35 },
            // { name: '删除自己代码', star: 2 },
            // { name: '删除他人代码', star: 2.5 },
            // { name: '修改自己代码', star: 1 },
            // { name: '修改他人代码', star: 1.5 },
            // { name: '新增代码', star: 4 },
            // { name: '文件创建数', star: 3.69 },
            { name: '留存缺陷数', star: 3 },
            { name: '新增克隆率', star: 4 },
            { name: '文件稳定性', star: 3.3 },
            { name: '提交规范性', star: 4.6 },
            { name: '圈复杂度变化', star: 2 },
            { name: '新增代码行', star: 4 },
            { name: '超大文件数', star: 1 },
          ]}
        />
        <Typography.Text style={{ textAlign: 'center' }}>
          lidong
        </Typography.Text>
      </Card>
    </>
  );
};

export default Test;
