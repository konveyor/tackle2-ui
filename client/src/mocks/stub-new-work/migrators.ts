import { rest } from "msw";

import { MigratorConfig } from "@app/api/models";

let nextId = 1;
const migrators: MigratorConfig[] = [];

const handlers = [
  rest.get("/hub/migrators", (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(migrators));
  }),

  rest.get("/hub/migrators/:id", (req, res, ctx) => {
    const id = Number(req.params.id);
    const migrator = migrators.find((m) => m.id === id);
    if (!migrator) return res(ctx.status(404));
    return res(ctx.status(200), ctx.json(migrator));
  }),

  rest.post("/hub/migrators", async (req, res, ctx) => {
    const body = await req.json();
    const created: MigratorConfig = { ...body, id: nextId++ };
    migrators.push(created);
    return res(ctx.status(201), ctx.json(created));
  }),

  rest.put("/hub/migrators/:id", async (req, res, ctx) => {
    const id = Number(req.params.id);
    const body = await req.json();
    const idx = migrators.findIndex((m) => m.id === id);
    if (idx === -1) return res(ctx.status(404));
    migrators[idx] = { ...body, id };
    return res(ctx.status(204));
  }),

  rest.delete("/hub/migrators/:id", (req, res, ctx) => {
    const id = Number(req.params.id);
    const idx = migrators.findIndex((m) => m.id === id);
    if (idx === -1) return res(ctx.status(404));
    migrators.splice(idx, 1);
    return res(ctx.status(204));
  }),
];

export default handlers;
