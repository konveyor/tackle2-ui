import React from "react";
import { Bullseye, Spinner } from "@patternfly/react-core";

export const AppPlaceholder: React.FC = () => {
  return (
    <Bullseye>
      <div className="pf-u-display-flex pf-u-flex-direction-column">
        <div>
          <Spinner />
        </div>
        <div className="pf-c-content">
          <h3>Loading...</h3>
        </div>
      </div>
    </Bullseye>
  );
};
