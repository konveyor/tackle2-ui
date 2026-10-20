import { isOperatorManaged, operatorManagedActionProps } from "./agentic";

const shipped = {
  metadata: {
    labels: { "app.kubernetes.io/managed-by": "agentic-controller-defaults" },
  },
};

describe("operator-managed defaults", () => {
  it("recognizes the operator's curated defaults by their marker label", () => {
    expect(isOperatorManaged(shipped)).toBe(true);
  });

  it("leaves user-created resources editable", () => {
    expect(isOperatorManaged({ metadata: {} })).toBe(false);
    expect(
      isOperatorManaged({
        metadata: { labels: { "app.kubernetes.io/managed-by": "kustomize" } },
      })
    ).toBe(false);
    // konveyor.io/managed means "needs Hub context", not "operator-owned".
    expect(
      isOperatorManaged({
        metadata: { labels: { "konveyor.io/managed": "true" } },
      })
    ).toBe(false);
    expect(operatorManagedActionProps({ metadata: {} }, "why")).toEqual({});
  });

  it("disables a row action with the reason as its tooltip", () => {
    expect(operatorManagedActionProps(shipped, "why")).toEqual({
      isAriaDisabled: true,
      tooltipProps: { content: "why" },
    });
  });
});
