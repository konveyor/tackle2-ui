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

const data: any[] = [];

mock.onGet(`${IDENTITIES}`).reply(200, data);

describe("Component: identity-form", () => {
  const mockChangeValue = jest.fn();

  it("Display form on initial load", async () => {
    render(
      <IdentityForm onCancel={mockChangeValue} onSaved={mockChangeValue} />
    );
    const identityNameInput = await screen.findByLabelText("Name *");
    expect(identityNameInput).toBeInTheDocument();

    const descriptionInput = await screen.findByLabelText("Description *");
    expect(descriptionInput).toBeInTheDocument();

    const typeSelector = await screen.findByLabelText(
      "Type select dropdown toggle"
    );
    expect(typeSelector).toBeInTheDocument();
  });

  it("Check dynamic form rendering", async () => {
    render(
      <IdentityForm onCancel={mockChangeValue} onSaved={mockChangeValue} />
    );
    const typeSelector = await screen.findByLabelText(
      "Type select dropdown toggle"
    );

    fireEvent.click(typeSelector);

    const sourceControlOption = await screen.findByText("Source Control");

    fireEvent.click(sourceControlOption);

    const userCredentialsSelector = await screen.findByLabelText(
      "User credentials select dropdown toggle"
    );
    expect(userCredentialsSelector).toBeInTheDocument();

    fireEvent.click(userCredentialsSelector);

    const userPassOption = await screen.findByText("Username/Password");

    fireEvent.click(userPassOption);

    const userInput = await screen.findByLabelText("Username *");
    expect(userInput).toBeInTheDocument();

    const passwordInput = await screen.findByLabelText("Password *");
    expect(passwordInput).toBeInTheDocument();

    fireEvent.click(userCredentialsSelector);

    const sourceOption = await screen.findByText(
      "Source Private Key/Passphrase"
    );

    fireEvent.click(sourceOption);

    const credentialKeyFileUpload = await screen.findByLabelText(
      "Upload your [SCM Private Key] file or paste its contents below. *"
    );
    expect(credentialKeyFileUpload).toBeInTheDocument();

    const credentialKeyPassphrase = await screen.findByLabelText(
      "Private Key Passphrase"
    );
    expect(credentialKeyPassphrase).toBeInTheDocument();

    fireEvent.click(typeSelector);

    const mavenSettingsOption = await screen.findByText("Maven Settings File");

    fireEvent.click(mavenSettingsOption);

    const mavenSettingsUpload = await screen.findByLabelText(
      "Upload your Settings file or paste its contents below. *"
    );
    expect(mavenSettingsUpload).toBeInTheDocument();

    fireEvent.click(typeSelector);

    const proxyOption = await screen.findByText("Proxy");

    fireEvent.click(proxyOption);

    const proxyUserInput = await screen.findByLabelText("Username *");
    expect(proxyUserInput).toBeInTheDocument();

    const proxyPasswordInput = await screen.findByLabelText("Password");
    expect(proxyPasswordInput).toBeInTheDocument();
  });

  it("Identity form validation test - source - username/password", async () => {
    render(
      <IdentityForm onCancel={mockChangeValue} onSaved={mockChangeValue} />
    );

    const identityNameInput = await screen.findByLabelText("Name *");

    fireEvent.change(identityNameInput, {
      target: { value: "identity-name" },
    });

    const typeSelector = await screen.findByLabelText(
      "Type select dropdown toggle"
    );

    fireEvent.click(typeSelector);

    const sourceControlOption = await screen.findByText("Source Control");

    fireEvent.click(sourceControlOption);

    const userCredentialsSelector = await screen.findByLabelText(
      "User credentials select dropdown toggle"
    );

    fireEvent.click(userCredentialsSelector);

    const userPassOption = await screen.findByText("Username/Password");

    fireEvent.click(userPassOption);

    const userInput = await screen.findByLabelText("Username *");

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

    const passwordInput = await screen.findByLabelText("Password *");

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

    const identityNameInput = await screen.findByLabelText("Name *");

    fireEvent.change(identityNameInput, {
      target: { value: "identity-name" },
    });

    const typeSelector = await screen.findByLabelText(
      "Type select dropdown toggle"
    );

    fireEvent.click(typeSelector);

    const sourceControlOption = await screen.findByText("Source Control");

    fireEvent.click(sourceControlOption);

    const userCredentialsSelector = await screen.findByLabelText(
      "User credentials select dropdown toggle"
    );

    fireEvent.click(userCredentialsSelector);

    const keyOption = await screen.findByText("Source Private Key/Passphrase");

    fireEvent.click(keyOption);

    const keyUpload = await screen.findByLabelText(
      "Upload your [SCM Private Key] file or paste its contents below. *"
    );

    //TODO:
    // Unable to test file upload due to lack of ID in PF code.
    //We need an ID field for the input with type=file for the drop event to work

    await waitFor(
      () =>
        fireEvent.change(keyUpload, {
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

    const identityNameInput = await screen.findByLabelText("Name *");

    fireEvent.change(identityNameInput, {
      target: { value: "identity-name" },
    });

    const typeSelector = await screen.findByLabelText(
      "Type select dropdown toggle"
    );

    fireEvent.click(typeSelector);

    const mavenOption = await screen.findByText("Maven Settings File");

    fireEvent.click(mavenOption);

    const mavenUpload = await screen.findByLabelText(
      "Upload your Settings file or paste its contents below. *"
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
        fireEvent.change(mavenUpload, {
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

    const identityNameInput = await screen.findByLabelText("Name *");

    fireEvent.change(identityNameInput, {
      target: { value: "identity-name" },
    });

    const typeSelector = await screen.findByLabelText(
      "Type select dropdown toggle"
    );

    fireEvent.click(typeSelector);

    const proxyOption = await screen.findByText("Proxy");

    fireEvent.click(proxyOption);

    const proxyUserInput = await screen.findByLabelText("Username *");
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

    const proxyPasswordInput = await screen.findByLabelText("Password");

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
