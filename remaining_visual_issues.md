# Remaining Visual Issues

Visual testing performed by navigating all pages with Playwright after PF v5-to-v6 migration fixes.

## Pages Tested

| Page                     | URL                  | Status            |
| ------------------------ | -------------------- | ----------------- |
| Application Inventory    | `/applications`      | Renders correctly |
| Archetypes               | `/archetypes`        | Renders correctly |
| Migration Waves          | `/migration-waves`   | Renders correctly |
| Reports                  | `/reports`           | Renders correctly |
| Issues                   | `/issues/all`        | Renders correctly |
| Controls                 | `/controls`          | Renders correctly |
| Custom Migration Targets | `/migration-targets` | Renders correctly |

**No runtime errors or broken pages found.** All console errors are API 404s from the
missing backend (`/hub/*` endpoints), expected when running the client dev server standalone.

---

## Issues Requiring Design Review

### 1. Info Color Semantic Change (blue to purple)

PF v6 changed the info status color from blue (`#73bcf7`) to purple (`#5e40be`).

**Affected file:** `client/src/app/components/StatusIcon.tsx`

The following status icons will appear purple instead of blue when data is present:

- `Canceled` status
- `Scheduled` status
- `InProgress` status (loading color)

**Decision made:** Follow PF v6 semantics. If the team prefers blue, swap
`t_global_color_status_info_*` tokens for `t_global_color_nonstatus_blue_*` tokens.

### 2. Token Color Shifts in Charts

Several palette tokens have different hex values in v6. Chart colors in Reports pages
will differ slightly from v5:

| Token                                                                | v5 Hex    | v6 Hex    | Used In                   |
| -------------------------------------------------------------------- | --------- | --------- | ------------------------- |
| `global_palette_blue_300` -> `t_global_color_nonstatus_blue_300`     | `#2b9af3` | `#4394e5` | Donut chart default color |
| `global_palette_green_300` -> `t_global_color_nonstatus_green_300`   | `#4cb140` | `#87bb62` | Risk/action colors        |
| `global_palette_gold_300` -> `chart_color_yellow_200`                | `#f0ab00` | `#ffcc17` | Risk/action colors        |
| `global_palette_orange_300` -> `t_global_color_nonstatus_orange_200` | `#f4b678` | `#f8ae54` | Risk/action colors        |
| `global_palette_purple_600` -> `t_color_purple_70`                   | `#1f0066` | `#21134d` | Risk/action colors        |
| `global_palette_black_500` -> `t_color_gray_50`                      | `#8a8d90` | `#707070` | Risk/action colors        |
| `global_palette_cyan_300` -> `t_global_color_nonstatus_teal_300`     | `#009596` | `#63bdbd` | Risk/action colors        |

**Affected files:**

- `client/src/app/Constants.ts` (RISK_LIST, PROPOSED_ACTION_LIST hex values)
- Both `application-assessment-donut-chart.tsx` files
- `adoption-candidate-graph.tsx`
- `donut.tsx`

### 3. Legacy CSS Variable References (~22 files)

Multiple files still use `var(--pf-v5-global--BackgroundColor--100)` in inline styles
for table toolbar backgrounds. These don't visually break (PF v6 includes a v5 compat
layer that defines these variables) but should be migrated to `--pf-v6-*` or `--pf-t--*`
tokens for long-term compatibility.

**Pattern:** `backgroundColor: "var(--pf-v5-global--BackgroundColor--100)"`

**Fix:** Replace with `var(--pf-t--global--background--color--primary--default)` or
remove if the default background is sufficient.

**Affected files (grep for `pf-v5-global--BackgroundColor`):**

- Multiple table/toolbar wrapper components across applications, archetypes, controls,
  migration-waves, issues, insights, dependencies, identities, tasks, and other pages.

### 4. Legacy v4 CSS Variable References (5 files)

A few CSS files still reference unversioned `--pf-c-*` or `--pf-global-*` variables:

| File                        | Variables                                                                           |
| --------------------------- | ----------------------------------------------------------------------------------- |
| `column-platform-name.css`  | `--pf-c-popover__header--MarginBlockEnd`                                            |
| `proxies.css`               | `--pf-c-switch__input--focus__toggle--OutlineWidth`                                 |
| `tag-table.css`             | `--pf-c-table--cell--PaddingInlineStart`                                            |
| `target-card.css`           | `--pf-c-card--m-selectable--hover--BackgroundColor`, `--pf-c-card--BackgroundColor` |
| `drawer-tabs-container.css` | `--pf-c-tabs__scroll-button--Width`, `--pf-global--spacer--*`                       |

These should be updated to `--pf-v6-c-*` or `--pf-t--*` equivalents.

### 5. Legacy v4 CSS in Inline Styles (3 files)

| File                                        | Variable                                                                       |
| ------------------------------------------- | ------------------------------------------------------------------------------ |
| `dynamic-assessment-actions-row.css`        | `var(--pf-global--success-color--100)`, `var(--pf-global--warning-color--100)` |
| `incident-code-snip-viewer.css`             | `var(--pf-global--danger-color--100)`                                          |
| `results.tsx` (discover-import-wizard)      | `var(--pf-global--danger-color--100)`                                          |
| `results.tsx` (retrieve-config-wizard)      | `var(--pf-global--danger-color--100)`                                          |
| `step-results.tsx` (generate-assets-wizard) | `var(--pf-global--danger-color--100)`                                          |

These reference v4 global CSS variables that may not resolve in PF v6 without the compat layer.
