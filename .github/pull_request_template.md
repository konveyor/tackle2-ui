## PR Title Prefix

Every **PR Title** should be prefixed with :text: to indicate its type.

<details>
<summary>PR Title emoji</summary>

Types recognized:

- Breaking change: :warning: (`:warning:`)
- Non-breaking feature: :sparkles: (`:sparkles:`)
- Patch fix: :bug: (`:bug:`)
- Docs: :book: (`:book:`)
- Infra/Tests/Other: :seedling: (`:seedling:`)
- Integration/E2E tests: :test_tube: (`:test_tube:`)
- No release note: :ghost: (`:ghost:`)

For example, a pull request containing breaking changes might look like
`:warning: My pull request contains breaking changes`.

Since GitHub supports emoji aliases (ie. `:ghost:`), there is no need to include
the emoji directly in the PR title -- **please use the alias**. It used to be
the case that projects using emojis for PR typing had to include the emoji
directly because GitHub didn't render the alias. Given that `:warning:` is
easy enough to read as text, easy to parse in release tooling, and rendered in
GitHub well, we prefer to standardize on the alias.

</details>

For more information, please see the Konveyor [Versioning Doc](https://github.com/konveyor/release-tools/blob/main/VERSIONING.md).

---

## Custom Test Selection (Optional)

You can specify custom test paths to run in CI instead of the default @ci tests. Add paths below using glob patterns:

<!--
Uncomment and add your test paths below to run specific tests:

test-paths:
administration/credentials/*.test.ts
migration/controls/**/*.test.ts
administration/credentials/maven_crud.test.ts

Supported formats:
- Specific file: administration/credentials/maven_crud.test.ts
- Folder (non-recursive): administration/credentials/*.test.ts
- Folder (recursive): migration/**/*.test.ts

If no test-paths are specified, the default @ci tagged tests will run.
-->
