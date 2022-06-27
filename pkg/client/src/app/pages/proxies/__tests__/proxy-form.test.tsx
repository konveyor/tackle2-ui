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

jest.mock("react-i18next");
const identitiesData: Identity[] = [{ id: 0, name: "cred1" }];
new MockAdapter(axios).onGet(`${IDENTITIES}`).reply(200, identitiesData);

const proxiesData = [
  // const proxiesData: Proxy[] = [
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
});
