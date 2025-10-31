import React from "react";
import "@testing-library/jest-dom";
import {
  render,
  waitFor,
  screen,
  fireEvent,
} from "@app/test-config/test-utils";

import { Proxies } from "../proxies";
import userEvent from "@testing-library/user-event";
import { server } from "@mocks/server";
import { rest } from "msw";

describe("Component: proxy-form", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterEach(() => {
    server.resetHandlers();
  });
  server.use(
    rest.get("/hub/identities", (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json([
          { id: 0, name: "proxy-cred", kind: "proxy" },
          { id: 1, name: "maven-cred", kind: "maven" },
          { id: 2, name: "source-cred", kind: "source" },
        ])
      );
    })
  );

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
    server.use(
      rest.get("/hub/identities", (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json([
            { id: 0, name: "proxy-cred", kind: "proxy" },
            { id: 1, name: "maven-cred", kind: "maven" },
            { id: 2, name: "source-cred", kind: "source" },
          ])
        );
      })
    );

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
    server.use(
      rest.get("/hub/identities", (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json([
            { id: 0, name: "proxy-cred", kind: "proxy" },
            { id: 1, name: "maven-cred", kind: "maven" },
            { id: 2, name: "source-cred", kind: "source" },
          ])
        );
      })
    );

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
