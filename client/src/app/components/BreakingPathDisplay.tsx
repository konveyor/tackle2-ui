import React from "react";

export interface BreakingPathDisplayProps {
  path: string;
}

/**
 * Display a path with `<wbr>` tags to allow line breaks at each directory level.
 *
 * @param path - The path to display.
 * @returns The path with `<wbr>` tags to allow line breaks at each directory level.
 */
export const BreakingPathDisplay: React.FC<BreakingPathDisplayProps> = ({
  path,
}) => {
  const normalizedPath = path.replace(/\\/g, "/");
  const formattedPath = normalizedPath
    .split("/")
    .reduce<React.ReactNode[]>((acc, segment, index, array) => {
      acc.push(segment);
      if (index < array.length - 1) {
        acc.push(<wbr key={`wbr-${index}`} />);
        acc.push(<span key={`slash-${index}`}>/</span>);
      }
      return acc;
    }, []);

  return <>{formattedPath}</>;
};

export default BreakingPathDisplay;
