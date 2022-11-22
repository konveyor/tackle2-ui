// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// jest.mock("keycloak", () => ({
//   useKeycloak: () => {
//     return {};
//   },
// }));
let mockInitialized = false;

jest.mock("@react-keycloak/web", () => {
  const originalModule = jest.requireActual("@react-keycloak/web");
  return {
    ...originalModule,
    useKeycloak: () => [
      // mockKeycloakStub,
      mockInitialized,
    ],
  };
});

jest.mock("react-i18next", () => ({
  Trans: ({ children }: { children: any }) => {
    return children;
  },
  useTranslation: () => {
    return {
      t: (str: any) => str,
      i18n: {
        changeLanguage: () => new Promise(() => {}),
      },
    };
  },
}));

// We should migrate from enzyme to RTL rather than using both in tandem
// https://testing-library.com/docs/react-testing-library/migrate-from-enzyme/
