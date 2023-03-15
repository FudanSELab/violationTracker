export function isNumber(obj: Object) {
  return obj === +obj;
}
/**
 * 只允许英文字母、数字、下划线、英文句号、以及中划线组成
 * 举例：zhangsan-001@gmail.com
 * @param str
 */
export function isEmail(str: string) {
  return /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/.test(str);
}

export function getBrowserType() {
  var userAgent = navigator.userAgent; //取得浏览器的userAgent字符串
  var browser = 'unknown';
  if (userAgent.includes('IE')) {
    //字符串含有IE字段，表明是IE浏览器
    browser = 'IE';
  } else if (userAgent.includes('Firefox')) {
    //字符串含有Firefox字段，表明是火狐浏览器
    browser = 'Firefox';
  } else if (userAgent.includes('OPR')) {
    //Opera
    browser = 'Opera';
  } else if (userAgent.includes('Chrome')) {
    //Chrome
    browser = 'Chrome';
  } else if (userAgent.includes('Safari')) {
    //Safari
    browser = 'Safari';
  } else if (userAgent.includes('Trident')) {
    //IE内核
    browser = 'IE 11';
  }
  return browser;
}

export function checkCodeLanguage(lang: string): boolean {
  const supportLang = ['javascript', 'css', 'java', 'cpp'];
  return supportLang.includes(lang);
}
