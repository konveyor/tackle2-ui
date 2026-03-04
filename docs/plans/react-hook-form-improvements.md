# React Hook Form Improvements

**Library version:** Upgraded from `^7.58.1` to latest stable v7.71.x

## Background

An evaluation of react-hook-form usage across the codebase identified several
opportunities to leverage new features from the v7.59–v7.71 release line and to
fix existing over-broad subscription patterns that cause unnecessary re-renders.

The upgrade itself provides two automatic wins with zero code changes:

- **Security patches** (v7.69.0) -- CVE-2025-55182 (Critical RCE),
  CVE-2025-55183, CVE-2025-55184, CVE-2025-67779
- **FormProvider memoization** (v7.71.0) -- context value is now memoized and
  the control context is separated, reducing re-renders in all five
  `FormProvider` trees (`assessment-wizard`, `identity-form`, `generator-form`,
  `SchemaAsFields`, `retrieve-config-wizard`)

The items below require code changes.

---

## 1. Scope over-broad `useWatch` calls -- DONE

Several components watched the entire form but only used a handful of fields,
causing re-renders on every keystroke in any field.

**Changes applied:**

- **`analysis-labels.tsx`** -- Scoped to `name: "excludedLabels"`
- **`options-advanced.tsx`** -- Scoped to
  `name: ["excludedLabels", "autoTaggingEnabled", "advancedAnalysisEnabled", "saveAsProfile"]`
- **`kind-source-form.tsx`** -- Scoped to
  `name: ["userCredentials", "password", "key", "kind", "default", "keyFilename"]`,
  updated all `values.X` references to individual variables
- **`export-form.tsx`** -- Replaced `watch()` with
  `useWatch({ control, name: ["issueManager", "tracker", "project", "kind"] })`,
  updated all references

---

## 2. Evaluate `compute` prop for `useFormChangeHandler` -- NOT ADOPTED

**File:** `client/src/app/hooks/useFormChangeHandler.ts`

The `compute` prop (v7.61.0) was evaluated for the `useFormChangeHandler` hook.
However, the hook derives state from both watched values AND `formState.isValid`.
The `compute` callback only re-evaluates when watched values change -- it does
not re-evaluate when `isValid` transitions independently (e.g., after async
validation completes). This would cause stale `isValid` in the derived state.

The existing `useMemo` approach correctly handles both dependencies and remains
the right pattern. A JSDoc note was added to the hook explaining this decision.

---

## 3. Evaluate `<Watch>` component for conditional rendering -- NOT ADOPTED

**Feature:** v7.65.0

Both candidates were evaluated and determined to not benefit from `<Watch>`:

**`kind-source-form.tsx`:** The 6 watched values (`userCredentials`, `password`,
`key`, `kind`, `default`, `keyFilename`) are consumed across multiple computed
values (`isPasswordEncrypted`, `isKeyEncrypted`, `isReplacingDefault`) and JSX
regions throughout the component. Isolating any value into a `<Watch>` would
require duplicating watches or splitting the component, adding complexity without
meaningful benefit. The scoped `useWatch` from step 1 already limits
subscriptions to only the needed fields.

**`export-form.tsx`:** The watched values (`issueManager`, `tracker`, `project`)
drive hook calls at the component level (`useTrackerProjectsByTracker`,
`useTrackerTypesByProjectName`). Since hooks cannot be called inside `<Watch>`
render callbacks, the watched values must remain at the component scope. The
`isDisabled` and `options` props on each select depend on these component-level
variables.

---

## 4. Isolate formState with `<FormStateSubscribe>` -- DONE

**Feature:** v7.68.0

Moved formState subscriptions (`isSubmitting`, `isValidating`, `isValid`,
`isDirty`) out of the `useForm` destructure and into `<FormStateSubscribe>`
wrapping the ActionGroup. This prevents the entire form from re-rendering when
formState flags toggle -- only the action buttons re-render.

**Changes applied to the 6 largest/most complex forms:**

- **`export-form.tsx`** -- 4 cascading selects with hook calls
- **`identity-form.tsx`** -- FormProvider + conditional sections + many fields
- **`tracker-form.tsx`** -- Multiple dependent selects
- **`custom-target-form.tsx`** -- useFieldArray + image upload + many fields
- **`proxy-form.tsx`** -- Many Controller fields + conditional sections
- **`archetype-form.tsx`** -- Many fields + duplicate mode logic

**Not applied to smaller forms** (stakeholder-group, stakeholder, tag,
tag-category, business-service, job-function, migration-wave, review,
target-profile, application-identity, import-questionnaire, platform) because
the re-render cost of 2–4 field forms is negligible and the structural change
adds complexity without measurable benefit. The pattern is available if any of
these forms grow in complexity.

---

## Implementation order

| Step | Item                                | Files affected | Status      |
| ---- | ----------------------------------- | -------------- | ----------- |
| 1    | Scope `useWatch` calls (1a–1d)      | 4 files        | Done        |
| 2    | `compute` in `useFormChangeHandler` | 1 file         | Not adopted |
| 3    | `<Watch>` component evaluation      | 2 candidates   | Not adopted |
| 4    | `<FormStateSubscribe>` isolation    | 6 files        | Done        |
