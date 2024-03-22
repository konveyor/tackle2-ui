// src/mocks/server.js
import { rest } from "msw";
import { setupServer } from "msw/node";

const localeHandler = rest.get(
  "http://localhost/locales/en/translation.json",
  (req, res, ctx) => {
    return res(ctx.json({}));
  }
);

const handlers = [localeHandler].filter(Boolean);

export const server = setupServer(...handlers);
