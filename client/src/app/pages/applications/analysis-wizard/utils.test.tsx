import { Application, Target, TargetLabel } from "@app/api/models";

import { isModeSupported, updateSelectedTargetLabels } from "./utils";

const TARGET_LABELS: TargetLabel[] = [
  {
    name: "alpha",
    label: "konveyor.io/target=alpha",
  },
  {
    name: "bravo",
    label: "konveyor.io/target=bravo",
  },
  {
    name: "charlie",
    label: "konveyor.io/target=charlie",
  },
];

const TARGET_A: Target = {
  id: 1,
  name: "target A",
  ruleset: {
    id: 1,
    name: "ruleset 1",
    description: "ruleset 1 description",
    rules: [
      {
        name: "ruleset 1",
      },
    ],
  },
  labels: TARGET_LABELS,
};

const TARGET_B: Target = {
  id: 1,
  name: "target B",
  ruleset: {
    id: 1,
    name: "ruleset 1",
    description: "ruleset 1 description",
    rules: [
      {
        name: "ruleset 1",
      },
    ],
  },
  labels: [
    {
      name: "mike",
      label: "konveyor.io/target=mike",
    },
    {
      name: "november",
      label: "konveyor.io/target=november",
    },
    {
      name: "oscar",
      label: "konveyor.io/target=oscar",
    },
  ],
};

describe("analysis-wizard utils - isModeSupported()", () => {
  it("should return true for binary-upload mode regardless of application state", () => {
    const application: Application = {
      id: 1,
      name: "Test App",
      migrationWave: null,
    };
    expect(isModeSupported(application, "binary-upload")).toBe(true);
  });

  it("should return true for binary mode when application has valid binary format", () => {
    const application: Application = {
      id: 1,
      name: "Test App",
      binary: "group:artifact:version",
      migrationWave: null,
    };
    expect(isModeSupported(application, "binary")).toBe(true);
  });

  it("should return false for binary mode when application binary is missing", () => {
    const application: Application = {
      id: 1,
      name: "Test App",
      migrationWave: null,
    };
    expect(isModeSupported(application, "binary")).toBe(false);
  });

  it("should return false for binary mode when application binary is empty", () => {
    const application: Application = {
      id: 1,
      name: "Test App",
      binary: "",
      migrationWave: null,
    };
    expect(isModeSupported(application, "binary")).toBe(false);
  });

  it("should return false for binary mode when application binary does not match pattern", () => {
    const application: Application = {
      id: 1,
      name: "Test App",
      binary: "invalid-format",
      migrationWave: null,
    };
    expect(isModeSupported(application, "binary")).toBe(false);
  });

  it("should return true for source-code-deps mode when repository URL exists", () => {
    const application: Application = {
      id: 1,
      name: "Test App",
      repository: {
        url: "https://github.com/user/repo.git",
      },
      migrationWave: null,
    };
    expect(isModeSupported(application, "source-code-deps")).toBe(true);
  });

  it("should return false for source-code-deps mode when repository URL is missing", () => {
    const application: Application = {
      id: 1,
      name: "Test App",
      migrationWave: null,
    };
    expect(isModeSupported(application, "source-code-deps")).toBe(false);
  });

  it("should return false for source-code-deps mode when repository URL is empty", () => {
    const application: Application = {
      id: 1,
      name: "Test App",
      repository: {
        url: "",
      },
      migrationWave: null,
    };
    expect(isModeSupported(application, "source-code-deps")).toBe(false);
  });

  it("should return true for source-code mode when repository URL exists", () => {
    const application: Application = {
      id: 1,
      name: "Test App",
      repository: {
        url: "https://github.com/user/repo.git",
      },
      migrationWave: null,
    };
    expect(isModeSupported(application, "source-code")).toBe(true);
  });

  it("should return false for source-code mode when repository URL is missing", () => {
    const application: Application = {
      id: 1,
      name: "Test App",
      migrationWave: null,
    };
    expect(isModeSupported(application, "source-code")).toBe(false);
  });

  it("should return false for source-code mode when repository URL is empty", () => {
    const application: Application = {
      id: 1,
      name: "Test App",
      repository: {
        url: "",
      },
      migrationWave: null,
    };
    expect(isModeSupported(application, "source-code")).toBe(false);
  });

  it("should return false for undefined mode", () => {
    const application: Application = {
      id: 1,
      name: "Test App",
      migrationWave: null,
    };
    expect(isModeSupported(application, undefined)).toBe(false);
  });

  it("should return false for unknown mode", () => {
    const application: Application = {
      id: 1,
      name: "Test App",
      migrationWave: null,
    };
    expect(isModeSupported(application, "unknown-mode")).toBe(false);
  });
});

describe("analysis-wizard utils - updateSelectedTargetLabels()", () => {
  it("add a label to an empty list", () => {
    const theResult = updateSelectedTargetLabels(
      true,
      TARGET_LABELS[1].name,
      TARGET_A,
      []
    );
    expect(theResult).toStrictEqual([TARGET_LABELS[1]]);
  });

  it("add a label to a list with a label", () => {
    const theResult = updateSelectedTargetLabels(
      true,
      TARGET_A.labels![1].name,
      TARGET_A,
      [TARGET_LABELS[0]]
    );
    expect(theResult).toStrictEqual([TARGET_LABELS[0], TARGET_LABELS[1]]);
  });

  it("add a label to a list with with multiple labels", () => {
    const theResult = updateSelectedTargetLabels(
      true,
      TARGET_A.labels![2].name,
      TARGET_A,
      [TARGET_LABELS[0], TARGET_LABELS[1]]
    );
    expect(theResult).toStrictEqual([
      TARGET_LABELS[0],
      TARGET_LABELS[1],
      TARGET_A.labels![2],
    ]);
  });

  it("add a label from target B to a list with a label from target A", () => {
    const labelA = TARGET_A.labels![0];
    const labelB = TARGET_B.labels![0];

    const theResult = updateSelectedTargetLabels(true, labelB.name, TARGET_B, [
      labelA,
    ]);
    expect(theResult).toStrictEqual([labelA, labelB]);
  });

  it("remove a label from an empty list", () => {
    const label = TARGET_B.labels![0];

    const theResult = updateSelectedTargetLabels(
      false,
      label.name,
      TARGET_B,
      []
    );
    expect(theResult).toStrictEqual([]);
  });

  it("remove a label", () => {
    const label = TARGET_B.labels![0];

    const theResult = updateSelectedTargetLabels(false, label.name, TARGET_B, [
      TARGET_LABELS[0],
      label,
    ]);
    expect(theResult).toStrictEqual([TARGET_LABELS[0]]);
  });

  it("remove a label from the middle of a list", () => {
    const label = TARGET_B.labels![0];

    const theResult = updateSelectedTargetLabels(false, label.name, TARGET_B, [
      TARGET_LABELS[0],
      label,
      TARGET_LABELS[1],
      TARGET_LABELS[2],
    ]);
    expect(theResult).toStrictEqual([
      TARGET_LABELS[0],
      TARGET_LABELS[1],
      TARGET_LABELS[2],
    ]);
  });
});
