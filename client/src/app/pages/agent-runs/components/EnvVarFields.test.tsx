import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { RUN_ENV } from "@app/api/agentic/contract";

import {
  EnvVarFields,
  envRowProblem,
  envRowsFromRun,
  envRowsInvalid,
  envRowsToSpec,
  newEnvRow,
} from "./EnvVarFields";

describe("envRowsFromRun", () => {
  it("keeps user variables", () => {
    expect(
      envRowsFromRun([{ name: "MAVEN_SETTINGS_XML", value: "/etc/m2.xml" }])
    ).toEqual([
      expect.objectContaining({
        name: "MAVEN_SETTINGS_XML",
        value: "/etc/m2.xml",
      }),
    ]);
  });

  // The Hub re-injects these, so showing them would offer the user
  // control they do not have.
  it("drops the names the run sets for itself", () => {
    const rows = envRowsFromRun([
      { name: RUN_ENV.APP_ID, value: "2" },
      { name: RUN_ENV.TARGET_BRANCH, value: "konveyor/migration-1" },
      { name: "KEEP", value: "yes" },
    ]);
    expect(rows.map((r) => r.name)).toEqual(["KEEP"]);
  });

  // HUB_TOKEN arrives as a secret reference; a text input cannot hold one.
  it("drops entries with no plain value", () => {
    expect(envRowsFromRun([{ name: "FROM_SECRET" }])).toEqual([]);
  });
});

describe("envRowsToSpec", () => {
  it("is undefined when nothing was entered", () => {
    expect(envRowsToSpec([])).toBeUndefined();
    expect(envRowsToSpec([newEnvRow()])).toBeUndefined();
  });

  it("trims names and keeps values verbatim", () => {
    expect(envRowsToSpec([newEnvRow("  A  ", " keep me ")])).toEqual([
      { name: "A", value: " keep me " },
    ]);
  });
});

describe("envRowProblem", () => {
  const problemOf = (name: string, value = "x") =>
    envRowProblem([newEnvRow(name, value)], 0);

  it("accepts an ordinary name", () => {
    expect(problemOf("MAVEN_SETTINGS_XML")).toBeUndefined();
  });

  it("leaves an untouched empty row alone", () => {
    expect(envRowProblem([newEnvRow()], 0)).toBeUndefined();
  });

  it("wants a name once a value is typed", () => {
    expect(problemOf("", "orphan")).toBe("required");
  });

  it("rejects a name a shell could not export", () => {
    expect(problemOf("2FA")).toBe("format");
    expect(problemOf("has-dash")).toBe("format");
  });

  it("rejects the names the run sets for itself", () => {
    expect(problemOf(RUN_ENV.TARGET_BRANCH)).toBe("reserved");
  });

  it("rejects a duplicate", () => {
    const rows = [newEnvRow("A", "1"), newEnvRow("A", "2")];
    expect(envRowProblem(rows, 1)).toBe("duplicate");
    expect(envRowsInvalid(rows)).toBe(true);
  });
});

describe("EnvVarFields", () => {
  it("adds a row and reports the change", async () => {
    const onChange = jest.fn();
    render(<EnvVarFields rows={[]} onChange={onChange} />);
    await userEvent.click(screen.getByText("agentic.runEnv.add"));
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ name: "", value: "" }),
    ]);
  });

  it("removes the row it is asked to", async () => {
    const onChange = jest.fn();
    const rows = [newEnvRow("A", "1"), newEnvRow("B", "2")];
    render(<EnvVarFields rows={rows} onChange={onChange} />);
    const removes = screen.getAllByRole("button", {
      name: "agentic.runEnv.remove",
    });
    await userEvent.click(removes[0]);
    expect(onChange).toHaveBeenCalledWith([rows[1]]);
  });

  it("shows why a reserved name is refused", () => {
    render(
      <EnvVarFields
        rows={[newEnvRow(RUN_ENV.APP_ID, "9")]}
        onChange={jest.fn()}
      />
    );
    expect(screen.getByText("agentic.runEnv.nameReserved")).toBeInTheDocument();
  });
});
