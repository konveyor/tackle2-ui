import { type RestHandler, rest } from "msw";

import { hub } from "@app/api/rest";

import data from "./questionnaireData";

/**
 * Simple stub handlers as place holders until hub API is ready.
 *
 * Handler structure modeled after hub api handler:
 *   https://github.com/konveyor/tackle2-hub/blob/main/api/tag.go
 */
const handlers: RestHandler[] = [
  rest.get(hub`/questionnaires/id/:questionnaireId`, (req, res, ctx) => {
    const { questionnaireId } = req.params;

    const id = parseInt(questionnaireId as string);

    if (id in data) {
      return res(ctx.json(data[id]));
    } else {
      return res(
        ctx.status(404),
        ctx.json({ error: "Questionnaire not found" })
      );
    }
  }),
  rest.get(hub`/questionnaires`, (req, res, ctx) => {
    console.log(
      "%cquestionnaire stub%c \u{1f916} %s",
      "font-weight: bold; color: green;",
      "font-weight: normal; color: auto;",
      `get the list of questionnaires`
    );

    const dataAsList = Array.from(Object.values(data));
    return res(ctx.json(dataAsList));
  }),

  rest.put(hub`/questionnaires/:id`, async (req, res, ctx) => {
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
      return res(ctx.status(204));
    }
    return res(ctx.status(404));
  }),

  rest.delete(hub`/questionnaires/:id`, (req, res, ctx) => {
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
      return res(ctx.status(204));
    }
    return res(ctx.status(404));
  }),
];

export default handlers;
