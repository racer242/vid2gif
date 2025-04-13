export const asyncSleep = (duration) => {
  return new Promise((resolve) => setTimeout(resolve, duration));
};
