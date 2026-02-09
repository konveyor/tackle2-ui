// Pattern: leading whitespace, line number, optional 2-space separator, code content
const codeLineRegex = /^\s*(\d+)( {2})?(.*)$/;

export type ParseCodeSnipResult =
  | { valid: false }
  | { valid: true; startLine: number; code: string; lineCount: number };

/** Parse the codeSnip to extract the starting line number and the code content. */
export const parseCodeSnip = (
  codeSnip?: string | null
): ParseCodeSnipResult => {
  if (!codeSnip?.trim()) {
    return { valid: false };
  }

  const numberedLines = codeSnip.split("\n");
  const codeLines: string[] = [];
  let startLine = 1;
  let startLineFound = false;

  for (const numberedLine of numberedLines) {
    const match = numberedLine.match(codeLineRegex);
    if (match) {
      const lineNum = Number(match[1]);
      if (!startLineFound && !isNaN(lineNum)) {
        startLine = lineNum;
        startLineFound = true;
      }
      // match[3] is the code content after the line number and optional separator
      codeLines.push(match[3] ?? "");
    }
    // Lines without line numbers (e.g., empty string from leading \n) are skipped
    // as they are format artifacts, not actual source lines.
    // Blank source lines like " 6  " still match because they have a line number.
  }

  return {
    valid: true,
    startLine,
    code: codeLines.join("\n"),
    lineCount: codeLines.length,
  };
};
