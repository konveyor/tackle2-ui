import * as React from "react";
import { Link } from "react-router-dom";
import { Location } from "history";
import { Button } from "@patternfly/react-core";
import { UiAnalysisReportInsight } from "@app/api/models";
import { InsightsFilterValuesToCarry, getAffectedAppsUrl } from "../helpers";

export interface IAffectedAppsLinkProps {
  ruleReport: UiAnalysisReportInsight;
  fromFilterValues: InsightsFilterValuesToCarry;
  fromLocation: Location;
  showNumberOnly?: boolean;
  toPath?: string;
}

export const AffectedAppsLink: React.FC<IAffectedAppsLinkProps> = ({
  ruleReport,
  fromFilterValues,
  fromLocation,
  showNumberOnly = true,
  toPath,
}) => (
  <Button variant="link" isInline>
    <Link
      to={getAffectedAppsUrl({
        ruleReport,
        fromFilterValues,
        fromLocation,
        toPath,
      })}
    >
      {showNumberOnly
        ? ruleReport.applications
        : `${ruleReport.applications} - View affected applications`}
    </Link>
  </Button>
);
