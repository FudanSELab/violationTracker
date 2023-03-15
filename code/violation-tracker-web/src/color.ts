import { str2number } from './utils/conversion';

function getColor(type: string) {
  // eslint-disable-next-line default-case
  switch (type) {
    case 'Insert':
      return 'rgb(255, 185, 15)';
    case 'Delete':
      return 'rgb(255, 185, 15)';
    case 'Change':
      return 'rgb(10, 49, 255)';
    case 'Move':
      return 'rgb(255, 185, 15)';
    case 'Bug':
      return 'rgb(220, 20, 60)';
    case 'Change.Move':
      return 'rgb(10, 49, 255)';
    case 'Eliminated':
      return 'rgb(144, 238, 144)';
  }
  return 'red';
}

export function changeStatementHistoryColor(type: string) {
  // eslint-disable-next-line default-case
  switch (type) {
    case 'DELETE':
      return '#e02c46';
    case 'ADD':
      return '#1e924c';
    case 'CHANGED':
    case 'CHANGE':
      return '#298bd8';
    case 'SELF_CHANGE':
      return '#47a9d1';
    case 'NOT_CHANGED':
      return '#e5e5e5';
    case 'MOVE':
      return '#f2cc8f';
    case 'CHANGE_LINE':
      return '#47a9d1';
    default:
      return 'black';
  }
}

export function changeBackgroundColor(type: string) {
  // eslint-disable-next-line default-case
  switch (type) {
    case 'DELETE':
      return '#da627d';
    case 'ADD':
      return '#8ECCB7';
    case 'CHANGE':
      return '#268ECF';
    case 'SIGNATURE_CHANGE':
      return '#6daedb';
    case 'NOT_CHANGED':
      return '#B8B8B8';
    case 'MOVE':
      return '#f2cc8f';
    case 'CHANGE_LINE':
      return '#268ECF';
  }
}

export function getRandomColor() {
  const maxNum = 5;
  const minNum = 0;
  const num = Math.random() * (maxNum - minNum + 1) + minNum;
  const colors = [
    '#118ab2',
    '#489fb5',
    '#68d8d6',
    '#3d5a80',
    '#284b63',
    '#284b93',
  ];
  return colors[num];
}

export function getFixedColorByString(str: string) {
  return COLORLIST[str2number(str) % COLORLIST.length];
}

export const COLORLIST = [
  '#f56a00',
  '#7265e6',
  '#ffbf00',
  '#00a2ae',
  '#118ab2',
  '#489fb5',
  '#68d8d6',
  '#3d5a80',
  '#284b63',
  '#284b93',
];

export default getColor;
