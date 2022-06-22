import React from "react";
import "@testing-library/jest-dom";
import { render, waitFor, screen } from "@app/test-config/test-utils";

import { Proxies } from "../proxies";
import MockAdapter from "axios-mock-adapter";
import { IDENTITIES } from "@app/api/rest";
import axios from "axios";

jest.mock("react-i18next");
const responseData = [{ id: 0, name: "cred1" }];
new MockAdapter(axios).onGet(`${IDENTITIES}`).reply(200, responseData);

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
});
