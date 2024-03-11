// src/mocks/server.js
import { rest } from "msw";
import { setupServer } from "msw/node";
import applications from "./stub-new-work/applications";
import archetypes from "./stub-new-work/archetypes";
import assessments from "./stub-new-work/assessments";

const localeHandler = rest.get(
  "http://localhost/locales/en/translation.json",
  (req, res, ctx) => {
    return res(ctx.json({}));
  }
);
const handlers = [
  ...applications,
  ...archetypes,
  ...assessments,
  localeHandler,
].filter(Boolean);

export const server = setupServer(...handlers);
