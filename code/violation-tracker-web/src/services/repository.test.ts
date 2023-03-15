beforeEach(() => {
  console.error = jest.fn();
});

describe('代码库(repository)相关接口测试', () => {
  // test('/repository/project', async () => {
  //   const resp = await putProjectOfRepository({
  //     page: 1,
  //     ps: 10,
  //   });
  //   expect(resp).not.toEqual(null);
  // }, 60000);
  // test('/repository/recycle', async () => {
  //   const resp = await updateRepositoryRecycleStatus({
  //     page: 1,
  //     ps: 10,
  //   });
  //   expect(resp).not.toEqual(null);
  // }, 60000);
  // test('/repo/project', async () => {
  //   const resp = await deleteRepoFromRecycleByRepoUuidHard({
  //     page: 1,
  //     ps: 10,
  //   });
  //   expect(resp).not.toEqual(null);
  // }, 60000);
});

export {};
