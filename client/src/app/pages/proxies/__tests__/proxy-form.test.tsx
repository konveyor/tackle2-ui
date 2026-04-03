import "@testing-library/jest-dom";
import { rest } from "msw";

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@app/test-config/test-utils";
import { server } from "@mocks/server";

import { Proxies } from "../proxies";

describe("Component: proxy-form", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    server.use(
      rest.get("/hub/proxies", (_, res, ctx) => res(ctx.json([]))),
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
  });

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
    render(<Proxies />);
    const httpProxySwitch = await screen.findByLabelText("HTTP proxy");
    fireEvent.click(httpProxySwitch);
    const httpProxyIdentitySwitch = await screen.findByLabelText(
      "HTTP proxy credentials"
    );
    fireEvent.click(httpProxyIdentitySwitch);

    const selectToggle = await screen.findByRole(
      "button",
      { name: /HTTP proxy credentials/i },
      { timeout: 3000 }
    );
    expect(selectToggle).toHaveTextContent("Select...");
    fireEvent.click(selectToggle);

    const httpOption = await screen.findByText(
      "proxy-cred",
      {},
      { timeout: 3000 }
    );
    fireEvent.click(httpOption);

    await waitFor(() => {
      expect(selectToggle).toHaveTextContent("proxy-cred");
      expect(screen.queryByText("maven-cred")).toBeNull();
      expect(screen.queryByText("source-cred")).toBeNull();
    });
  });

  it.each([
    "http://proxy.example.com",
    "https://proxy.example.com",
    "proxy.example.com/path",
    "proxy:8080",
    "bad host",
  ])("Rejects invalid HTTP proxy host: %s", async (invalidHost) => {
    render(<Proxies />);
    const httpProxySwitch = await screen.findByLabelText("HTTP proxy");
    fireEvent.click(httpProxySwitch);

    const hostInput = await screen.findByLabelText("HTTP proxy host *");
    fireEvent.change(hostInput, {
      target: { value: invalidHost },
    });
    fireEvent.blur(hostInput);

    await waitFor(() => {
      expect(
        screen.getByText("validation.invalidHostname")
      ).toBeInTheDocument();
    });
  });

  it.each([
    "http://proxy.example.com",
    "https://proxy.example.com",
    "proxy.example.com/path",
    "proxy:8080",
    "bad host",
  ])("Rejects invalid HTTPS proxy host: %s", async (invalidHost) => {
    render(<Proxies />);
    const httpsProxySwitch = await screen.findByLabelText("HTTPS proxy");
    fireEvent.click(httpsProxySwitch);

    const hostInput = await screen.findByLabelText("HTTPS proxy host *");
    fireEvent.change(hostInput, {
      target: { value: invalidHost },
    });
    fireEvent.blur(hostInput);

    await waitFor(() => {
      expect(
        screen.getByText("validation.invalidHostname")
      ).toBeInTheDocument();
    });
  });

  it("Select https proxy identity", async () => {
    render(<Proxies />);
    const httpsProxySwitch = await screen.findByLabelText("HTTPS proxy");
    fireEvent.click(httpsProxySwitch);
    const httpsProxyIdentitySwitch = await screen.findByLabelText(
      "HTTPS proxy credentials"
    );
    fireEvent.click(httpsProxyIdentitySwitch);

    const selectToggle = await screen.findByRole(
      "button",
      { name: /HTTPS proxy credentials/i },
      { timeout: 3000 }
    );
    expect(selectToggle).toHaveTextContent("Select...");
    fireEvent.click(selectToggle);

    const httpsOption = await screen.findByText(
      "proxy-cred",
      {},
      { timeout: 3000 }
    );
    fireEvent.click(httpsOption);

    await waitFor(() => {
      expect(selectToggle).toHaveTextContent("proxy-cred");
      expect(screen.queryByText("maven-cred")).toBeNull();
      expect(screen.queryByText("source-cred")).toBeNull();
    });
  });
});
