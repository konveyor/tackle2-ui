import { rest } from "msw";

import { server } from "@mocks/server";

import { updateSetting } from "./settings";

describe("updateSetting", () => {
  let body: string | undefined;

  beforeEach(() => {
    body = undefined;
    server.use(
      rest.put("/hub/settings/:key", async (req, res, ctx) => {
        body = await req.text();
        return res(ctx.status(204));
      })
    );
  });

  it.each([true, false])("sends %s as a JSON body", async (value) => {
    await updateSetting({ key: "git.insecure.enabled", value });

    expect(body).toBe(JSON.stringify(value));
  });

  it("sends an array value as a JSON body", async () => {
    await updateSetting({ key: "ui.target.order", value: [3, 1, 2] });

    expect(body).toBe("[3,1,2]");
  });
});
