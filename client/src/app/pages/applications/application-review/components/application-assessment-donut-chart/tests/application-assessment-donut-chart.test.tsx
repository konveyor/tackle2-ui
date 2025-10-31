import React from "react";

import {
  ChartData,
  ApplicationAssessmentDonutChart,
  getChartDataFromCategories,
} from "../application-assessment-donut-chart";
import { Assessment } from "@app/api/models";
import { render } from "@app/test-config/test-utils";

describe("AppTable", () => {
  const assessments = [];
  // const assessment: Assessment = {
  //   id: 209,
  //   applicationId: 1,
  //   status: "COMPLETE",
  //   stakeholders: [],
  //   stakeholderGroups: [],
  //   questionnaire: {
  //     section: [
  //       {
  //         id: 211,
  //         order: 1,
  //         title: "Category1",
  //         questions: [
  //           {
  //             id: 212,
  //             order: 1,
  //             question: "question1",
  //             options: [
  //               {
  //                 id: 214,
  //                 order: 1,
  //                 option: "option",
  //                 checked: true,
  //                 risk: "GREEN",
  //               },
  //               {
  //                 id: 215,
  //                 order: 2,
  //                 option: "option",
  //                 checked: false,
  //                 risk: "AMBER",
  //               },
  //               {
  //                 id: 216,
  //                 order: 3,
  //                 option: "option",
  //                 checked: false,
  //                 risk: "RED",
  //               },
  //               {
  //                 id: 213,
  //                 order: 0,
  //                 option: "option",
  //                 checked: false,
  //                 risk: "GREEN",
  //               },
  //             ],
  //             description: "",
  //           },
  //           {
  //             id: 219,
  //             order: 2,
  //             question: "question2",
  //             options: [
  //               {
  //                 id: 221,
  //                 order: 1,
  //                 option: "option",
  //                 checked: false,
  //                 risk: "GREEN",
  //               },
  //               {
  //                 id: 222,
  //                 order: 2,
  //                 option: "option",
  //                 checked: true,
  //                 risk: "AMBER",
  //               },
  //               {
  //                 id: 223,
  //                 order: 3,
  //                 option: "option",
  //                 checked: false,
  //                 risk: "RED",
  //               },
  //               {
  //                 id: 224,
  //                 order: 4,
  //                 option: "option",
  //                 checked: false,
  //                 risk: "UNKNOWN",
  //               },
  //             ],
  //             description: "",
  //           },
  //           {
  //             id: 226,
  //             order: 3,
  //             question: "question3",
  //             options: [
  //               {
  //                 id: 228,
  //                 order: 1,
  //                 option: "option",
  //                 checked: false,
  //                 risk: "GREEN",
  //               },
  //               {
  //                 id: 229,
  //                 order: 2,
  //                 option: "option",
  //                 checked: false,
  //                 risk: "AMBER",
  //               },
  //               {
  //                 id: 230,
  //                 order: 3,
  //                 option: "option",
  //                 checked: true,
  //                 risk: "RED",
  //               },
  //               {
  //                 id: 231,
  //                 order: 4,
  //                 option: "option",
  //                 checked: false,
  //                 risk: "UNKNOWN",
  //               },
  //             ],
  //             description: "",
  //           },
  //           {
  //             id: 234,
  //             order: 4,
  //             question: "question3",
  //             options: [
  //               {
  //                 id: 236,
  //                 order: 1,
  //                 option: "option",
  //                 checked: false,
  //                 risk: "GREEN",
  //               },
  //               {
  //                 id: 237,
  //                 order: 2,
  //                 option: "option",
  //                 checked: false,
  //                 risk: "AMBER",
  //               },
  //               {
  //                 id: 238,
  //                 order: 3,
  //                 option: "option",
  //                 checked: false,
  //                 risk: "RED",
  //               },
  //               {
  //                 id: 235,
  //                 order: 0,
  //                 option: "option",
  //                 checked: true,
  //                 risk: "UNKNOWN",
  //               },
  //             ],
  //             description: "",
  //           },
  //         ],
  //         comment: "",
  //       },
  //       {
  //         id: 262,
  //         order: 2,
  //         title: "Category2",
  //         questions: [
  //           {
  //             id: 263,
  //             order: 1,
  //             question: "question4",
  //             options: [
  //               {
  //                 id: 264,
  //                 order: 0,
  //                 option: "option",
  //                 checked: false,
  //                 risk: "GREEN",
  //               },
  //               {
  //                 id: 266,
  //                 order: 2,
  //                 option: "option",
  //                 checked: false,
  //                 risk: "AMBER",
  //               },
  //               {
  //                 id: 267,
  //                 order: 3,
  //                 option: "option",
  //                 checked: false,
  //                 risk: "RED",
  //               },
  //               {
  //                 id: 268,
  //                 order: 4,
  //                 option: "option",
  //                 checked: true,
  //                 risk: "UNKNOWN",
  //               },
  //             ],
  //             description: "",
  //           },
  //         ],
  //         comment: "",
  //       },
  //     ],
  //   },

  it.skip("Get chart data", () => {
    // const result = getChartDataFromCategories(
    //   assessment.questionnaire.categories
    // );
    // expect(result).toMatchObject({
    //   green: 1,
    //   amber: 1,
    //   red: 1,
    //   unknown: 2,
    // } as ChartData);
  });

  it.skip("Renders without crashing", () => {
    // const wrapper = render(
    //   <ApplicationAssessmentDonutChart assessment={assessment} />
    // );
    // expect(wrapper).toMatchSnapshot();
  });
});
