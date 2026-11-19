/**
 * Trailing characters to keep when middle truncating a label.
 *
 * PatternFly's `Truncate` only splits the content while
 * `content.length - trailingNumChars > 12` (its internal `minWidthCharacters`),
 * so the trailing slice also sets the length at which middle truncation starts
 * to apply. At the default of 7 a 19 character name still falls back to an end
 * ellipsis -- precisely where names sharing a prefix need their suffix kept.
 * 4 drops that threshold to 16 characters, and the shorter tail also lowers the
 * label's minimum footprint in a narrow column.
 */
export const MIDDLE_TRUNCATE_TRAILING_CHARS = 4;
