# Migration Perspective Navigation Grouping

**Issue:** [konveyor/tackle2-ui#2714 - Consider updates to the Migration perspective navigation grouping](https://github.com/konveyor/tackle2-ui/issues/2714)

**Design reference:** [PatternFly 5 Navigation Design Guidelines - Vertical Navigation](https://v5-archive.patternfly.org/components/navigation/design-guidelines/#vertical-navigation)

## Problem Statement

The navigation menu in the Migration perspective was flat and didn't
differentiate between page intent. All 11 navigation items were rendered as
siblings in a single `NavList` with no visual grouping:

1. Application inventory
2. Archetypes
3. Reports
4. Controls
5. Migration waves
6. Issues
7. Insights
8. Dependencies
9. Task Manager
10. Custom migration targets
11. Analysis Profiles

The issue proposes reorganizing the navigation around three intent categories:

- **Inputs / Applications / Primary entities and flows**
- **Outputs / Reporting**
- **Non-Administrator managed Configuration and Tools**

## Design Decision: `NavExpandable` (Expandable Navigation)

PatternFly 5 offers two relevant vertical navigation grouping patterns:
`NavGroup` (grouped) and `NavExpandable` (expandable). `NavExpandable` was
chosen for this implementation.

### Why `NavExpandable`

PF5 guideline ([Expandable navigation](https://v5-archive.patternfly.org/components/navigation/design-guidelines/#expandable-two-level-navigation)):

> When you have a large number of secondary navigation items, you can use an
> expandable navigation to collapse and expand options as needed.

1. **Consistency with `AdminSidebar`** -- The `AdminSidebar` already uses
   `NavExpandable` for "Repositories" and "Issue management" groups. Using the
   same pattern in the Migration perspective provides a consistent experience
   across perspectives.
2. **Already imported** -- `NavExpandable` was already imported in
   `SidebarApp.tsx`, requiring no new dependencies.
3. **Scalability** -- As the navigation grows with new features, collapsible
   groups allow users to focus on the section they are working with.
4. **Groups start expanded** -- The `isExpanded` prop ensures all groups are
   open by default, so discoverability is not sacrificed.

### Considered Alternative: `NavGroup`

PF5 guideline ([Grouped navigation](https://v5-archive.patternfly.org/components/navigation/design-guidelines/#grouped-navigation)):

> When you have a small amount of secondary navigation items, you can group your
> items and display them persistently beneath the primary navigation items.

`NavGroup` displays items persistently under labeled section headers with no
collapse/expand behavior. It solves the intent differentiation problem with zero
interaction cost and is recommended by PF5 for small sets of secondary items.
This remains a viable alternative if collapsibility is not desired.

The two approaches can also be [combined](https://v5-archive.patternfly.org/components/navigation/design-guidelines/#combining-vertical-navigation-patterns)
if some groups grow large in the future while others remain small.

### Comparison

| Criteria                 | `NavExpandable` (chosen)           | `NavGroup`                                    |
| ------------------------ | ---------------------------------- | --------------------------------------------- |
| Visual treatment         | Collapsible sections with toggles  | Persistent group labels; items always visible |
| PF5 recommendation       | Large number of secondary items    | Small number of secondary items               |
| Existing use in codebase | Used in `AdminSidebar`             | Not currently used                            |
| Interaction cost         | Requires clicks to expand/collapse | None                                          |
| Space efficiency         | Compact when collapsed             | All 11 items visible (fits without scrolling) |

## Navigation Grouping

Based on the intent categories from issue #2714:

### Group 1: "Applications" (`migration-applications`)

_Driven by #2714 category: "Inputs / Applications / Primary entities and flows"_

These are the core entities users create and manage as inputs to the migration
process.

| Nav Item              | Path               |
| --------------------- | ------------------ |
| Application inventory | `/applications`    |
| Archetypes            | `/archetypes`      |
| Migration waves       | `/migration-waves` |

### Group 2: "Analysis Results" (`migration-analysis-results`)

_Driven by #2714 category: "Outputs / Reporting"_

These are all outputs generated from analysis of applications.

| Nav Item     | Path            |
| ------------ | --------------- |
| Reports      | `/reports`      |
| Issues       | `/issues/all`   |
| Insights     | `/insights/all` |
| Dependencies | `/dependencies` |

### Group 3: "Configuration" (`migration-configuration`)

_Driven by #2714 category: "Non-Administrator managed Configuration and Tools"_

Settings, tooling, and reference data that non-admins manage within the
Migration perspective.

| Nav Item                 | Path                 |
| ------------------------ | -------------------- |
| Controls                 | `/controls`          |
| Custom migration targets | `/migration-targets` |
| Analysis Profiles        | `/analysis-profiles` |
| Task Manager             | `/tasks`             |

## Implementation

### Structure

The `MigrationSidebar` component was restructured from a flat `NavList` to
three `NavExpandable` groups within a `NavList`, matching the pattern used by
`AdminSidebar`:

```
Nav > NavList > NavExpandable("Applications") > NavItem * 3
               NavExpandable("Analysis Results") > NavItem * 4
               NavExpandable("Configuration") > NavItem * 4
```

Each `NavExpandable` is configured with:

- `title` -- translated group label via `t("sidebar.group.*")`
- `srText` -- screen reader text matching the title for accessibility
- `groupId` -- unique identifier (e.g. `migration-applications`)
- `isExpanded` -- groups start expanded by default

### Translation keys

Added under `sidebar.group` in the existing `sidebar` namespace:

```json
"group": {
  "applications": "Applications",
  "analysisResults": "Analysis Results",
  "configuration": "Configuration"
}
```

### CSS

No CSS changes were required. The existing rules in `SidebarApp.css` already
work correctly with `NavExpandable` groups, as demonstrated by the
`AdminSidebar` which uses the same pattern and the same stylesheet.

### Tests

- **Snapshot test** (`SidebarApp.test.tsx`) -- Currently `it.skip`'d and renders
  `AdminSidebar` based on route matching. Not affected by this change.
- **Cypress E2E tests** -- Navigation item text labels are unchanged. Tests that
  navigate by clicking sidebar link text continue to work. No selectors in the
  existing tests rely on the flat list structure.

## Files Changed

| File                                              | Change                                                                              | Scope      |
| ------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------- |
| `client/src/app/layout/SidebarApp/SidebarApp.tsx` | Restructured `MigrationSidebar` from flat `NavList` to three `NavExpandable` groups | Primary    |
| `client/public/locales/en/translation.json`       | Added `sidebar.group` translation keys for group labels                             | Supporting |

**No changes needed to:**

- `SidebarApp.css` -- existing rules work with `NavExpandable`
- `Paths.ts` -- routes/paths unchanged
- `Routes.tsx` -- route definitions unchanged
- `DefaultLayout.tsx` -- layout structure unchanged
- Cypress E2E tests -- nav item text content unchanged
- Snapshot test -- skipped, renders `AdminSidebar`
