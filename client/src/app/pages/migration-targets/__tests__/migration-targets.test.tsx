import "@testing-library/jest-dom";
import { rest } from "msw";
import { MemoryRouter } from "react-router-dom";

import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@app/test-config/test-utils";
import { server } from "@mocks/server";

import { MigrationTargets } from "../migration-targets";

const customTarget = {
  id: 42,
  name: "my-custom-target",
  description: "A custom target",
  custom: true,
  provider: "Java",
  ruleset: { id: 1, name: "my-custom-target" },
};

describe("Component: migration-targets delete confirmation", () => {
  const deleteHandler = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    server.use(
      rest.get("/hub/targets", (_, res, ctx) => res(ctx.json([customTarget]))),
      rest.get("/hub/settings/ui.target.order", (_, res, ctx) =>
        res(ctx.json([42]))
      ),
      rest.put("/hub/settings/ui.target.order", (_, res, ctx) =>
        res(ctx.status(204))
      ),
      rest.delete("/hub/targets/42", (_, res, ctx) => {
        deleteHandler();
        return res(ctx.status(204));
      })
    );
  });

  const openDeleteDialog = async () => {
    render(
      <MemoryRouter>
        <MigrationTargets />
      </MemoryRouter>
    );
    const kebab = await screen.findByRole("button", { name: /kebab toggle/i });
    fireEvent.click(kebab);
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "actions.delete" })
    );
    return await screen.findByRole("dialog");
  };

  it("asks for confirmation instead of deleting right away", async () => {
    const dialog = await openDeleteDialog();

    expect(
      within(dialog).getByText("dialog.title.deleteWithName")
    ).toBeInTheDocument();
    expect(deleteHandler).not.toHaveBeenCalled();
  });

  it("does not delete the target when the dialog is cancelled", async () => {
    const dialog = await openDeleteDialog();

    fireEvent.click(
      within(dialog).getByRole("button", { name: "actions.cancel" })
    );

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(deleteHandler).not.toHaveBeenCalled();
  });

  it("deletes the target once the dialog is confirmed", async () => {
    const dialog = await openDeleteDialog();

    fireEvent.click(
      within(dialog).getByRole("button", { name: "actions.delete" })
    );

    await waitFor(() => expect(deleteHandler).toHaveBeenCalledTimes(1));
  });
});
