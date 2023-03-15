import { checkAccountName, checkEmail, getAccountByName, login } from './user';

beforeEach(() => {
  console.error = jest.fn();
});

describe('用户信息相关接口测试', () => {
  test('/user/account-name/check', async () => {
    const resp = await checkAccountName('admin');
    expect(resp).not.toEqual(null);
  }, 60000);

  test('/user/account/name', async () => {
    const resp = await getAccountByName({
      account_name: 'yuping',
    });
    expect(resp).not.toEqual(null);
  }, 60000);

  test('/user/login', async () => {
    const resp = await login({
      usernameOrEmail: 'admin',
      password: 'admin',
    });
    expect(resp).not.toEqual(null);
  }, 60000);

  test('/user/email/check', async () => {
    const resp = await checkEmail({
      email: 'test@test.com',
    });
    expect(resp).not.toEqual(null);
  }, 60000);
});

export {};
