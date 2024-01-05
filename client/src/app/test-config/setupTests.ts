import "@testing-library/jest-dom";

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
