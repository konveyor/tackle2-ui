<!--
## PR Title Prefix

Every **PR Title** should be prefixed with :text: to indicate its type.

- Breaking change: :warning: (`:warning:`)
- Non-breaking feature: :sparkles: (`:sparkles:`)
- Patch fix: :bug: (`:bug:`)
- Docs: :book: (`:book:`)
- Infra/Tests/Other: :seedling: (`:seedling:`)
- No release note: :ghost: (`:ghost:`)

For example, a pull request containing breaking changes might look like
`:warning: My pull request contains breaking changes`.

Since GitHub supports emoji aliases (ie. `:ghost:`), there is no need to include
the emoji directly in the PR title -- **please use the alias**. It used to be
the case that projects using emojis for PR typing had to include the emoji
directly because GitHub didn't render the alias. Given that `:warning:` is
easy enough to read as text, easy to parse in release tooling, and rendered in
GitHub well, we prefer to standardize on the alias.

For more information, please see the Konveyor
[Versioning Doc](https://github.com/konveyor/release-tools/blob/main/VERSIONING.md).
-->
