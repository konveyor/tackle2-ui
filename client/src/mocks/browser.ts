import { type RestHandler, setupWorker, rest } from "msw";

import StubsForNewWork from "./stub-new-work";

const otherHandlers: RestHandler[] = [...StubsForNewWork];

export const worker = setupWorker(
  ...otherHandlers,

  rest.all("/hub/*", (req) => {
    console.log(
      "%cmsw passthrough%c \u{1fa83} %s",
      "font-weight: bold",
      "font-weight: normal",
      req.url
    );
    return req.passthrough();
  })
);
