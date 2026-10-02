// The dormant pad chip's canvas size and label fit (den-iso-v1/04). Pure, so a test can prove the label fits;
// Den.jsx supplies the real canvas measureText.
export const PAD_CHIP_PX = { width: 320, height: 56, font: 26, minFont: 14, padX: 24 };

/** The largest font size, base font down to the floor, whose measured text fits the canvas minus its side padding.
 *  `measureAt(font)` returns the text width in px at that font size. */
export function fitChipFont(measureAt, { width, font, minFont, padX }) {
  const room = width - 2 * padX;
  let size = font;
  while (size > minFont && measureAt(size) > room) size -= 1;
  return size;
}
