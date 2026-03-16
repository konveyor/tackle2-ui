import "@app/yup"; // Import custom yup methods
import { UploadFile } from "@app/api/models";

import { CustomRulesStepValues, useCustomRulesSchema } from "./custom-rules";

// Helper to create a valid UploadFile object for testing
const createMockUploadFile = (
  overrides: Partial<UploadFile> = {}
): UploadFile => ({
  fileName: "test-rule.yaml",
  fullFile: new File(["content"], "test-rule.yaml"),
  uploadProgress: 100,
  status: "validated",
  ...overrides,
});

describe("useCustomRulesSchema", () => {
  describe("when rulesKind is 'manual'", () => {
    describe("with isCustomRuleRequired = false", () => {
      const schema = useCustomRulesSchema({ isCustomRuleRequired: false });

      it("should validate with empty customRulesFiles", async () => {
        const data: CustomRulesStepValues = {
          rulesKind: "manual",
          customRulesFiles: [],
          customLabels: [],
        };

        await expect(schema.validate(data)).resolves.toBeDefined();
      });

      it("should validate with customRulesFiles provided", async () => {
        const data: CustomRulesStepValues = {
          rulesKind: "manual",
          customRulesFiles: [createMockUploadFile()],
          customLabels: [],
        };

        await expect(schema.validate(data)).resolves.toBeDefined();
      });

      it("should validate with customLabels containing data", async () => {
        const data: CustomRulesStepValues = {
          rulesKind: "manual",
          customRulesFiles: [createMockUploadFile()],
          customLabels: [
            { name: "label1", label: "value1" },
            { name: "label2", label: "value2" },
          ],
        };

        await expect(schema.validate(data)).resolves.toBeDefined();
      });

      it("should validate with empty customLabels", async () => {
        const data: CustomRulesStepValues = {
          rulesKind: "manual",
          customRulesFiles: [createMockUploadFile()],
          customLabels: [],
        };

        await expect(schema.validate(data)).resolves.toBeDefined();
      });
    });

    describe("with isCustomRuleRequired = true", () => {
      const schema = useCustomRulesSchema({ isCustomRuleRequired: true });

      it("should reject when customRulesFiles is empty", async () => {
        const data: CustomRulesStepValues = {
          rulesKind: "manual",
          customRulesFiles: [],
          customLabels: [],
        };

        await expect(schema.validate(data)).rejects.toThrow();
      });

      it("should validate when customRulesFiles has at least one file", async () => {
        const data: CustomRulesStepValues = {
          rulesKind: "manual",
          customRulesFiles: [createMockUploadFile()],
          customLabels: [],
        };

        await expect(schema.validate(data)).resolves.toBeDefined();
      });

      it("should validate with multiple customRulesFiles", async () => {
        const data: CustomRulesStepValues = {
          rulesKind: "manual",
          customRulesFiles: [
            createMockUploadFile({ fileName: "rule1.yaml" }),
            createMockUploadFile({ fileName: "rule2.yaml" }),
          ],
          customLabels: [],
        };

        await expect(schema.validate(data)).resolves.toBeDefined();
      });

      it("should validate with customRulesFiles and customLabels", async () => {
        const data: CustomRulesStepValues = {
          rulesKind: "manual",
          customRulesFiles: [createMockUploadFile()],
          customLabels: [{ name: "testLabel", label: "testValue" }],
        };

        await expect(schema.validate(data)).resolves.toBeDefined();
      });
    });
  });

  function repositoryData(
    overrides: Partial<CustomRulesStepValues> = {}
  ): CustomRulesStepValues {
    return {
      rulesKind: "repository",
      customRulesFiles: [],
      customLabels: [],
      ...overrides,
    };
  }

  describe("when rulesKind is 'repository'", () => {
    const schema = useCustomRulesSchema({ isCustomRuleRequired: false });

    it("should reject when repositoryType is missing", async () => {
      const data = repositoryData({
        sourceRepository: "https://github.com/test/repo.git",
      });

      await expect(schema.validate(data)).rejects.toThrow();
    });

    it("should reject when sourceRepository is missing", async () => {
      const data = repositoryData({ repositoryType: "git" });

      await expect(schema.validate(data)).rejects.toThrow();
    });

    it("should reject when repositoryType is invalid", async () => {
      const data = repositoryData({ repositoryType: "invalid" });

      await expect(schema.validate(data)).rejects.toThrow();
    });

    it("should validate with repositoryType 'git' and valid sourceRepository", async () => {
      const data = repositoryData({
        repositoryType: "git",
        sourceRepository: "https://github.com/test/repo.git",
      });

      await expect(schema.validate(data)).resolves.toBeDefined();
    });

    it("should validate with repositoryType 'svn' and valid sourceRepository", async () => {
      const data = repositoryData({
        repositoryType: "svn",
        sourceRepository: "https://svn.example.com/repo",
      });

      await expect(schema.validate(data)).resolves.toBeDefined();
    });

    describe("optional fields (branch, rootPath, associatedCredentials)", () => {
      it("should validate without branch, rootPath and associatedCredentials", async () => {
        const data = repositoryData({
          repositoryType: "git",
          sourceRepository: "https://github.com/test/repo.git",
        });

        await expect(schema.validate(data)).resolves.toBeDefined();
      });

      it("should validate with branch provided", async () => {
        const data = repositoryData({
          repositoryType: "git",
          sourceRepository: "https://github.com/test/repo.git",
          branch: "main",
        });

        await expect(schema.validate(data)).resolves.toBeDefined();
      });

      it("should validate with rootPath provided", async () => {
        const data = repositoryData({
          repositoryType: "git",
          sourceRepository: "https://github.com/test/repo.git",
          rootPath: "/rules",
        });

        await expect(schema.validate(data)).resolves.toBeDefined();
      });

      it("should validate with associatedCredentials provided", async () => {
        const data = repositoryData({
          repositoryType: "git",
          sourceRepository: "https://github.com/test/repo.git",
          associatedCredentials: "credential-id-123",
        });

        await expect(schema.validate(data)).resolves.toBeDefined();
      });

      it("should validate with all optional fields provided", async () => {
        const data = repositoryData({
          repositoryType: "git",
          sourceRepository: "https://github.com/test/repo.git",
          branch: "develop",
          rootPath: "/custom-rules",
          associatedCredentials: "my-credentials",
        });

        await expect(schema.validate(data)).resolves.toBeDefined();
      });
    });
  });

  describe("customRulesFiles requirement does not apply to repository mode", () => {
    const schema = useCustomRulesSchema({ isCustomRuleRequired: true });

    it("should validate repository mode with empty customRulesFiles even when isCustomRuleRequired is true", async () => {
      const data: CustomRulesStepValues = {
        rulesKind: "repository",
        customRulesFiles: [],
        customLabels: [],
        repositoryType: "git",
        sourceRepository: "https://github.com/test/repo.git",
      };

      await expect(schema.validate(data)).resolves.toBeDefined();
    });
  });
});
