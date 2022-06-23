import React from "react";
import "@testing-library/jest-dom";
import {
  render,
  waitFor,
  screen,
  fireEvent,
  queryByTestId,
} from "@app/test-config/test-utils";

import { Proxies } from "../proxies";
import MockAdapter from "axios-mock-adapter";
import { IDENTITIES, PROXIES } from "@app/api/rest";
import axios from "axios";
import { Proxy, Identity } from "@app/api/models";
import userEvent from "@testing-library/user-event";

jest.mock("react-i18next");
const identitiesData: Identity[] = [
  { id: 0, name: "proxy-cred", kind: "proxy" },
  { id: 1, name: "cred2", kind: "maven" },
  { id: 2, name: "cred3", kind: "source" },
];
new MockAdapter(axios).onGet(`${IDENTITIES}`).reply(200, identitiesData);

const proxiesData = [
  {
    host: "",
    kind: "http",
    port: 0,
    excluded: [],
    identity: null,
    id: 1,
    enabled: false,
  },
  {
    host: "",
    kind: "https",
    port: 0,
    excluded: [],
    identity: null,
    id: 1,
    enabled: false,
  },
];
new MockAdapter(axios).onGet(`${PROXIES}`).reply(200, proxiesData);

describe("Component: proxy-form", () => {
  it("Display switch statements on initial load", async () => {
    render(<Proxies />);
    await waitFor(() => screen.getByTestId("http-proxy-switch"), {
      timeout: 3000,
    });

    await waitFor(() => screen.getByTestId("https-proxy-switch"), {
      timeout: 3000,
    });
  });

  it("Show HTTP proxy form when switch button clicked", async () => {
    render(<Proxies />);
    await waitFor(() => screen.getByTestId("http-proxy-switch"), {
      timeout: 3000,
    });

    fireEvent.click(screen.getByTestId("http-proxy-switch"));
    await waitFor(() =>
      expect(screen.queryByTestId("http-host-input")).toBeInTheDocument()
    );
    await waitFor(() =>
      expect(screen.queryByTestId("https-host-input")).not.toBeInTheDocument()
    );
  });

  it("Show HTTPS proxy form when switch button clicked", async () => {
    render(<Proxies />);
    await waitFor(() => screen.getByTestId("https-proxy-switch"), {
      timeout: 3000,
    });

    fireEvent.click(screen.getByTestId("https-proxy-switch"));
    await waitFor(() =>
      expect(screen.queryByTestId("https-host-input")).toBeInTheDocument()
    );
    await waitFor(() =>
      expect(screen.queryByTestId("http-host-input")).not.toBeInTheDocument()
    );
  });

  it("Select http proxy identity", async () => {
    render(<Proxies />);
    await waitFor(() => screen.getByTestId("http-proxy-switch"), {
      timeout: 3000,
    });

    fireEvent.click(screen.getByTestId("http-proxy-switch"));
    await waitFor(() =>
      expect(
        screen.queryByTestId("http-proxy-identity-switch")
      ).toBeInTheDocument()
    );
    fireEvent.click(screen.getByTestId("http-proxy-identity-switch"));
    fireEvent.click(
      screen.getByRole("button", {
        name: /Options menu/i,
      })
    );
    // fireEvent.click(
    //   screen.getByRole("listbox", {
    //     name: /httpIdentity/i,
    //   })
    // );
    const selectBox = screen.getByRole("listbox", {
      name: /httpIdentity/i,
    });

    userEvent.selectOptions(
      selectBox,
      screen.getByRole("option", {
        name: /proxy-cred/i,
      })
    );
    const option = screen.getByRole("option", {
      name: "proxy-cred",
    }) as HTMLInputElement;

    expect(option).selected.toBe(true);

    // await userEvent.click(screen.getByRole("button", { name: /click me!/i }));
    // userEvent.selectOptions(screen.getByRole("listbox"), ["proxy-cred"]);
    // userEvent.selectOptions(screen.getByText("proxy-cred"), "proxy-cred");
    // const title = screen.getByText("proxy-cred") as HTMLInputElement;

    // expect(screen.getByRole("option", { name: "proxy-cred" }).selected).toBe(
    //   true
    // );

    // expect(screen.getByRole("option", { name: "proxy-cred" }).selected).toBe(true);

    // userEvent.selectOptions(
    //   // Find the select element
    //   screen.getByRole('combobox'),
    //   // Find and select the Ireland option
    //   screen.getByRole('option', {name: 'Ireland'}),
    // )
    // await waitFor(() =>
    //   expect(screen.queryByTestId("http-host-input")).not.toBeInTheDocument()
    // );
  });
});
