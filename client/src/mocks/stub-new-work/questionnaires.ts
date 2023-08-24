import { type RestHandler, rest } from "msw";

import * as AppRest from "@app/api/rest";
import type { Questionnaire } from "@app/api/models";

/**
 * Simple stub handlers as place holders until hub API is ready.
 *
 * Handler structure modeled after hub api handler:
 *   https://github.com/konveyor/tackle2-hub/blob/main/api/tag.go
 */
const handlers: RestHandler[] = [
  rest.get(AppRest.QUESTIONNAIRES, (req, res, ctx) => {
    console.log(
      "%cquestionnaire stub%c \u{1f916} %s",
      "font-weight: bold; color: green;",
      "font-weight: normal; color: auto;",
      `get the list of questionnaires`
    );

    const dataAsList = Array.from(Object.values(data));
    return res(ctx.json(dataAsList));
  }),

  rest.put(`${AppRest.QUESTIONNAIRES}/:id`, async (req, res, ctx) => {
    const { id } = req.params;
    const updates = await req.json();

    console.log(
      "%cquestionnaire stub%c \u{1f916} %s",
      "font-weight: bold; color: green;",
      "font-weight: normal; color: auto;",
      `update questionnaire ${id} \u{2192}`,
      updates
    );

    const id_ = Array.isArray(id) ? id[0] : id;
    if (id_ in data) {
      data[id_] = updates;
      return res(ctx.status(204)); // follow the hub handler success response == StatusNoContent
    }
    return res(ctx.status(404)); // hub doesn't do this, it fails silently
  }),

  rest.delete(`${AppRest.QUESTIONNAIRES}/:id`, (req, res, ctx) => {
    const { id } = req.params;
    console.log(
      "%cquestionnaire stub%c \u{1f916} %s",
      "font-weight: bold; color: green;",
      "font-weight: normal; color: auto;",
      `delete questionnaire ${id}`
    );

    const id_ = Array.isArray(id) ? id[0] : id;
    if (id_ in data) {
      delete data[id_];
      return res(ctx.status(204)); // follow the hub handler success response == StatusNoContent
    }
    return res(ctx.status(404)); // hub doesn't do this, it fails silently
  }),
];

/**
 * The questionnaire data for the handlers!
 */
const data: Record<number, Questionnaire> = {
  1: {
    id: 1,
    name: "System questionnaire",
    description: "This is a custom questionnaire",
    revision: 1,
    questions: 42,
    rating: "5% Red, 25% Yellow",
    dateImported: "8 Aug. 2023, 10:20 AM EST",
    required: false,
    system: true,
    sections: [],
    thresholds: { red: "5", yellow: "25", unknown: "70" },
    riskMessages: {
      green: "Low Risk",
      red: "High Risk",
      yellow: "Medium Risk",
      unknown: "Low Risk",
    },
  },
  2: {
    id: 2,
    name: "Custom questionnaire",
    description: "This is a custom questionnaire",
    revision: 1,
    questions: 24,
    rating: "15% Red, 35% Yellow",
    dateImported: "9 Aug. 2023, 03:32 PM EST",
    required: true,
    system: false,
    sections: [],
    thresholds: { red: "5", yellow: "25", unknown: "70" },
    riskMessages: {
      green: "Low Risk",
      red: "High Risk",
      yellow: "Medium Risk",
      unknown: "Low Risk",
    },
  },

  3: {
    id: 3,
    name: "Ruby questionnaire",
    description: "This is a ruby questionnaire",
    revision: 1,
    questions: 34,
    rating: "7% Red, 25% Yellow",
    dateImported: "10 Aug. 2023, 11:23 PM EST",
    required: true,
    system: false,
    sections: [],
    thresholds: { red: "5", yellow: "25", unknown: "70" },
    riskMessages: {
      green: "Low Risk",
      red: "High Risk",
      yellow: "Medium Risk",
      unknown: "Low Risk",
    },
  },
};

export default handlers;
