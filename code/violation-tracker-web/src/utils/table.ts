export const isArrayAndGetByIndex = (arr: any, index: number) =>
  Array.isArray(arr) ? arr[index] : undefined;

export function downloadBlob(blob: Blob, filename?: string) {
  if (!window.URL.createObjectURL) return;
  const downloadElement = document.createElement('a');
  // 创建下载的链接
  const href = window.URL.createObjectURL(blob);
  downloadElement.href = href;
  // 解码
  if (filename)
    downloadElement.download = decodeURI(
      filename.includes("UTF-8''") ? filename.split("UTF-8''")[1] : filename,
    );
  document.body.appendChild(downloadElement);
  downloadElement.click();
  document.body.removeChild(downloadElement);
  // 释放掉blob对象
  window.URL.revokeObjectURL(href);
}

// 过滤repo可选项函数
export const filterRepoOption = (
  input: string,
  option?: { label: string; value: string },
) => {
  return (option?.label ?? '').toLowerCase().includes(input.toLowerCase());
};

export const mapRepoItem = ({ name, repo_id }: API.RepoItem, index: number) =>
  repo_id === null
    ? {
        label: `${name}(代码库为空)`,
        value: `${name}-${index}`,
      }
    : {
        label: name,
        value: repo_id,
      };

export const mapRepositoryItem = (
  { repoName, repoUuid }: API.RepositoryItem,
  index: number,
) =>
  repoUuid === null
    ? {
        label: `${repoName}(代码库为空)`,
        value: `${repoName}-${index}`,
      }
    : {
        label: repoName,
        value: repoUuid,
      };
