export const getViewableBlockBottomHeight = (target: HTMLElement) => {
  return (
    window.innerHeight -
    (target.offsetTop - window.scrollY) -
    target.offsetHeight
  );
};
