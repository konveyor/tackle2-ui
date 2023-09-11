import { rest } from "msw";

import * as AppRest from "@app/api/rest";
import { Application } from "@app/api/models";

function generateRandomId(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

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
    assessments: [{ id: 43, name: "test" }],
  },
];

export const handlers = [
  // Commented out to avoid conflict with the real API
  rest.get(AppRest.APPLICATIONS, (req, res, ctx) => {
    return res(ctx.json(mockApplicationArray));
  }),
  rest.get(`${AppRest.APPLICATIONS}/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const mockApplication = mockApplicationArray.find(
      (app) => app.id === parseInt(id as string, 10)
    );
    if (mockApplication) {
      return res(ctx.json(mockApplication));
    } else {
      return res(
        ctx.status(404),
        ctx.json({ message: "Application not found" })
      );
    }
  }),
  rest.post(AppRest.APPLICATIONS, async (req, res, ctx) => {
    const newApplication: Application = await req.json();
    newApplication.id = generateRandomId(1000, 9999);

    const existingApplicationIndex = mockApplicationArray.findIndex(
      (app) => app.id === newApplication.id
    );

    if (existingApplicationIndex !== -1) {
      mockApplicationArray[existingApplicationIndex] = newApplication;
      return res(
        ctx.status(200),
        ctx.json({ message: "Application updated successfully" })
      );
    } else {
      mockApplicationArray.push(newApplication);
      return res(
        ctx.status(201),
        ctx.json({ message: "Application created successfully" })
      );
    }
  }),
  rest.delete(`${AppRest.APPLICATIONS}`, async (req, res, ctx) => {
    const ids: number[] = await req.json();

    // Filter and remove applications from the mock array by their IDs
    ids.forEach((id) => {
      const existingApplicationIndex = mockApplicationArray.findIndex(
        (app) => app.id === id
      );

      if (existingApplicationIndex !== -1) {
        mockApplicationArray.splice(existingApplicationIndex, 1);
      }
    });

    return res(
      ctx.status(200),
      ctx.json({ message: "Applications deleted successfully" })
    );
  }),
];

export default handlers;
