# Read PatternFly v6 upgrade guide

_Exported on 5/8/2026 at 14:10:54 GMT+2 from Cursor (2.6.22)_

---

**Cursor**

Loading the PatternFly upgrade page, waiting for the SPA to render, then capturing the full guide text.

Here is what the loaded page documents, organized how you asked, then a single **full plain-text transcription** of the migration guide body (assembled from the live page’s accessibility tree at [Upgrade to PatternFly 6](https://www.patternfly.org/get-started/upgrade/); a few inline sentences were clipped in that export, so those are marked with `[…]` where the site did not expose the full string).

---

### 1. “Are you ready for PatternFly 6?” prerequisites

Purple **info alert** at the top of the guide:

- **Are you ready for PatternFly 6?**
- **To ensure your product is ready for PatternFly 6, complete the [PatternFly 5 upgrade process](https://www.patternfly.org/get-started/develop#upgrade) first** to address any necessary changes from our previous release. _(Exact link target is handled by PatternFly’s site navigation; the alert text anchors on “complete the PatternFly 5 upgrade process”.)_

---

### 2. Migration flow (everything in order)

The guide uses **two overlapping lists**:

**A. High-level bullets under “Your upgrade process will require you to complete these steps:”**

1. Update your dependencies to use PatternFly **6** instead of PatternFly **5**.
2. Run our **codemods** suite.
3. Remove all **CSS overrides**.
4. Review and update **variable and class names**.
5. Update any **pixel-based logic** for your breakpoints.

**B. Numbered sections in the TOC (“How to upgrade”)**

These map to concrete work after dependencies are bumped:

1. **Run our codemods suite**
2. **Remove all CSS overrides**
3. **Review and update variable and class names** (includes the three supplementary codemods: `class-name-updater`, `tokens-update`, `css-vars-updater`)
4. **Update any pixel-based logic for breakpoints**

Extra sections:

- **Potential test failures** (Button, Select testing-library notes)
- **Get help** (support + caveat about fully custom/non-component styling)

---

### 3. `package.json` / dependency specifics

The page **does not** spell out every `@patternfly/*` package and target semver in one checklist. Instead it repeatedly says:

- Bump your app’s PatternFly footprint from **v5 packages to v6 packages** before relying on tooling (“This is **not handled by codemods**”).

Concrete package-related details called out explicitly:

| Topic                    | What the guide says                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Charts / Victory**     | Victory-based charts live under **`@patternfly/react-charts/victory`**. Imports must change from e.g. `import { Area } from '@patternfly/react-charts';` → `import { Area } from '@patternfly/react-charts/victory';`. Victory is now an **optional peer dependency**. Install **`victory`** for everything, **or** feature-specific packages (e.g. `victory-core`, `victory-tooltip`, …). |
| **Codemods CLI**         | `npx @patternfly/pf-codemods@latest <path to source> --v6` (+ optional `--fix`).                                                                                                                                                                                                                                                                                                           |
| **React tokens package** | Manual discussion references tokens imported via **`@patternfly/react-tokens`** when codemods can’t resolve 1:1 token pairs.                                                                                                                                                                                                                                                               |

Other helper tools referenced by **name** (you install/run them separately per their README / examples):

- **`class-name-updater`**
- **`tokens-update`** (example in pf-codemods README)
- **`css-vars-updater`**

---

### 4. CSS & design-token changes

- **Design token system** replaces many **v5 variable names**, so legacy **CSS overrides** target stale styles—“they must be updated or **[… truncated in a11y tree]**”.
- Prefer **removing overrides** broadly; PF6 may lack a 1:1 replacement for every PF5 knob.
- For **tokens & classes**, the guide points to curated lists: **“Removed variables”** and **“Added variables”** (links from the live page).
- **Three codemods** for naming/token migration:

  **a. `class-name-updater`**
  - Highlights places needing tweaks; **`pf-v5` → `pf-v6`** style find/replace semantics. Simple enough it can **incorrectly rewrite** unrelated cases—manual review recommended. Use **`--v6`** (defaults to PF5-targeting behavior otherwise) + **`--fix`**.

  **b. `tokens-update`** _(JS/TSX)_
  - Temporarily rewires globals to a visible **placeholder** styling so unresolved spots jump out (**`--pf-t--temp--dev--tbd`** / analogous **`t_temp_dev_tbd`** style token **[…]**).
  - Example mappings: `--pf-v5-global--FontSize--lg` → `--pf-t--global--font--size--lg`; `global_FontSize_lg` → `t_global_font_size_lg`.

  **c. `css-vars-updater`** \*(non-React/CSS/Sass/md/etc.)\*\*
  - Updates PF5 CSS variables tied to PF6 tokens in non-React files.

- **Breakpoints:** PF6 global breakpoint tokens are expressed in **`rem`**, not **px**.

---

### 5. After running codemods

Inside **§1 Run our codemods suite**, the scripted loop is roughly:

1. **Already bumped** NPM deps to PF6 (codemods do **not** do this).
2. Run `npx @patternfly/pf-codemods@latest <src> --v6`. Expect ESLint-like output (**warnings/errors + counts**). If output looks wrong, contact PatternFly before continuing.
3. Note flagged issues → rerun **with `--fix`** → note what changed → address unfixed critical items → **run a build**.
4. **Repeat substeps multiple times** until clean, then proceed to **step 2** (CSS overrides).

Post-codemod expectations called out explicitly:

- **Plan on React-token work** landing in **step 3**.
- **`data-*` scaffolding / cleanup** discussed in auxiliary codemod docs referenced from the README links (cleanup pattern previously documented for pf-codemods).

Later manual phases **2–4** are **cannot** fully come from ESLint autofix alone (CSS removals, handcrafted token swaps, breakpoint math).

---

### 6. Important warnings / notes

- Finish **PF5 migrations first** (“Are you ready…” alert).
- **Empty-state refactor**: **not wholly codemodable** → expect manual JSX adjustments; consult **release notes** (`search “empty state” in the release-notes table`).
- **`class-name-updater` caveat**: brute-force renaming can bleed into unrelated literals—verify diffs carefully.
- **React-token parity**: mismatched semantics between PF5 tokens (e.g. `global_link_Color_hover`) vs PF6 (`t_global_color_nonstatus_green_clicked`) illustrate syntax **and semantics** divergence—persisting import errors ≠ “codemods failed”.
- **`Select`/`Button` RTL tests**: expect failures around **aria-disabled** expectations, **`byText`** vs **`byRole`**, hidden Popper menus—documented remedies under **Potential test failures**.
- **Fully custom skins** cloning PF visuals without PF components ⇒ expect a **major re-skin**, reach out proactively.

Cookie/privacy banners and global chrome text were omitted—they’re shell, not migration guide prose.

---

## Full migration-guide text (reconstructed plaintext)

Below is essentially **one continuous export** of the article body (excluding site chrome), stitching snapshot fragments; bracketed omissions mark places the accessibility snapshot truncated strings.

```
Upgrade to PatternFly 6
(Tabs: Upgrade guide | Release notes)

Info alert — Are you ready for PatternFly 6?
To ensure your product is ready for PatternFly 6, complete the PatternFly 5 upgrade process first to address any necessary changes from our previous release.

PatternFly 6 introduces the exciting new features and functionality outlined in our release highlights [link]. For a detailed breakdown on the work that went into this release, you can view the PatternFly 6 major release notes [link].

In the following sections, this upgrade guide outlines steps required to migrate your codebase to PatternFly 6 and additional resources to support your journey:
• Notable changes — Significant changes you should be aware of before starting your upgrade.
• Upgrade steps — Step-by-step instructions for upgrading.
• Help resources — Easy-access links to get help from the PatternFly team.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOTABLE CHANGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before you upgrade, familiarize yourself with these significant changes. While some are handled by codemods, some changes could require manual intervention and should be kept in mind as you upgrade.

Components
• Chip → replaced with label.
• Tile → replaced with card.
• Text → renamed to “content”.
• Expandable section → removed isActive.
• Empty state → refactored.
  ⚠️ This refactoring is not entirely handled by codemods. Depending on your implementation, your empty states could also require manual updates. Search “empty state” in the release notes table [link].

Charts
To support multiple chart libraries, Victory-based charts moved to a "victory" directory inside @patternfly/react-charts. Imports must reflect that change.
• Old: import { Area } from '@patternfly/react-charts';
• New: import { Area } from '@patternfly/react-charts/victory';
Victory is now optional peer dependency; install either umbrella package victory or granular packages such as victory-core, victory-tooltip, etc., based on usage.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW TO UPGRADE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your upgrade process will require these steps overall:
1. Update dependencies PatternFly 5 → PatternFly 6.
2. Run our codemods suite.
3. Remove all CSS overrides.
4. Review/update variable & class names.
5. Adjust pixel-based breakpoint logic.

––– 1. Run our codemods suite –––

Note: Execute before broad manual edits; waiting invites more cleanup.

Codemods speed discovery/fix of mechanical breaking changes ESLint understands.

Procedure:
• Ensure dependencies already target PatternFly 6 (not codemodable).
• Run:
  npx @patternfly/pf-codemods@latest <path-to-src> --v6
• Output should resemble eslint (warnings/errors + tally). Contact PatternFly if not.
• Record findings.
• Re-run same command appended with --fix.
• Inspect automatic edits; remediate unresolved critical warnings manually.
• Build the product.
• Repeat the inner loop (“steps 1–6”) until satisfied, then proceed to section 2.
• Expect substantive React-token work later (step 3).

––– 2. Remove all CSS overrides –––

PF6’s token renaming invalidates PF5-era overrides—they must change or disappear [remainder truncated].

After codemods:
• Strip overrides temporarily; observe UI.
• Many PF5-specific hacks won’t translate—delete ones with no PF6 analogue.
• Minimize lingering overrides for easier future jumps.
• If customization still required → continue to step 3.

––– 3. Review/update variable & class names –––

Variables added/removed (directionality refactor, deprecation, etc.). Lists: Removed variables [link], Added variables [link].

Any bespoke CSS referencing PF classnames/vars must align with PF6 tokens.

Supporting codemods:
• class-name-updater — detects/repairs class strings (pf-v5 → pf-v6). Naïve substitution—watch for unintended matches. Run with --v6 and --fix.
• tokens-update (.js/.tsx) — flashes hot-pink sentinel variables/tokens (--pf-t--temp--dev--tbd / t_temp_dev…) marking manual follow-up [detail truncated].
  Works for CSS variables & react tokens alike, e.g.:
    --pf-v5-global--FontSize--lg → --pf-t--global--font--size--lg
    global_FontSize_lg           → t_global_font_size_lg
• Manual React tokens — @patternfly/react-tokens may lack bijective PF5⇄PF6 mapping. Persistent missing-token errors can mean semantics drift, not tooling failure.

  Example illustrating syntax drift (not implying functional equivalence):
    PF5: global_link_Color_hover
    PF6: t_global_color_nonstatus_green_clicked
  Different purposes; highlights why imports break.

• css-vars-updater — adjusts PF5 CSS vars in non-React assets (.css/.scss/.md/…) after token redesign [remainder truncated].

See linked README/example docs for invocation specifics.

––– 4. Update pixel breakpoint logic –––

PF6 encodes breakpoints as REM-based design tokens—not pixel literals. If comparisons used pixel constants, rework using rem equivalents: divide PF5 px by root font sizing rules [sentence truncated].

Reference table excerpt:
breakpoint | token                              | px (legacy) | rem (PF6)
xs         | --pf-t--global--breakpoint--xs     | 0px        | 0rem
sm         | --pf-t--global--breakpoint--sm     | 576px      | 36rem
md         | --pf-t--global--breakpoint--md     | 768px      | 48rem
lg         | --pf-t--global--breakpoint--lg     | 992px      | 62rem
xl         | --pf-t--global--breakpoint--xl     | 1200px     | 75rem
2xl        | --pf-t--global--breakpoint--2xl    | 1450px     | 90.625rem

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POTENTIAL TEST FAILURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Button
• Symptom: Cannot find aria-disabled
  Cause: isDisabled wires native disabled but stops setting aria-disabled except when component prop ≠ "button"[…]
  Fix: Drop assertions expecting obsolete aria-disabled states except valid cases enumerated (aria-disabled=false OR tracks isDisabled only when component="button"[…].
• Symptom: Cannot read button attrs via RTL byText
  Cause: New inner wrapper around textual children—byText hits wrapper, not outer <button>.
  Fix: Use byRole with accessible name targeting top-level Button.

Select
• Symptom: Role query fails around disabled Popper menus in RTL.
  Cause: aria-disabled hides menu only in jsdom/unit tests—not real browsers.[…]
  Fix: Query with {hidden: true} OR set Select appendTo="inline"[…].

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GET HELP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PatternFly welcomes upgrade questions—especially visuals shifting substantially.

⚠️ Custom solutions mimic PF styling without components → anticipate full re-skin; engage early.[…sentence truncated]

Reach out links: Slack, GitHub discussions, mailing list/calendar/discussions surfaced in footer.
```

If you need the **canonical exact wording** including every hyperlink URL and ellipsis-free prose, copying from the rendered page or its MDX source in [patternfly/patternfly-org](https://github.com/patternfly/patternfly-org) will be more precise than the accessibility dump alone.
