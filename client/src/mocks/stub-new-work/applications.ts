import { rest } from "msw";

import * as AppRest from "@app/api/rest";
import { Application, Questionnaire, Assessment } from "@app/api/models";

export const mockApplicationArray: Application[] = [
  {
    id: 1,
    name: "App 1",
    description: "Description for App 1",
    comments: "Sample comments for App 1",
    businessService: { id: 1, name: "Service 1" },
    tags: [
      { id: 1, name: "Tag 1" },
      { id: 2, name: "Tag 2" },
    ],
    owner: { id: 101, name: "John Doe" },
    contributors: [
      { id: 201, name: "Alice" },
      { id: 202, name: "Bob" },
    ],
    review: { id: 301, name: "Review 1" },
    identities: [
      { id: 401, name: "Identity 1" },
      { id: 402, name: "Identity 2" },
    ],
    binary: "app1-bin.zip",
    migrationWave: { id: 501, name: "Wave 1" },
    assessments: [],
  },
];

export const handlers = [
  // rest.get(AppRest.APPLICATIONS, (req, res, ctx) => {
  //   return res(ctx.json(mockApplicationArray));
  // }),
];

export default handlers;
