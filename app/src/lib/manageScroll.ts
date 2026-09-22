// Breathing room between the sticky header and the editor it reveals.
const MARGIN = 24;
// Enough of the editor to read its heading and reach the first field.
const EDITOR_HEAD = 120;

// Opening the editor keeps the page where the reader left it, which hides the
// form when it opens from a row far down the list. Work out the smallest move
// that brings the top of the form back, or null when it already shows.
export const revealOffset = (
  editorTop: number,
  viewportHeight: number,
  headerHeight: number
): number | null => {
  if (editorTop >= headerHeight && editorTop + EDITOR_HEAD <= viewportHeight) return null;
  return editorTop - headerHeight - MARGIN;
};
