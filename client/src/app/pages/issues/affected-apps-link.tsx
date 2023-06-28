import * as React from "react";
import { Link } from "react-router-dom";
import { Location } from "history";
import { Button } from "@patternfly/react-core";
import { AnalysisRuleReport } from "@app/api/models";
import { IssuesFilterValuesToCarry, getAffectedAppsUrl } from "./helpers";

export interface IAffectedAppsLinkProps {
  ruleReport: AnalysisRuleReport;
  fromFilterValues: IssuesFilterValuesToCarry;
  fromLocation: Location;
  showNumberOnly?: boolean;
}

export const AffectedAppsLink: React.FC<IAffectedAppsLinkProps> = ({
  ruleReport,
  fromFilterValues,
  fromLocation,
  showNumberOnly,
}) => (
  <Button variant="link" isInline>
    <Link
      to={getAffectedAppsUrl({
        ruleReport,
        fromFilterValues,
        fromLocation,
      })}
    >
      {ruleReport.applications}
      {showNumberOnly ? null : " - View affected applications"}
    </Link>
  </Button>
);
