import * as React from "react";
import { MemoryRouter } from "react-router-dom";

import { UploadFile } from "@app/api/models";
import { fireEvent, render, screen } from "@app/test-config/test-utils";

import { CustomRules } from "./custom-rules";

jest.mock("@app/queries/identities", () => ({
  useFetchIdentities: () => ({ identitiesByKind: {} }),
}));

const makeFile = (fileName: string): UploadFile => ({
  fileName,
  fullFile: new File(["x"], fileName),
  uploadProgress: 100,
  responseID: 1,
  status: "uploaded",
});

describe("CustomRules step", () => {
  it("keeps the manual rules table filter when switching tabs and back", () => {
    render(
      <MemoryRouter>
        <CustomRules
          isCustomRuleRequired={false}
          onStateChanged={jest.fn()}
          initialState={{
            rulesKind: "manual",
            customRulesFiles: [makeFile("alpha.yaml"), makeFile("beta.yaml")],
            customLabels: [],
            isValid: true,
          }}
        />
      </MemoryRouter>
    );

    const filter = screen.getByLabelText("terms.name filter");
    fireEvent.change(filter, { target: { value: "alpha" } });
    expect((filter as HTMLInputElement).value).toBe("alpha");

    fireEvent.click(screen.getByRole("tab", { name: "Repository" }));
    fireEvent.click(screen.getByRole("tab", { name: "Manual" }));

    const filterAfter = screen.getByLabelText("terms.name filter");
    expect((filterAfter as HTMLInputElement).value).toBe("alpha");
  });
});
