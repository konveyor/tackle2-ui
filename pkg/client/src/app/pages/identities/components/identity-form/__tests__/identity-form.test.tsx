import React from "react";
import {
  render,
  waitFor,
  screen,
  fireEvent,
  within,
} from "@app/test-config/test-utils";

import { IDENTITIES } from "@app/api/rest";
import mock from "@app/test-config/mockInstance";
import userEvent from "@testing-library/user-event";

import { IdentityForm } from "..";
import "@testing-library/jest-dom/extend-expect";
import "@testing-library/jest-dom";

jest.mock("react-i18next");

const data = [];

mock.onGet(`${IDENTITIES}`).reply(200, data);

describe("Component: identity-form", () => {
  const mockChangeValue = jest.fn();

  it("Display form on initial load", async () => {
    render(
      <IdentityForm onCancel={mockChangeValue} onSaved={mockChangeValue} />
    );
    const identityNameInput = await waitFor(() =>
      screen.getByLabelText("name")
    );
    expect(identityNameInput).toBeInTheDocument();

    const descriptionInput = await waitFor(() =>
      screen.getByLabelText("description")
    );
    expect(descriptionInput).toBeInTheDocument();

    const typeSelector = await waitFor(() =>
      screen.getByLabelText("credential-type-dropdown")
    );
    expect(typeSelector).toBeInTheDocument();
  });

  it("Check dynamic form rendering", async () => {
    render(
      <IdentityForm onCancel={mockChangeValue} onSaved={mockChangeValue} />
    );
    const typeSelector = await waitFor(() =>
      screen.getByLabelText("credential-type-dropdown")
    );

    fireEvent.click(typeSelector);

    const sourceControlOption = await waitFor(() =>
      screen.getByText("Source Control")
    );

    fireEvent.click(sourceControlOption);

    const userCredentialsSelector = await waitFor(() =>
      screen.getByLabelText("user-credentials-dropdown")
    );
    expect(userCredentialsSelector).toBeInTheDocument();

    fireEvent.click(userCredentialsSelector);

    const userPassOption = await waitFor(() =>
      screen.getByText("Username/Password")
    );

    fireEvent.click(userPassOption);

    const userInput = await waitFor(() => screen.getByLabelText("user"), {
      timeout: 3000,
    });
    expect(userInput).toBeInTheDocument();

    const passwordInput = await waitFor(
      () => screen.getByLabelText("password"),
      {
        timeout: 3000,
      }
    );
    expect(passwordInput).toBeInTheDocument();

    fireEvent.click(userCredentialsSelector);

    const sourceOption = await waitFor(() =>
      screen.getByText("Source Private Key/Passphrase")
    );

    fireEvent.click(sourceOption);

    const credentialKeyFileUpload = await waitFor(
      () => screen.getByLabelText("source-key-upload"),
      {
        timeout: 3000,
      }
    );
    expect(credentialKeyFileUpload).toBeInTheDocument();

    const credentialKeyPassphrase = await waitFor(
      () => screen.getByLabelText("private-key-passphrase"),
      {
        timeout: 3000,
      }
    );
    expect(credentialKeyPassphrase).toBeInTheDocument();

    fireEvent.click(typeSelector);

    const mavenSettingsOption = await waitFor(() =>
      screen.getByText("Maven Settings File")
    );

    fireEvent.click(mavenSettingsOption);

    const mavenSettingsUpload = await waitFor(() =>
      screen.getByLabelText("maven-settings-upload")
    );
    expect(mavenSettingsUpload).toBeInTheDocument();

    fireEvent.click(typeSelector);

    const proxyOption = await waitFor(() => screen.getByText("Proxy"));

    fireEvent.click(proxyOption);

    const proxyUserInput = await waitFor(() =>
      screen.getByLabelText("proxy-user")
    );
    expect(proxyUserInput).toBeInTheDocument();

    const proxyPasswordInput = await waitFor(() =>
      screen.getByLabelText("proxy-password")
    );
    expect(proxyPasswordInput).toBeInTheDocument();
  });

  it("Identity form validation test - source - username/password", async () => {
    render(
      <IdentityForm onCancel={mockChangeValue} onSaved={mockChangeValue} />
    );

    const identityNameInput = await waitFor(() =>
      screen.getByLabelText("name")
    );

    fireEvent.change(identityNameInput, {
      target: { value: "identity-name" },
    });

    const typeSelector = await waitFor(() =>
      screen.getByLabelText("credential-type-dropdown")
    );

    fireEvent.click(typeSelector);

    const sourceControlOption = await waitFor(() =>
      screen.getByText("Source Control")
    );

    fireEvent.click(sourceControlOption);

    const userCredentialsSelector = await waitFor(() =>
      screen.getByLabelText("user-credentials-dropdown")
    );

    fireEvent.click(userCredentialsSelector);

    const userPassOption = await waitFor(() =>
      screen.getByText("Username/Password")
    );

    fireEvent.click(userPassOption);

    const userInput = await waitFor(() => screen.getByLabelText("user"), {
      timeout: 3000,
    });

    await waitFor(
      () => {
        fireEvent.change(userInput, {
          target: { value: "username" },
        });
      },
      {
        timeout: 3000,
      }
    );

    const passwordInput = await waitFor(
      () => screen.getByLabelText("password"),
      {
        timeout: 3000,
      }
    );

    const createButton = screen.getByRole("button", { name: /submit/i });

    expect(createButton).not.toBeEnabled();

    await waitFor(
      () => {
        fireEvent.change(passwordInput, {
          target: { value: "password" },
        });
      },
      {
        timeout: 3000,
      }
    );

    expect(createButton).toBeEnabled();
  });

  it("Identity form validation test - source - key upload", async () => {
    render(
      <IdentityForm onCancel={mockChangeValue} onSaved={mockChangeValue} />
    );

    const identityNameInput = await waitFor(() =>
      screen.getByLabelText("name")
    );

    fireEvent.change(identityNameInput, {
      target: { value: "identity-name" },
    });

    const typeSelector = await waitFor(() =>
      screen.getByLabelText("credential-type-dropdown")
    );

    fireEvent.click(typeSelector);

    const sourceControlOption = await waitFor(() =>
      screen.getByText("Source Control")
    );

    fireEvent.click(sourceControlOption);

    const userCredentialsSelector = await waitFor(() =>
      screen.getByLabelText("user-credentials-dropdown")
    );

    fireEvent.click(userCredentialsSelector);

    const keyUploadOption = await waitFor(() =>
      screen.getByText("Source Private Key/Passphrase")
    );

    fireEvent.click(keyUploadOption);

    const settingsUploadOption = await waitFor(() =>
      screen.getByLabelText("source-key-upload")
    );

    //TODO:
    // Unable to test file upload due to lack of ID in PF code.
    //We need an ID field for the input with type=file for the drop event to work

    await waitFor(
      () =>
        fireEvent.change(settingsUploadOption, {
          target: { value: "test-key-contents" },
        }),

      {
        timeout: 3000,
      }
    );

    expect(screen.getByText("test-key-contents")).toBeInTheDocument();

    const createButton = screen.getByRole("button", { name: /submit/i });

    expect(createButton).toBeEnabled();
  });

  it("Identity form validation test - maven", async () => {
    render(
      <IdentityForm
        onCancel={mockChangeValue}
        onSaved={mockChangeValue}
        xmlValidator={jest.fn()}
      />
    );

    const identityNameInput = await waitFor(() =>
      screen.getByLabelText("name")
    );

    fireEvent.change(identityNameInput, {
      target: { value: "identity-name" },
    });

    const typeSelector = await waitFor(() =>
      screen.getByLabelText("credential-type-dropdown")
    );

    fireEvent.click(typeSelector);

    const mavenOption = await waitFor(() =>
      screen.getByText("Maven Settings File")
    );

    fireEvent.click(mavenOption);

    const mavenUploadOption = await waitFor(() =>
      screen.getByLabelText("maven-settings-upload")
    );

    //TODO:
    // Unable to test file upload due to lack of ID in PF code.
    //We need an ID field for the input with type=file for the drop event to work
    const testSettingsFile =
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<settings xmlns="http://maven.apache.org/SETTINGS/1.2.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.2.0 http://maven.apache.org/xsd/settings-1.2.0.xsd">' +
      "<profiles><profile><id>github</id></profile></profiles>" +
      "</settings>";
    await waitFor(
      () =>
        fireEvent.change(mavenUploadOption, {
          target: { value: testSettingsFile },
        }),

      {
        timeout: 3000,
      }
    );

    const createButton = screen.getByRole("button", { name: /submit/i });

    expect(createButton).toBeEnabled();
  });

  it("Identity form validation test - proxy", async () => {
    render(
      <IdentityForm
        onCancel={mockChangeValue}
        onSaved={mockChangeValue}
        xmlValidator={jest.fn()}
      />
    );

    const identityNameInput = await waitFor(() =>
      screen.getByLabelText("name")
    );

    fireEvent.change(identityNameInput, {
      target: { value: "identity-name" },
    });

    const typeSelector = await waitFor(() =>
      screen.getByLabelText("credential-type-dropdown")
    );

    fireEvent.click(typeSelector);

    const proxyOption = await waitFor(() => screen.getByText("Proxy"));

    fireEvent.click(proxyOption);

    const proxyUserInput = await waitFor(() =>
      screen.getByLabelText("proxy-user")
    );
    await waitFor(
      () => {
        fireEvent.change(proxyUserInput, {
          target: { value: "username" },
        });
      },
      {
        timeout: 3000,
      }
    );

    const proxyPasswordInput = await waitFor(() =>
      screen.getByLabelText("proxy-password")
    );

    await waitFor(
      () => {
        fireEvent.change(proxyPasswordInput, {
          target: { value: "password" },
        });
      },
      {
        timeout: 3000,
      }
    );

    const createButton = screen.getByRole("button", { name: /submit/i });

    expect(createButton).toBeEnabled();
  });
});
