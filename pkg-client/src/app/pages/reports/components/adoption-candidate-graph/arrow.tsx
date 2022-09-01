import React from "react";
import { Curve } from "victory-line";
import { global_palette_black_800 as black } from "@patternfly/react-tokens";

export const Arrow: React.FC = (props) => {
  return (
    <g>
      <defs>
        <marker
          id="arrow"
          markerWidth="10"
          markerHeight="10"
          refX="6"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L6,3 z" fill={black.value} />
        </marker>
      </defs>
      <Curve {...props} pathComponent={<path markerEnd="url(#arrow)" />} />
    </g>
  );
};
