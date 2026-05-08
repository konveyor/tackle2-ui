# Read pf-codemods GitHub docs
_Exported on 5/8/2026 at 14:02:54 GMT+2 from Cursor (2.6.22)_

---

**Cursor**

Fetching the README from GitHub's raw URL for the complete text (GitHub HTML often truncates), and opening the repo page to confirm.



Opening the raw README for the complete text.



Noting: the repo root [`README.md`](https://github.com/patternfly/pf-codemods/blob/main/README.md) is a symlink to [`packages/pf-codemods/README.md`](https://github.com/patternfly/pf-codemods/blob/main/packages/pf-codemods/README.md); the real documentation lives there. We loaded the full file from GitHub’s plain view (`?plain=1`).

---

### 1. Install and run

- **Run without installing (typical):** `npx @patternfly/pf-codemods ./path-to-src`
- **Install as a dev dependency (if you want it in `package.json`):** `npm i @patternfly/pf-codemods` (or `yarn` / `pnpm` equivalent), then run via `npx` or a script.
- **Requirements:** README says **Node.js ≥ 10** (the published package on npm may track this slightly differently; follow what your installed version documents).
- **Large repos:** increase heap, e.g.  
  `NODE_OPTIONS=--max-old-space-size=4096 npx @patternfly/pf-codemods ./path-to-src`
- **Behavior:** By default it behaves like **ESLint reporting**; add **`--fix`** to apply autofixes where the rules support them.

---

### 2. Options and flags (including `--v6`)

From the README’s **Options** section (CLI help text):

| Flag | Purpose |
|------|--------|
| `-V`, `--version` | Print version |
| `--only <rules>` | Comma-separated list of **rule names** to run |
| `--exclude <rules>` | Run recommended rules **except** this comma-separated list |
| `--fix` | Run ESLint **fixers** |
| `--format <format>` | ESLint report format (default `stylish`) |
| `--no-cache` | Disable ESLint cache |
| `--v4` | v3 → v4 codemods |
| `--v5` | v4 → v5 codemods |
| **`--v6`** | **v5 → v6** codemods |
| `-h`, `--help` | Help |

If you don’t pass `--v4` / `--v5` / `--v6`, the tool can use an **interactive menu** to pick the target version (per README “Simple case”).

---

### 3. Running transforms one-by-one

Use **`--only`** with **ESLint rule names** (same names documented under **Rules** in the README), comma-separated:

```sh
npx @patternfly/pf-codemods --v6 --only rule-name-one,rule-name-two ./path-to-src
```

Add **`--fix`** when you want autofix applied for those rules.

**Cleanup step:** After the main codemods, run **`data-codemods-cleanup` once**, using **`--only data-codemods-cleanup`**, to remove `data-codemods` markers/comments some rules inject.

Special cases called out in the README:

- **`data-codemods-cleanup`** — README: run **only once** after other codemods; **must** be run via `--only data-codemods-cleanup`.
- **`enable-animations`** — README: **only** runnable with `--only enable-animations`.

---

### 4. Important usage notes

- Tool is an **ESLint wrapper** — expect report-style output; **`--fix`** enables automated fixes where defined.
- It **won’t fix every build error**; it targets easier mechanical changes and **surfaces / suggests** harder ones.
- Rules may insert **`data-codemods="true"`** or **`/* data-codemods */`** to coordinate fixes; remove them with **`data-codemods-cleanup`** when you’re done.
- For hardcoded PF classes (e.g. `pf-c-button`), consider the separate **`class-name-updater`** package (linked from the README).
- Canonical raw copy for scripts/automation:  
  [`https://raw.githubusercontent.com/patternfly/pf-codemods/main/packages/pf-codemods/README.md`](https://raw.githubusercontent.com/patternfly/pf-codemods/main/packages/pf-codemods/README.md)

---

### Full README text

The verbatim README is **~3,148 lines** (mostly per-rule docs and examples). Pasting all of it here would overwhelm the chat. It is saved locally from the GitHub plain view at:

`/home/foobar/.cursor/projects/home-foobar-repos-tackle2-ui/agent-tools/9fb36f8e-53fc-4234-81bb-a5b60a7b176f.txt`

(First line has an `Input value:` prefix from the tooling; strip that to get markdown starting at `# pf-codemods`.)

Below is the **full beginning through the CLI “Options” block and the rules intro** exactly as in the README (everything after that is hundreds of rule sections with duplicated “Examples / In / Out” JSX blocks—the same structure repeats for each rule):

```markdown
# pf-codemods

Hey PatternFly-React devs! `pf-codemods` is an eslint wrapper to update @patternfly/react-core@5.x.x code to 6.x.x.

We hope these rules and their autofixers will help you more quickly adopt our breaking changes. These rules are not designed to fix all build errors, but they can help to fix easy ones as well as point out the more complicated ones and offer suggestions on how you might go about fixing them.

If you have any hardcoded Patternfly class names in your project (i.e. pf-c-button) you also might want to see if our [class-name-updater package](./packages/class-name-updater/README.md) would be helpful for you.

## Usage

### Simple case

Requires Node.js >= 10.

```sh
npx @patternfly/pf-codemods ./path-to-src
```

Use the interactive menu to choose a PatternFly version to update to. Or you can specify the version directly with a flag:

```sh
npx @patternfly/pf-codemods --v6 ./path-to-src
```

Giving node more RAM can help for large codebases.

```sh
NODE_OPTIONS=--max-old-space-size=4096 npx @patternfly/pf-codemods ./path-to-src
```

These commands will show you places in your code that may have issues with our breaking changes similar to linting. Add the `--fix` flag to allow us to autofix issues where possible.

### Options

```sh
Usage: pf-codemods [options] <path> [otherPaths...]

Run codemods on path using eslint.

Options:
  -V, --version      output the version number
  --only <rules>     Comma-seperated list of rules to run
  --exclude <rules>  Run recommended rules EXCLUDING this comma-seperated list
  --fix              Whether to run fixer
  --format <format>  What eslint report format to use (default: "stylish")
  --no-cache         Disables eslint caching
  --v4               Run v3 to v4 codemods
  --v5               Run v4 to v5 codemods
  --v6               Run v5 to v6 codemods
  -h, --help         display help for command
```

## Rules

These rules are based off the breaking change notes for React. Each rule links the breaking change patternfly-react PR in case you want to better understand the change. Also, each rule makes sure you're using a PatternFly component before running.

Some rules will add either a comment (`/* data-codemods */`) or data attribute (`data-codemods="true"`) in order to prevent certain other rules from applying an unnecessary fix.
These `data-codemods` attributes and comments can be removed by our `data-codemods-cleanup` rule. You should run this rule only once, after you finish running the general codemods, by adding the `--only data-codemods-cleanup` option.


### accordionContent-remove-isHidden-prop ...

… (remainder: every rule documented with headings, descriptions, and In/Out code examples — see raw URL or saved file above.)
```

If you want the rules list exported as plain text only (rule names without examples), say so and we can derive that from the same file programmatically once shell access is available in your environment.

