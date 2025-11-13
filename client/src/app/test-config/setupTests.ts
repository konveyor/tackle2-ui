// init @testing-library
import "@testing-library/jest-dom";
import { configure } from "@testing-library/react";

import { server } from "@mocks/server";

// initialize libraries like is done in ../../index.tsx
import "@app/dayjs";
import "@app/yup";

configure({ reactStrictMode: true });

const mockInitialized = false;

jest.mock("@react-keycloak/web", () => {
  const originalModule = jest.requireActual("@react-keycloak/web");
  return {
    ...originalModule,
    useKeycloak: () => [mockInitialized],
  };
});

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useLocation: () => ({
    pathname: "localhost:3000/example/path",
  }),
}));

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Uncomment the following to see request logging in the console:

// server.events.on("request:start", (req) => {
//   console.log(`Handling a request to ${req.url.href}`);
// });

// server.events.on("request:match", (req) => {
//   console.log(`Request to ${req.url.href} was matched with a handler`);
// });

server.events.on("request:unhandled", (req) => {
  console.warn(`Request to ${req.url.href} was not handled`);
});
