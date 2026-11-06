import { MemoryRouter } from "react-router-dom";

import { fireEvent, render, screen, within } from "@app/test-config/test-utils";

import { HorizontalNav } from "../HorizontalNav";

describe("HorizontalNav", () => {
  it("keeps each destination inside its list item and updates the current link", () => {
    render(
      <MemoryRouter initialEntries={["/first/details"]}>
        <HorizontalNav
          navItems={[
            { title: "First", path: "/first" },
            { title: "Second", path: "/second" },
          ]}
        />
      </MemoryRouter>
    );

    const [firstItem, secondItem] = screen.getAllByRole("listitem");
    const firstLink = within(firstItem).getByRole("link", { name: "First" });
    const secondLink = within(secondItem).getByRole("link", { name: "Second" });
    expect(firstLink).toHaveAttribute("aria-current", "page");
    expect(within(firstItem).queryByRole("button")).not.toBeInTheDocument();

    fireEvent.click(secondLink);

    expect(secondLink).toHaveAttribute("aria-current", "page");
    expect(firstLink).not.toHaveAttribute("aria-current");
  });
});
