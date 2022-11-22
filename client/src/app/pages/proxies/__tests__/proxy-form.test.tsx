import React from "react";
import "@testing-library/jest-dom";
import {
  render,
  waitFor,
  screen,
  fireEvent,
} from "@app/test-config/test-utils";

import { Proxies } from "../proxies";
import MockAdapter from "axios-mock-adapter";
import { IDENTITIES, PROXIES } from "@app/api/rest";
import axios from "axios";
import { Proxy, Identity } from "@app/api/models";
import userEvent from "@testing-library/user-event";
import { ProxyForm } from "../proxy-form";
import mock from "@app/test-config/mockInstance";

const identitiesData: Identity[] = [];
mock.onGet(`${IDENTITIES}`).reply(200, identitiesData);

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
mock.onGet(`${PROXIES}`).reply(200, proxiesData);

describe("Component: proxy-form", () => {
  it("Display switch statements on initial load", async () => {
    render(<Proxies />);
    await screen.findByLabelText("HTTP proxy");

    await screen.findByLabelText("HTTPS proxy");
  });

  it("Show HTTP proxy form when switch button clicked", async () => {
    render(<Proxies />);
    const httpProxySwitch = await screen.findByLabelText("HTTP proxy");

    fireEvent.click(httpProxySwitch);
    await screen.findByLabelText("HTTP proxy host *");
    await waitFor(() =>
      expect(
        screen.queryByLabelText("HTTPS proxy host *")
      ).not.toBeInTheDocument()
    );
  });

  it("Show HTTPS proxy form when switch button clicked", async () => {
    render(<Proxies />);
    const httpsProxySwitch = await screen.findByLabelText("HTTPS proxy");

    fireEvent.click(httpsProxySwitch);
    await screen.findByLabelText("HTTPS proxy host *");
    await waitFor(() =>
      expect(
        screen.queryByLabelText("HTTP proxy host *")
      ).not.toBeInTheDocument()
    );
  });

  it("Select http proxy identity", async () => {
    const identitiesData: Identity[] = [
      { id: 0, name: "proxy-cred", kind: "proxy" },
      { id: 1, name: "maven-cred", kind: "maven" },
      { id: 2, name: "source-cred", kind: "source" },
    ];

    mock.onGet(`${IDENTITIES}`).reply(200, identitiesData);

    render(<Proxies />);
    const httpProxySwitch = await screen.findByLabelText("HTTP proxy");
    fireEvent.click(httpProxySwitch);
    const httpProxyIdentitySwitch = await screen.findByLabelText(
      "HTTP proxy credentials"
    );
    fireEvent.click(httpProxyIdentitySwitch);
    fireEvent.click(
      screen.getByRole("button", {
        name: /Options menu/i,
      })
    );

    await waitFor(
      () =>
        userEvent.selectOptions(screen.getByRole("listbox"), ["proxy-cred"]),
      {
        timeout: 3000,
      }
    );
    const proxyCred = screen.getByText("proxy-cred");
    expect(proxyCred).toBeInTheDocument();
    const mavenCred = screen.queryByText("maven-cred");
    const sourceCred = screen.queryByText("source-cred");
    expect(mavenCred).toBeNull(); // it doesn't exist
    expect(sourceCred).toBeNull(); // it doesn't exist
  });

  it("Select https proxy identity", async () => {
    const identitiesData: Identity[] = [
      { id: 0, name: "proxy-cred", kind: "proxy" },
      { id: 1, name: "maven-cred", kind: "maven" },
      { id: 2, name: "source-cred", kind: "source" },
    ];

    mock.onGet(`${IDENTITIES}`).reply(200, identitiesData);

    render(<Proxies />);
    const httpsProxySwitch = await screen.findByLabelText("HTTPS proxy");
    fireEvent.click(httpsProxySwitch);
    const httpsProxyIdentitySwitch = await screen.findByLabelText(
      "HTTPS proxy credentials"
    );
    fireEvent.click(httpsProxyIdentitySwitch);
    fireEvent.click(
      screen.getByRole("button", {
        name: /Options menu/i,
      })
    );

    await waitFor(
      () =>
        userEvent.selectOptions(screen.getByRole("listbox"), ["proxy-cred"]),
      {
        timeout: 3000,
      }
    );
    const proxyCred = screen.getByText("proxy-cred");
    expect(proxyCred).toBeInTheDocument();
    const mavenCred = screen.queryByText("maven-cred");
    const sourceCred = screen.queryByText("source-cred");
    expect(mavenCred).toBeNull(); // it doesn't exist
    expect(sourceCred).toBeNull(); // it doesn't exist
  });
});
