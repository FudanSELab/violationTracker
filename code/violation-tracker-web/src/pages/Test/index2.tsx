import DeveloperRadar from '@/components/graph/DeveloperRadar';
import { Typography, Card } from 'antd';
import listShow from './developer4project.json';

const Test2 = () => {
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
          let rate = (item.star / maxData[idx].star) * 5;
          switch (item.name) {
            case '新增代码':
              rate = rate > 1 || rate === 0 ? rate : 1;
              break;
            case '代码与他人重复率':
            case '代码与自己重复率':
              rate =
                item.star > 0.01 || rate === 0
                  ? rate
                  : item.star > 0.005
                  ? 1
                  : 0.5;
              break;
            case '删除自己代码':
            case '删除他人代码':
            case '修改自己代码':
            case '修改他人代码':
              rate =
                item.star > 1000 || rate === 0
                  ? rate
                  : item.star > 500
                  ? 1
                  : 0.5;
              break;
            default:
              break;
          }
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
    </>
  );
};

export default Test2;
