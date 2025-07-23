import React from "react";

interface PathDisplayProps {
  path: string;
}

const PathDisplay: React.FC<PathDisplayProps> = ({ path }) => {
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

export default PathDisplay;
