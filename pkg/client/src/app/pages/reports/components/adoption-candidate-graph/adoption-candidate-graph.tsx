import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Measure from "react-measure";
import { useTranslation } from "react-i18next";

import {
  Bullseye,
  Checkbox,
  Skeleton,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import {
  Chart,
  ChartAxis,
  ChartGroup,
  ChartLine,
  ChartScatter,
  ChartThemeColor,
  ChartTooltip,
} from "@patternfly/react-charts";
import {
  global_palette_black_800 as black,
  chart_color_green_100 as green,
  global_palette_white as white,
} from "@patternfly/react-tokens";

import { useFetch, useFetchApplicationDependencies } from "@app/shared/hooks";
import { ConditionalRender, StateError } from "@app/shared/components";

import { EFFORT_ESTIMATE_LIST, PROPOSED_ACTION_LIST } from "@app/Constants";
import { getAssessmentConfidence } from "@app/api/rest";
import {
  Application,
  AssessmentConfidence,
  ProposedAction,
} from "@app/api/models";

import { ApplicationSelectionContext } from "../../application-selection-context";
import { CartesianSquare } from "./cartesian-square";
import { Arrow } from "./arrow";

interface Line {
  from: LinePoint;
  to: LinePoint;
}

interface LinePoint {
  x: number;
  y: number;
  size: number;
  application: Application;
}

interface BubblePoint extends LinePoint {
  legend: Legend;
}

interface Legend {
  name: string;
  hexColor: string;
}

interface Serie {
  legend: Legend;
  datapoints: LinePoint[];
}

type ProposedActionChartDataListType = {
  [key in ProposedAction]: Serie;
};

export const AdoptionCandidateGraph: React.FC = () => {
  const { t } = useTranslation();

  const defaultChartData: ProposedActionChartDataListType = useMemo(() => {
    return {
      rehost: {
        legend: {
          name: t(PROPOSED_ACTION_LIST["rehost"].i18Key),
          hexColor: PROPOSED_ACTION_LIST["rehost"].hexColor,
        },
        datapoints: [],
      },
      replatform: {
        legend: {
          name: t(PROPOSED_ACTION_LIST["replatform"].i18Key),
          hexColor: PROPOSED_ACTION_LIST["replatform"].hexColor,
        },
        datapoints: [],
      },
      refactor: {
        legend: {
          name: t(PROPOSED_ACTION_LIST["refactor"].i18Key),
          hexColor: PROPOSED_ACTION_LIST["refactor"].hexColor,
        },
        datapoints: [],
      },
      repurchase: {
        legend: {
          name: t(PROPOSED_ACTION_LIST["repurchase"].i18Key),
          hexColor: PROPOSED_ACTION_LIST["repurchase"].hexColor,
        },
        datapoints: [],
      },
      retire: {
        legend: {
          name: t(PROPOSED_ACTION_LIST["retire"].i18Key),
          hexColor: PROPOSED_ACTION_LIST["retire"].hexColor,
        },
        datapoints: [],
      },
      retain: {
        legend: {
          name: t(PROPOSED_ACTION_LIST["retain"].i18Key),
          hexColor: PROPOSED_ACTION_LIST["retain"].hexColor,
        },
        datapoints: [],
      },
    };
  }, [t]);

  // Context
  const { selectedItems: applications } = useContext(
    ApplicationSelectionContext
  );

  // Checkboxes
  const [showDependencies, setShowDependencies] = useState(true);

  // Confidence
  const fetchChartData = useCallback(() => {
    if (applications.length > 0) {
      return getAssessmentConfidence(applications.map((f) => f.id!)).then(
        ({ data }) => data
      );
    } else {
      return Promise.resolve([]);
    }
  }, [applications]);

  const {
    data: confidences,
    isFetching,
    fetchError,
    requestFetch: refreshChart,
  } = useFetch<AssessmentConfidence[]>({
    defaultIsFetching: true,
    onFetchPromise: fetchChartData,
  });

  useEffect(() => {
    refreshChart();
  }, [applications, refreshChart]);

  // Dependencies
  const {
    applicationDependencies: dependencies,
    fetchAllApplicationDependencies: fetchAllDependencies,
  } = useFetchApplicationDependencies();

  useEffect(() => {
    fetchAllDependencies({});
  }, [fetchAllDependencies]);

  // Chart data
  const legendAndPoints: ProposedActionChartDataListType = useMemo(() => {
    if (!confidences) {
      return defaultChartData;
    }

    return applications.reduce((prev, current) => {
      const appConfidence = confidences.find(
        (elem) => elem.applicationId === current.id
      );

      if (appConfidence && current.review) {
        const key = current.review.proposedAction;
        const value = prev[current.review.proposedAction];

        // Create new datapoint
        const effortData = EFFORT_ESTIMATE_LIST[current.review.effortEstimate];
        const datapoint: LinePoint = {
          x: appConfidence.confidence,
          y: current.review.businessCriticality,
          size: effortData ? effortData.size : 0,
          application: { ...current },
        };

        // Process result
        const newValue: Serie = {
          ...value,
          datapoints: [...value.datapoints, datapoint],
        };

        const result: ProposedActionChartDataListType = {
          ...prev,
          [key]: newValue,
        };
        return result;
      }

      return prev;
    }, defaultChartData);
  }, [confidences, applications, defaultChartData]);

  const bubblePoints: BubblePoint[] = useMemo(() => {
    return Object.keys(legendAndPoints)
      .map((key) => {
        const serie = legendAndPoints[key as ProposedAction];

        const legend = serie.legend;
        const datapoints = serie.datapoints;

        const result: BubblePoint[] = datapoints.map((f) => {
          const flatPoint: BubblePoint = { ...f, legend: legend };
          return flatPoint;
        });
        return result;
      })
      .flatMap((f) => f)
      .sort((a, b) => b.size - a.size);
  }, [legendAndPoints]);

  const lines = useMemo(() => {
    if (!dependencies) {
      return [];
    }

    const points = Object.keys(legendAndPoints)
      .map((key) => legendAndPoints[key as ProposedAction].datapoints)
      .flatMap((f) => f);

    return dependencies.data.reduce((prev, current) => {
      const fromPoint = points.find(
        (f) => f.application.id === current.from.id
      );
      const toPoint = points.find((f) => f.application.id === current.to.id);

      if (fromPoint && toPoint) {
        const a = fromPoint.x - toPoint.x;
        const b = fromPoint.y - toPoint.y;
        const distance = Math.sqrt(a * a + b * b);
        if (distance > 0) {
          const line: Line = { from: fromPoint, to: toPoint };
          return [...prev, line];
        }
      }

      return prev;
    }, [] as Line[]);
  }, [legendAndPoints, dependencies]);

  if (fetchError) {
    return <StateError />;
  }

  return (
    <ConditionalRender
      when={isFetching}
      then={
        <Bullseye>
          <div style={{ height: 200, width: 400 }}>
            <Skeleton height="75%" width="100%" />
          </div>
        </Bullseye>
      }
    >
      <Stack hasGutter>
        <StackItem>
          <Checkbox
            id="show-dependencies"
            name="show-dependencies"
            label={t("terms.dependencies")}
            isChecked={showDependencies}
            onChange={() => setShowDependencies((current) => !current)}
          />
        </StackItem>
        <StackItem isFilled>
          <Measure bounds>
            {({ measureRef, contentRect }) => {
              const chartHeight = 600;
              const chartWidth = contentRect.bounds?.width || 400;
              const chartPadding = {
                bottom: 100,
                left: 75,
                right: 50,
                top: 50,
              };

              return (
                <div ref={measureRef}>
                  <div
                    style={{
                      height: chartHeight,
                      width: chartWidth,
                    }}
                  >
                    <Chart
                      themeColor={ChartThemeColor.gray}
                      legendPosition="bottom-left"
                      legendData={Object.keys(legendAndPoints).map((key) => {
                        const serie = legendAndPoints[key as ProposedAction];
                        const legend = serie.legend;
                        return {
                          name: legend.name,
                          symbol: {
                            fill: legend.hexColor,
                          },
                        };
                      })}
                      padding={chartPadding}
                      height={chartHeight}
                      width={chartWidth}
                      domain={{ x: [0, 100], y: [0, 10] }}
                      style={{
                        background: { fill: "url(#axis_gradient)" },
                      }}
                    >
                      <ChartAxis
                        label={t("terms.confidence")}
                        showGrid
                        tickValues={[
                          0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65,
                          70, 75, 80, 85, 90, 95, 100,
                        ]}
                        tickLabelComponent={<></>}
                        style={{
                          axisLabel: { fontSize: 20, padding: 30 },
                        }}
                      />
                      <ChartAxis
                        label={t("terms.businessCriticality")}
                        showGrid
                        dependentAxis
                        tickValues={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                        tickLabelComponent={<></>}
                        style={{
                          axisLabel: { fontSize: 20, padding: 30 },
                        }}
                      />
                      <CartesianSquare
                        height={chartHeight}
                        width={chartWidth}
                        padding={chartPadding}
                      />
                      <ChartGroup>
                        <ChartScatter
                          key={"scatter-1"}
                          name={"scatter-1"}
                          data={bubblePoints}
                          labels={({ datum }) => {
                            const point = datum as BubblePoint;
                            return point.application.name;
                          }}
                          labelComponent={
                            <ChartTooltip
                              dy={({ datum }) => {
                                const point = datum as BubblePoint;
                                return 0 - point.size;
                              }}
                            />
                          }
                          style={{
                            data: {
                              fill: ({ datum }) => {
                                const point = datum as BubblePoint;
                                return point.legend.hexColor;
                              },
                            },
                          }}
                        />
                      </ChartGroup>
                      {showDependencies &&
                        lines.map((line, i) => (
                          <ChartLine
                            key={"line-" + i}
                            name={"line-" + i}
                            data={[
                              { x: line.from.x, y: line.from.y },
                              {
                                x: line.to.x,
                                y: line.to.y,
                              },
                            ]}
                            style={{
                              data: { stroke: black.value, strokeWidth: 2 },
                            }}
                            dataComponent={<Arrow />}
                            groupComponent={<g></g>}
                          />
                        ))}
                    </Chart>

                    <svg style={{ height: 0 }}>
                      <defs>
                        <linearGradient
                          id="axis_gradient"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="0%"
                        >
                          <stop
                            offset="50%"
                            style={{
                              stopColor: white.value,
                              stopOpacity: 1,
                            }}
                          />
                          <stop
                            offset="100%"
                            style={{
                              stopColor: green.value,
                              stopOpacity: 0.5,
                            }}
                          />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>
              );
            }}
          </Measure>
        </StackItem>
      </Stack>
    </ConditionalRender>
  );
};
