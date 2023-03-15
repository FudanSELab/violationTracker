import moment from 'moment';

/**
 * 传入数值num，返回最近的num个月，如传入1，则返回最近1个月的duration
 * @param num
 * @returns {Array}
 */
export function getDateforLastNMonth(num: number) {
  return [
    moment().subtract(num, 'months').format('YYYY-MM-DD'),
    getCurrentDate(),
  ];
}

/**
 * 获取最近一周
 * @returns {Array}
 */
export function getCurrentDateForLastWeek() {
  return [moment().subtract(1, 'weeks').format('YYYY-MM-DD'), getCurrentDate()];
}

/**
 * 獲取最近n年的duration
 * @param n
 * @returns {Array}
 */
export function getDateForLastNYear(n: number) {
  return [moment().subtract(n, 'years').format('YYYY-MM-DD'), getCurrentDate()];
}

export function getCurrentDate() {
  return moment().format('YYYY-MM-DD');
}

export function getCurrentDateRange() {
  return [moment().subtract(1, 'days').format('YYYY-MM-DD'), getCurrentDate()];
}

export function getYesterdayDate() {
  return [
    moment().subtract(2, 'days').format('YYYY-MM-DD'),
    moment().subtract(1, 'days').format('YYYY-MM-DD'),
  ];
}
