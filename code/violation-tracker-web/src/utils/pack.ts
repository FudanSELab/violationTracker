//@ts-nocheck
export function packObject(data: Object) {
  return Object.keys(data)
    .filter((key) =>
      Array.isArray(data[key])
        ? data[key].length > 0 && data[key][0] !== ''
        : data[key] !== '' && data[key] !== undefined && data[key] !== null,
    )
    .reduce((acc, key) => {
      acc[key] = data[key];
      return acc;
    }, {});
}
