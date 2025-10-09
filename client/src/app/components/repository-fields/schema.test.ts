import * as yup from "yup";

import { yupRepositoryFields } from "./schema";
import "@app/yup"; // Import custom yup methods

const tt = (key: string) => key;

describe("yupRepositoryFields", () => {
  describe("custom translation function", () => {
    it("should use custom translation function for error messages", async () => {
      const customT = jest.fn((key: string) => `Custom: ${key}`);
      const schema = yupRepositoryFields({ t: customT, isRequired: true });

      await expect(
        schema.validate({
          kind: "",
        })
      ).rejects.toThrow("Custom: validation.repositoryTypeRequired");
      expect(customT).toHaveBeenCalled();
    });

    it("should use custom translation function with interpolation", async () => {
      const customT = jest.fn(
        (key: string, options?: Record<string, unknown>) => {
          if (key === "validation.maxLength") {
            return `Maximum ${options?.length} chars`;
          }
          return key;
        }
      );
      const schema = yupRepositoryFields({ t: customT });
      const longBranch = "a".repeat(251);

      await expect(
        schema.validate({
          kind: "git",
          url: "https://github.com/test/repo.git",
          branch: longBranch,
          path: "",
        })
      ).rejects.toThrow("Maximum 250 chars");
      expect(customT).toHaveBeenCalled();
    });
  });

  describe("basic validation", () => {
    it("should accept empty object when not required", async () => {
      const schema = yupRepositoryFields({ isRequired: false });
      await expect(schema.validate({})).resolves.toBeDefined();
    });

    it("should accept kind but empty url when not required", async () => {
      const schema = yupRepositoryFields({ isRequired: false });
      await expect(
        schema.validate({
          kind: "git",
          url: "",
        })
      ).resolves.toBeDefined();
    });

    it("should reject empty object when required", async () => {
      const schema = yupRepositoryFields({ isRequired: true });
      await expect(schema.validate({})).rejects.toThrow();
    });
  });

  describe("standalone schema", () => {
    describe("kind field", () => {
      it("should accept empty string when allowEmptyKind is true (default) without url", async () => {
        const schema = yupRepositoryFields();
        await expect(schema.validate({ kind: "" })).resolves.toBeDefined();
      });

      it("should accept 'git' as a valid kind with valid url", async () => {
        const schema = yupRepositoryFields();
        await expect(
          schema.validate({
            kind: "git",
            url: "https://github.com/test/repo.git",
          })
        ).resolves.toBeDefined();
      });

      it("should accept 'subversion' as a valid kind with valid url", async () => {
        const schema = yupRepositoryFields();
        await expect(
          schema.validate({
            kind: "subversion",
            url: "https://svn.example.com/repo",
          })
        ).resolves.toBeDefined();
      });

      it("should reject invalid kind values", async () => {
        const schema = yupRepositoryFields();
        await expect(
          schema.validate({
            kind: "invalid",
          })
        ).rejects.toThrow();
      });

      it("should reject empty string when allowEmptyKind is false", async () => {
        const schema = yupRepositoryFields({ allowEmptyKind: false });
        await expect(
          schema.validate({
            kind: "",
          })
        ).rejects.toThrow();
      });

      it("should require kind when url is provided", async () => {
        const schema = yupRepositoryFields({ t: tt });
        await expect(
          schema.validate({
            kind: "",
            url: "https://github.com/test/repo",
          })
        ).rejects.toThrow("validation.repositoryTypeRequiredWhen");
      });

      it("should require kind when branch is provided", async () => {
        const schema = yupRepositoryFields({ t: tt });
        await expect(
          schema.validate({
            kind: "",
            branch: "main",
          })
        ).rejects.toThrow("validation.repositoryTypeRequiredWhen");
      });

      it("should require kind when path is provided", async () => {
        const schema = yupRepositoryFields({ t: tt });
        await expect(
          schema.validate({
            kind: "",
            path: "/src",
          })
        ).rejects.toThrow("validation.repositoryTypeRequiredWhen");
      });

      it("should require kind when isRequired is true", async () => {
        const schema = yupRepositoryFields({ isRequired: true, t: tt });
        await expect(
          schema.validate({
            kind: "",
          })
        ).rejects.toThrow("validation.repositoryTypeRequired");
      });

      it("should require kind when isRequired function returns true", async () => {
        const schema = yupRepositoryFields({ isRequired: () => true, t: tt });
        await expect(
          schema.validate({
            kind: "",
          })
        ).rejects.toThrow("validation.repositoryTypeRequired");
      });

      it("should not require kind when isRequired function returns false", async () => {
        const schema = yupRepositoryFields({ isRequired: () => false });
        await expect(
          schema.validate({
            kind: "",
          })
        ).resolves.toBeDefined();
      });

      it("should restrict to custom allowed kinds", async () => {
        const schema = yupRepositoryFields({
          allowedKinds: ["git"],
          allowEmptyKind: false,
        });
        await expect(
          schema.validate({
            kind: "git",
            url: "https://github.com/test/repo.git",
          })
        ).resolves.toBeDefined();
        await expect(
          schema.validate({
            kind: "subversion",
          })
        ).rejects.toThrow();
      });
    });

    describe("url field", () => {
      it("should require url when branch is provided", async () => {
        const schema = yupRepositoryFields({ t: tt });
        await expect(
          schema.validate({
            kind: "git",
            branch: "main",
          })
        ).rejects.toThrow("validation.repositoryUrlRequiredWhen");
      });

      it("should require url when path is provided", async () => {
        const schema = yupRepositoryFields({ t: tt });
        await expect(
          schema.validate({
            kind: "git",
            path: "/src",
          })
        ).rejects.toThrow("validation.repositoryUrlRequiredWhen");
      });

      it("should require url when isRequired is true", async () => {
        const schema = yupRepositoryFields({ isRequired: true, t: tt });
        await expect(
          schema.validate({
            kind: "git",
            url: "",
          })
        ).rejects.toThrow("validation.repositoryUrlRequired");
      });

      it("should require url when isRequired function returns true", async () => {
        const schema = yupRepositoryFields({ isRequired: () => true, t: tt });
        await expect(
          schema.validate({
            kind: "git",
            url: "",
          })
        ).rejects.toThrow("validation.repositoryUrlRequired");
      });

      it("should NOT require url when isRequired function returns false, kind is valid, and url omitted", async () => {
        const schema = yupRepositoryFields({ isRequired: () => false, t: tt });
        await expect(
          schema.validate({
            kind: "git",
            url: "",
          })
        ).resolves.toBeDefined();
      });

      it("should validate git URL format when kind is git", async () => {
        const schema = yupRepositoryFields({ t: tt });
        await expect(
          schema.validate({
            kind: "git",
            url: "https://github.com/test/repo.git",
          })
        ).resolves.toBeDefined();
      });

      it("should reject invalid git URL format when kind is git", async () => {
        const schema = yupRepositoryFields({ t: tt });
        await expect(
          schema.validate({
            kind: "git",
            url: "not-a-valid-url",
          })
        ).rejects.toThrow("validation.repositoryUrlInvalid");
      });
    });

    describe("branch field", () => {
      it("should accept empty branch", async () => {
        const schema = yupRepositoryFields();
        await expect(
          schema.validate({
            kind: "",
            branch: "",
          })
        ).resolves.toBeDefined();
      });

      it("should accept valid branch name", async () => {
        const schema = yupRepositoryFields();
        await expect(
          schema.validate({
            kind: "git",
            url: "https://github.com/test/repo.git",
            branch: "main",
          })
        ).resolves.toBeDefined();
      });

      it("should trim whitespace from branch", async () => {
        const schema = yupRepositoryFields();
        const result = await schema.validate({
          kind: "git",
          url: "https://github.com/test/repo.git",
          branch: "  main  ",
        });
        expect(result.branch).toBe("main");
      });

      it("should reject branch exceeding 250 characters", async () => {
        const schema = yupRepositoryFields({ t: tt });
        const longBranch = "a".repeat(251);
        await expect(
          schema.validate({
            kind: "git",
            url: "https://github.com/test/repo.git",
            branch: longBranch,
          })
        ).rejects.toThrow("validation.maxLength");
      });

      it("should accept branch with exactly 250 characters", async () => {
        const schema = yupRepositoryFields();
        const maxBranch = "a".repeat(250);
        await expect(
          schema.validate({
            kind: "git",
            url: "https://github.com/test/repo.git",
            branch: maxBranch,
          })
        ).resolves.toBeDefined();
      });
    });

    describe("path field", () => {
      it("should accept empty path", async () => {
        const schema = yupRepositoryFields();
        await expect(
          schema.validate({
            kind: "",
            path: "",
          })
        ).resolves.toBeDefined();
      });

      it("should accept valid path", async () => {
        const schema = yupRepositoryFields();
        await expect(
          schema.validate({
            kind: "git",
            url: "https://github.com/test/repo.git",
            path: "/src/main",
          })
        ).resolves.toBeDefined();
      });

      it("should trim whitespace from path", async () => {
        const schema = yupRepositoryFields();
        const result = await schema.validate({
          kind: "git",
          url: "https://github.com/test/repo.git",
          path: "  /src/main  ",
        });
        expect(result.path).toBe("/src/main");
      });

      it("should reject path exceeding 250 characters", async () => {
        const schema = yupRepositoryFields();
        const longPath = "/" + "a".repeat(250);
        await expect(
          schema.validate({
            kind: "git",
            url: "https://github.com/test/repo.git",
            path: longPath,
          })
        ).rejects.toThrow("Maximum length is 250 characters");
      });

      it("should accept path with exactly 250 characters", async () => {
        const schema = yupRepositoryFields();
        const maxPath = "/" + "a".repeat(249);
        await expect(
          schema.validate({
            kind: "git",
            url: "https://github.com/test/repo.git",
            path: maxPath,
          })
        ).resolves.toBeDefined();
      });
    });

    describe("field interdependencies", () => {
      it("should validate complete repository data", async () => {
        const schema = yupRepositoryFields();
        await expect(
          schema.validate({
            kind: "git",
            url: "https://github.com/test/repo.git",
            branch: "main",
            path: "/src",
          })
        ).resolves.toBeDefined();
      });

      it("should require both kind and url when branch is set", async () => {
        const schema = yupRepositoryFields();
        await expect(
          schema.validate({
            kind: "",
            branch: "main",
          })
        ).rejects.toThrow();
      });

      it("should require both kind and url when path is set", async () => {
        const schema = yupRepositoryFields();
        await expect(
          schema.validate({
            kind: "",
            path: "/src",
          })
        ).rejects.toThrow();
      });

      it("should allow branch and path together with valid kind and url", async () => {
        const schema = yupRepositoryFields();
        await expect(
          schema.validate({
            kind: "git",
            url: "https://github.com/test/repo.git",
            branch: "develop",
            path: "/backend",
          })
        ).resolves.toBeDefined();
      });
    });
  });

  describe("schema as part of a bigger object", () => {
    it("should validate repository fields within a larger schema", async () => {
      const applicationSchema = yup.object().shape({
        name: yup.string().required("Name is required"),
        description: yup.string(),
        repository: yupRepositoryFields(),
      });

      await expect(
        applicationSchema.validate({
          name: "My App",
          description: "Test application",
          repository: {
            kind: "git",
            url: "https://github.com/test/repo.git",
            branch: "main",
            path: "",
          },
        })
      ).resolves.toBeDefined();
    });

    it("should fail validation when repository fields are invalid in larger object", async () => {
      const applicationSchema = yup.object().shape({
        name: yup.string().required("Name is required"),
        repository: yupRepositoryFields(),
      });

      await expect(
        applicationSchema.validate({
          name: "My App",
          repository: {
            kind: "",
            branch: "main", // branch requires url and kind
            path: "",
          },
        })
      ).rejects.toThrow();
    });

    it("should handle nested repository fields with isRequired option", async () => {
      const migrationTargetSchema = yup.object().shape({
        name: yup.string().required(),
        rules: yup.object().shape({
          repository: yupRepositoryFields({ isRequired: true, t: tt }),
        }),
      });

      await expect(
        migrationTargetSchema.validate({
          name: "Target 1",
          rules: {
            repository: {
              kind: "",
              branch: "",
              path: "",
            },
          },
        })
      ).rejects.toThrow("validation.repositoryTypeRequired");
    });

    it("should validate multiple repository objects in array", async () => {
      const schema = yup.object().shape({
        repositories: yup.array().of(yupRepositoryFields()),
      });

      await expect(
        schema.validate({
          repositories: [
            {
              kind: "git",
              url: "https://github.com/repo1.git",
              branch: "main",
              path: "",
            },
            {
              kind: "subversion",
              url: "https://svn.example.com/repo2",
              branch: "",
              path: "/trunk",
            },
          ],
        })
      ).resolves.toBeDefined();
    });

    it("should fail when one repository in array is invalid", async () => {
      const schema = yup.object().shape({
        repositories: yup.array().of(yupRepositoryFields()),
      });

      await expect(
        schema.validate({
          repositories: [
            {
              kind: "git",
              url: "https://github.com/repo1.git",
              branch: "main",
              path: "",
            },
            {
              kind: "", // Invalid: missing kind when url is provided
              url: "https://github.com/repo2.git",
              branch: "",
              path: "",
            },
          ],
        })
      ).rejects.toThrow();
    });

    it("should work with conditional repository fields based on parent context", async () => {
      const formSchema = yup.object().shape({
        rulesKind: yup.string().oneOf(["manual", "repository"]),
        repository: yup.object().when("rulesKind", {
          is: "repository",
          then: (schema) =>
            schema.concat(yupRepositoryFields({ isRequired: true })),
          otherwise: (schema) =>
            schema.concat(yupRepositoryFields({ isRequired: false })),
        }),
      });

      // Should require repository fields when rulesKind is "repository"
      await expect(
        formSchema.validate({
          rulesKind: "repository",
          repository: {
            kind: "",
            url: "",
            branch: "",
            path: "",
          },
        })
      ).rejects.toThrow();

      // Should not require repository fields when rulesKind is "manual"
      await expect(
        formSchema.validate({
          rulesKind: "manual",
          repository: {
            kind: "",
            url: "",
            branch: "",
            path: "",
          },
        })
      ).resolves.toBeDefined();
    });

    it.skip("should work with dynamic isRequired based on sibling field", async () => {
      const schema = yup.object().shape({
        hasRepository: yup.boolean(),
        repository: yupRepositoryFields({
          isRequired: (context?: any) => {
            // In yup 0.32, context.from[1] contains the parent of the repository object
            // context.parent is the repository object itself
            // context.from[1].value is the top-level object containing hasRepository
            const topLevelObject = context.from?.[1]?.value;
            return topLevelObject?.hasRepository === true;
          },
        }),
      });

      await expect(
        schema.validate({
          hasRepository: true,
          repository: {
            kind: "",
            url: "",
            branch: "",
            path: "",
          },
        })
      ).rejects.toThrow();

      await expect(
        schema.validate({
          hasRepository: false,
          repository: {
            kind: "",
            url: "",
            branch: "",
            path: "",
          },
        })
      ).resolves.toBeDefined();
    });

    it("should preserve other fields when validating repository", async () => {
      const schema = yup.object().shape({
        id: yup.number(),
        name: yup.string().required(),
        repository: yupRepositoryFields(),
      });

      const result = await schema.validate({
        id: 123,
        name: "Test App",
        repository: {
          kind: "git",
          url: "https://github.com/test/repo.git",
          branch: "  main  ",
          path: "  /src  ",
        },
      });

      expect(result.id).toBe(123);
      expect(result.name).toBe("Test App");
      expect(result.repository.branch).toBe("main");
      expect(result.repository.path).toBe("/src");
    });
  });

  describe("edge cases", () => {
    it("should handle omitted fields as empty", async () => {
      const schema = yupRepositoryFields();
      await expect(
        schema.validate({
          kind: "",
          url: "",
          branch: "",
          path: "",
        })
      ).resolves.toBeDefined();
    });

    it("should handle empty strings for all fields", async () => {
      const schema = yupRepositoryFields();
      await expect(
        schema.validate({
          kind: "",
          url: "",
          branch: "",
          path: "",
        })
      ).resolves.toBeDefined();
    });

    it("should handle partial objects with valid data", async () => {
      const schema = yupRepositoryFields();
      await expect(
        schema.validate({
          kind: "git",
          url: "https://github.com/test/repo.git",
        })
      ).resolves.toBeDefined();
    });

    it("should handle whitespace-only strings for branch and path", async () => {
      const schema = yupRepositoryFields();
      const result = await schema.validate({
        kind: "",
        branch: "   ",
        path: "   ",
      });
      expect(result.branch).toBe("");
      expect(result.path).toBe("");
    });

    it("should validate with all options combined", async () => {
      const schema = yupRepositoryFields({
        isRequired: true,
        allowEmptyKind: false,
        allowedKinds: ["git"],
      });

      await expect(
        schema.validate({
          kind: "git",
          url: "https://github.com/test/repo.git",
          branch: "main",
          path: "/src",
        })
      ).resolves.toBeDefined();

      await expect(
        schema.validate({
          kind: "",
          url: "",
          branch: "",
          path: "",
        })
      ).rejects.toThrow();
    });

    it("should handle kind with url but no branch or path", async () => {
      const schema = yupRepositoryFields();
      await expect(
        schema.validate({
          kind: "git",
          url: "https://github.com/test/repo.git",
          branch: "",
          path: "",
        })
      ).resolves.toBeDefined();
    });

    it("should reject when branch and path provided without url", async () => {
      const schema = yupRepositoryFields();
      await expect(
        schema.validate({
          kind: "git",
          branch: "main",
          path: "/src",
        })
      ).rejects.toThrow();
    });
  });
});
