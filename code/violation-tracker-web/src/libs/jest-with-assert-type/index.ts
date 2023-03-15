// toBeType(received, expected) {
//   const pass = true;
//   if (pass) {
//     return {
//       message: () => `expected ${received} to be ${expected}`,
//       pass: true,
//     };
//   } else {
//     return {
//       message: () => `expected ${received} not to be ${expected}`,
//       pass: false,
//     };
//   }
// },
export const toBeWithinRange = (
  received: number,
  floor: number,
  ceiling: number,
) => {
  const pass = received >= floor && received <= ceiling;
  if (pass) {
    return {
      message: () =>
        `expected ${received} not to be within range ${floor} - ${ceiling}`,
      pass: true,
    };
  } else {
    return {
      message: () =>
        `expected ${received} to be within range ${floor} - ${ceiling}`,
      pass: false,
    };
  }
};
