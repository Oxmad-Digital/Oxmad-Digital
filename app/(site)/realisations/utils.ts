/** Hides a screenshot that failed to load, revealing the typographic placeholder behind it. */
export const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.display = "none";
};

const MIN_NAME_SIZE = 16;

/**
 * Shrinks single-line client names until they fit their container. All resets, then all
 * measures, then all writes: a single layout pass whatever the number of names.
 */
export function fitNames(root: ParentNode = document) {
  const names = [...root.querySelectorAll<HTMLElement>(".fit-name")];
  names.forEach((el) => { el.style.fontSize = ""; });
  const sizes = names.map((el) => {
    if (el.scrollWidth <= el.clientWidth + 1) return 0;
    // Letter-spacing is in em, so the width scales linearly with the font size.
    const size = parseFloat(getComputedStyle(el).fontSize) * (el.clientWidth / el.scrollWidth);
    return Math.max(MIN_NAME_SIZE, Math.floor(size));
  });
  names.forEach((el, i) => { if (sizes[i]) el.style.fontSize = `${sizes[i]}px`; });
}
