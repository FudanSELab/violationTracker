import moment, { Moment } from 'moment';

export function range(start: number, end: number) {
  const result = [];
  for (let i = start; i < end; i++) {
    result.push(i);
  }
  return result;
}

export function getTimeBeforeDays(time: string, days: number): string {
  const ONE_DAY_NUM = 86400000;
  return moment(+moment(time) - days * ONE_DAY_NUM).format('YYYY-MM-DD');
}

export function disabledDate(current: Moment) {
  // Can not select days before today and today
  return current && current > moment().endOf('day');
}

export function disabledRangeTime(_: any, type: string) {
  if (type === 'start') {
    return {
      disabledHours: () => range(0, 60).splice(4, 20),
      disabledMinutes: () => range(30, 60),
      disabledSeconds: () => [55, 56],
    };
  }
  return {
    disabledHours: () => range(0, 60).splice(20, 4),
    disabledMinutes: () => range(0, 31),
    disabledSeconds: () => [55, 56],
  };
}
