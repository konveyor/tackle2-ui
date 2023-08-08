import React from "react";
import { MenuActions } from "../MenuActions";
import { render, screen, fireEvent } from "@app/test-config/test-utils";

describe("MenuActions", () => {
  it("Renders without crashing", () => {
    const wrapper = render(
      <MenuActions
        actions={[
          { label: "Action1", callback: jest.fn() },
          { label: "Action2", callback: jest.fn() },
        ]}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });

  it("Executes callback", () => {
    const callback1Mock = jest.fn();
    const callback2Mock = jest.fn();

    render(
      <MenuActions
        actions={[
          { label: "Action1", callback: callback1Mock },
          { label: "Action2", callback: callback2Mock },
        ]}
      />
    );

    const actionsButton = screen.getByText(/Actions/i);
    fireEvent.click(actionsButton);

    const action1Button = screen.getByText(/Action1/i);
    fireEvent.click(action1Button);

    expect(callback1Mock).toHaveBeenCalledTimes(1);

    fireEvent.click(actionsButton);
    const action2Button = screen.getByText(/Action2/i);
    fireEvent.click(action2Button);

    expect(callback2Mock).toHaveBeenCalledTimes(1);
  });
});
