import {
  clickByText,
  getUniqueElementsFromSecondArray,
  validateAnyNumberPresence,
  validateTextPresence,
} from "../../../../../utils/utils";
import {
  button,
  dynamicReportFilter,
  trTag,
} from "../../../../types/constants";
import { AppInsight, AppIssue } from "../../../../types/types";
import { div, liTag, span } from "../../../../views/common.view";
import { insightColumns } from "../../../../views/insights.view";
import { singleApplicationColumns } from "../../../../views/issue.view";
import { DynamicReports } from "../dynamic-report";

export class Insights extends DynamicReports {
  static urlSuffix = "/insights";
  static menuName = "Insights";

  public static applyAndValidateFilter(
    filterType: dynamicReportFilter,
    filterValues: string[],
    insightsExpected: AppInsight[],
    insightsNotExpected: AppInsight[] = [],
    isSingle = false
  ) {
    filterValues.forEach((value) => {
      Insights.applyFilter(filterType, value, isSingle);
    });
    insightsExpected.forEach((insight) => {
      Insights.validateFilter(insight, isSingle);
    });

    if (insightsNotExpected.length > 0) {
      getUniqueElementsFromSecondArray(
        insightsExpected,
        insightsNotExpected
      ).forEach((insight: AppInsight) => {
        validateTextPresence(insightColumns.insight, insight.name, false);
      });
    }
  }

  public static validateFilter(insight: AppInsight, isSingle = false): void {
    const firstSource = insight.sources?.[0] ?? "None";
    const firstTarget = insight.targets?.[0] ?? "None";
    const hasMultipleTargets = (insight.targets?.length ?? 0) > 1;

    cy.contains(insight.name)
      .closest(trTag)
      .should("have.length", 1)
      .within(() => {
        validateTextPresence(insightColumns.insight, insight.name);
        validateTextPresence(insightColumns.category, insight.category);
        validateTextPresence(insightColumns.source, firstSource);

        if (firstTarget !== "None") {
          cy.get(insightColumns.target).within(() => {
            validateTextPresence(liTag, firstTarget);

            if (hasMultipleTargets) {
              clickByText(span, /more/i);
            }
          });
        } else {
          validateTextPresence(insightColumns.target, "None");
        }

        if (!isSingle) {
          validateAnyNumberPresence(insightColumns.applications);
        } else {
          validateAnyNumberPresence(singleApplicationColumns.files);
        }
      });
  }
  public static validateAllFields(insight: AppInsight): void {
    const sections = {
      totalAffectedApps: "Total affected",
      targetTechnologies: "Target technologies",
      sourceTechnologies: "Source technologies",
      ruleSet: "Rule set",
      rule: /^Rule$/,
      labels: "Labels",
    };

    Insights.unfold(insight.name);
    Insights.validateSection(
      insight.name,
      sections.totalAffectedApps,
      button,
      /\d - View affected /
    );
    Insights.validateSection(
      insight.name,
      sections.targetTechnologies,
      div,
      insight.targets
    );
    Insights.validateSection(
      insight.name,
      sections.sourceTechnologies,
      div,
      insight.sources
    );
    if (insight.ruleSet) {
      Insights.validateSection(
        insight.name,
        sections.ruleSet,
        div,
        insight.ruleSet
      );
    }
    Insights.validateSection(insight.name, sections.rule, div, insight.rule);
    Insights.validateSection(
      insight.name,
      sections.labels,
      div,
      insight.labels
    );
  }
}
