// init @testing-library
import "@testing-library/jest-dom";
import { configure } from "@testing-library/react";

import { server } from "@mocks/server";

// initialize libraries like is done in ../../index.tsx
import "@app/dayjs";
import "@app/yup";

configure({ reactStrictMode: true });

// Mock the auth module so tests don't need a real OIDC provider.
// useAuth returns a fully-authenticated state with admin roles by default.
// Override per-test with jest.spyOn(authModule, "useAuth").mockReturnValue(...)
jest.mock("@app/auth", () => {
  const actual = jest.requireActual("@app/auth");
  return {
    ...actual,
    useAuth: () => ({
      isLoaded: true,
      isAuthenticated: true,
      username: "test-user",
      realmRoles: ["tackle-admin", "tackle-architect", "tackle-migrator"],
      scopes: [],
      signIn: jest.fn(),
      signOut: jest.fn(),
      manageAccount: jest.fn(),
    }),
    useHasRealmRoles: () => true,
    useHasScopes: () => true,
  };
});

// Also mock react-oidc-context so any component that calls useAuth from
// react-oidc-context directly doesn't blow up without a provider.
jest.mock("react-oidc-context", () => ({
  useAuth: () => ({
    isLoading: false,
    isAuthenticated: true,
    user: null,
    error: undefined,
    signinRedirect: jest.fn(),
    signoutRedirect: jest.fn(),
  }),
  // useAutoSignin is called inside AuthReadyGate; no-op in tests.
  useAutoSignin: () => ({
    isLoading: false,
    isAuthenticated: true,
    error: undefined,
  }),
  // hasAuthParams checks the URL for OIDC callback params; always false in tests.
  hasAuthParams: () => false,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

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
