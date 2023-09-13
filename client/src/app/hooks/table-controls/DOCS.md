# table-controls

Our reusable hooks and components for managing state related to composable PatternFly Tables

## Why?

These hooks and components are intended as the missing "batteries" for the composable PatternFly Table. When PatternFly moved away from the "batteries included" legacy monolith Table towards the newer composable Table components, the price of the improved flexibility was that the table itself can no longer manage its own state and its usage became more verbose with more required boilerplate code.

The table-controls hooks and components provide a pattern where state logic can be encapsulated with simple configuration and JSX for rendering table elements can be shortened via the use of "prop helpers", but the consumer can retain full control over the JSX composition and have access to all the state at any level. With this pattern, tables are simpler to build and maintain but we don't have to sacrifice any of the benefits gained by migrating from the legacy to the composable table.

## Goals

- Featureful tables should be easy to implement with code that is short and readable without sacrificing composability and refactorability.
- The consumer should be able to override any and all props manually on any element of the table. If there is a future need for table state to be used for rendering in a way we don't currently anticipate, that should not be blocked by this abstraction.
- Client-paginated and server-paginated tables should be similar to implement and share reusable. If a table needs to be converted between client logic and server logic, that should be relatively easy.
- There should not be a concept of a "row object" because rows are presentational details and defining them as a separate model from the API data causes unnecessary complexity. See [Item Objects, Not Row Objects](#item-objects-not-row-objects).
- Strict TypeScript types with generics inferred from parameters should be used to provide a safe and convenient development experience without having to repeat type annotations all over the page-level code.
- All features should be optional and fall back to reasonable defaults if their options are omitted.
- Code for each feature should be isolated enough that it could be reasonably used on its own.

## Features

The functionality of the table-controls hooks is broken down into the following features. Most features are defined by operations to be performed on API data before it is displayed in a table.

Note that filtering, sorting and pagination are special because they must be performed in a specific order to work correctly: filter and sort data, then paginate it. Using the higher-level hooks like `useLocalTableControls` or `useTableControlState` + `useTableControlProps` will take care of this for you (see [Usage](#usage)), but if you are handling pagination yourself with the lower-level hooks you'll need to be mindful of this order (see [Hooks and Helper Functions](#hooks-and-helper-functions)).

The state used by these features can be stored either in React state (provided by `use[Feature]State` hooks) or in the browser's URL query parameters (provided by `use[Feature]UrlParams` hooks). If URL params are used, the user's current filters, sort, pagination state, expanded/active rows and more are preserved when reloading the browser, using the browser Back and Forward buttons, or loading a bookmark.

> ⚠️ TECH DEBT NOTE: This URL param behavior is currently all-or-nothing if you're using the higher-level hooks and not available when using the shorthand hook `useLocalTableControls`. This is because the generic hook for manipulating URL params (`useUrlParams`) cannot be used conditionally. We may want to refactor this later such that we have a hook like `useStateOrUrlParams` and make URL params opt-in on a feature-by-feature basis. This would also mean we could combine the `useTableControlState` and `useTableControlUrlParams` which currently are interchangeable, as well as combine each set of `use[Feature]State` and `use[Feature]UrlParams` hooks. See [Hooks and Helper Functions](#hooks-and-helper-functions).

All of the hooks and helpers described in this section are used internally by the higher-level hooks and helpers, and do not need to be used directly (see [Hooks and Helper Functions](#hooks-and-helper-functions) and [Usage](#usage)).

### Filtering

Items are filtered according to user-selected filter key/value pairs.

- Keys and filter types (search, select, etc) are defined by the `filterCategories` array config argument. The `key` properties of each of these `FilterCategory` objects are the source of truth for the inferred generic type `TFilterCategoryKeys` (see [Types](#types)).
- Filter state is provided by `useFilterState` or `useFilterUrlParams`.
- For client-side filtering, the filter logic is provided by `getLocalFilterDerivedState` (based on the `getItemValue` callback defined on each `FilterCategory` object, which is not required when using server-side filtering).
- For server-side filtering, filter state is serialized for the API by `getFilterHubRequestParams`.
- Filter-related component props are provided by `getFilterProps`.
- Filter inputs and chips are rendered by the `FilterToolbar` component.

> ⚠️ TECH DEBT NOTE: The `FilterToolbar` component and `FilterCategory` type predate the table-controls pattern and are not located in this directory. The abstraction there may be a little too opaque and it does not take full advantage of TypeScript generics. We may want to adjust that code to better fit these patterns and move it here.

### Sorting

Items are sorted according to the user-selected sort column and direction.

- Sortable columns are defined by a `sortableColumns` array of `TColumnKey` values (see [Unique Identifiers](#unique-identifiers)).
- Sort state is provided by `useSortState` or `useSortUrlParams`.
- For client-side sorting, the sort logic is provided by `getLocalSortDerivedState` (based on the `getSortValues` config argument, which is not required when using server-side sorting).
- For server-side sorting, sort state is serialized for the API by `getSortHubRequestParams`.
- Sort-related component props are provided by `getSortProps`.
- Sort inputs are rendered by the table's `Th` component.

### Pagination

Items are paginated according to the user-selected page number and items-per-page count.

- The only config argument for pagination is the optional `initialItemsPerPage` which defaults to 10.
- Pagination state is provided by `usePaginationState` or `usePaginationUrlParams`.
- For client-side pagination, the pagination logic is provided by `getLocalPaginationDerivedState`.
- For server-side pagination, pagination state is serialized for the API by `getPaginationHubRequestParams`.
- Pagination-related component props are provided by `getPaginationProps`.
- A `useEffect` call which prevents invalid state after an item is deleted is provided by `usePaginationEffects`.
- Pagination inputs are rendered by our `SimplePagination` component which is a thin wrapper around the PatternFly `Pagination` component.

> ⚠️ TECH DEBT NOTE: Do we really need `SimplePagination`?

### Expansion

Item details can be expanded, either with a "single expansion" variant where an entire row is expanded to show more detail or a "compound expansion" variant where individual cells in a row are expanded. This is tracked in state by a mapping of item ids (derived from the `idProperty` config argument) to an array of either boolean values (for single expansion) or `columnKey` values that are expanded for that item (for compound expansion). See [Unique Identifiers](#unique-identifiers) for more on `idProperty` and `columnKey`.

- Single or compound expansion is defined by the optional `expandableVariant` config argument which defaults to `"single"`.
- Expansion state is provided by `useExpansionState` or `useExpansionUrlParams`.
- Expansion shorthand functions are provided by `getExpansionDerivedState`.
- Expansion is never managed server-side.
- Expansion-related component props are provided inside `useTableControlProps` in the `getSingleExpandTdProps` and `getCompoundExpandTdProps` functions.
- Expansion inputs are rendered by the table's `Td` component and expanded content is managed at the consumer level by conditionally rendering a second row with full colSpan in a `Tbody` component. The `numRenderedColumns` value returned by `useTableControlProps` can be used for the correct colSpan here.

> ⚠️ TECH DEBT NOTE: `getSingleExpandTdProps` and `getCompoundExpandTdProps` should probably be factored out of `useTableControlProps` into a decoupled `getExpansionProps` helper.

### Active Row

An item can be clicked to mark it as "active", which usually opens a drawer on the page to show more detail. Note that this is distinct from expansion and selection and these features can all be used together. Active row state is simply a single id value (number or string) for the active item, derived from the `idProperty` config argument (see [Unique Identifiers](#unique-identifiers)).

- The active row feature requires no config arguments.
- Active row state is provided by `useActiveRowState` or `useActiveRowUrlParams`.
- Active row shorthand functions are provided by `getActiveRowDerivedState`.
- A `useEffect` call which prevents invalid state after an item is deleted is provided by `useActiveRowEffects`.

⚠️ TECH DEBT NOTE: We may want to rename the "active row" feature and code to "active item" to be consistent about using "item" naming rather than "row" naming outside the rendering code (see [Item Objects, Not Row Objects](#item-objects-not-row-objects).

### Selection

Items can be selected with checkboxes on each row or with a bulk select control that provides actions like "select all", "select none" and "select page". The list of selected item ids in state can be used to perform bulk actions.

> ⚠️ TECH DEBT NOTE: Currently, selection state has not yet been refactored to be a part of the table-controls pattern and we are still relying on [the old `useSelectionState` from lib-ui](https://migtools.github.io/lib-ui/?path=/docs/hooks-useselectionstate--checkboxes) which dates back to older migtools projects. The return value of this legacy `useSelectionState` is required by `useTableControlProps`. Mike is working on a refactor to bring selection state hooks into this directory.

## Important Data Structure Notes

### Item Objects, Not Row Objects

None of the code here treats "rows" as their own data structure. The content and style of a row is a presentational detail that should be limited to the JSX where rows are rendered. When an array of row objects is used, those objects tend to duplicate API data with a different structure and the code must reason about two different representations of the data. Instead, this code works directly with arrays of "items" (the API data objects themselves) and makes all of an item's properties available where they might be needed without extra lookups. The consumer maps over item objects and derives row components from them only at render time.

An item object has the generic type `TItem`, which is inferred either from the type of the `items` array passed into `useLocalTableControls` (for client-paginated tables) or from the `currentPageItems` array passed into `useTableControlProps` (for server-paginated tables). See [Types](#types).

> ℹ️ CAVEAT: For server-paginated tables the item data is not in scope until after the API query hook is called, but the `useTableControlState` or `useTableControlUrlParams` hook must be called _before_ API queries because its return values are needed to serialize filter/sort/pagination params for the API. This means the inferred `TItem` type is not available when passing arguments to `useTableControlState` or `useTableControlUrlParams`. `TItem` resolves to `unknown` in this scope, which is usually fine since the arguments there don't need to know what type of items they are working with. If the item type is needed for any of these arguments it can be explicitly passed as a type param. However...
>
> ⚠️ TECH DEBT NOTE: Since TypeScript generic type param lists are all-or-nothing (you must either omit the list and infer all generics for a function or pass them all explicitly), this means all other type params which are normally inferred must be explicitly passed (including all of the `TColumnKey`s and `TFilterCategoryKey`s). This makes for some redundant code, although TypeScript will still enforce that it is all consistent. There is a possible upcoming TypeScript language feature which would allow partial inference in type param lists and may alleviate this in the future. See TypeScript pull requests [#26349](https://github.com/microsoft/TypeScript/pull/26349) and [#54047](https://github.com/microsoft/TypeScript/pull/54047).

### Unique Identifiers

Table columns are identified by unique keys which are statically inferred from the keys of the `columnNames` object (used in many places via the inferred generic type `TColumnKey`. See [Types](#types)). Any state which keeps track of something by column (such as which columns are sorted, and which columns are expanded in a compound-expandable row) uses these column keys as identifiers, and the user-facing column names can be looked up from the `columnNames` object anywhere a `columnKey` is present. Valid column keys are enforced via TypeScript generics; if a `columnKey` value is used that is not present in `columnNames`, you should get a type error.

Item objects must contain some unique identifier which is either a string or number. The property key of this identifier is a required config argument called `idProperty`, which will usually be `"id"`. If no unique identifier is present in the API data, an artificial one can be injected before passing the data into these hooks, which can be done in the useQuery `select` callback (see instances where we have used `"_ui_unique_id"`). Any state which keeps track of something by item (i.e. by row) makes use of `item[idProperty]` as an identifier. Examples of this include selected rows, expanded rows and active rows. Valid `idProperty` values are also enforced by TypeScript generics; if an `idProperty` is provided that is not a property on the `TItem` type, you should get a type error.

## Usage

### Should I Use Client or Server Logic?

If the API endpoints you're using support server-side pagination parameters, it is generally a good idea to use them for better performance and scalability. If you do use server-side pagination, you'll need to also use server-side filtering and sorting.

If the endpoints do not support these parameters or you need to have the entire collection of items in memory at once for some other reason, you'll need a client-paginated table. It is also slightly easier to implement a client-paginated table.

### Which Hooks/Functions Do I Need?

In most cases, you'll only need to use these higher-level hooks and helpers to build a table:

- For client-paginated tables: `useLocalTableControls` is all you need.
  - Internally it uses `useTableControlState`, `useTableControlProps` and the `getLocal[Feature]DerivedState` helpers. The config arguments object is a combination of the arguments required by `useTableControlState` and `useTableControlProps`.
  - The return value (an object we generally name `tableControls`) has everything you need to render your table. Give it a `console.log` to see what is available.
- For server-paginated tables: `useTableControlState` (or `useTableControlUrlParams`), `getHubRequestParams`, and `useTableControlProps`.
  - Choose whether you want to use React state or URL params as the source of truth, and use `useTableControlState` or `useTableControlUrlParams` which are interchangeable.
  - Take the object returned by that hook (generally named `tableControlState`) and pass it to `getHubRequestParams` function (you may need to spread it and add additional properties like `hubSortFieldKeys`).
  - Call your API query hooks, using the `hubRequestParams` as needed.
  - Call `useTableControlProps` and pass it an object including all properties from `tableControlState` along with additional config arguments. Some of these arguments will be derived from your API data, such as `currentPageItems`, `totalItemCount` and `isLoading`. Others are simply passed here rather than above because they are used only for rendering and not required for state management.
  - The return value (the same `tableControls` object returned by `useLocalTableControls`) has everything you need to render your table. Give it a `console.log` to see what is available.

If desired, you can use the lower-level hooks provided here on their own (for example, if you really only need pagination and you're not rendering a full table). However, if you are using more than one or two of them you may want to consider using the higher-level hooks above even if you don't need all the features. You can omit the config arguments for any features you don't need and then just don't use the relevant `propHelpers`.

---

<br /><br /><br />

# NOTE: Sections below this line are WIP. Ask Mike for clarification if you need it before he finishes writing this.

<br /><br /><br />

---

### Top-level Config Arguments and the `tableControls` Object

TODO explain how the args and return values from each hook get bundled together into a shared object.
TODO is this the best place in the docs for this section?
TODO tech debt note about how the structure of this is currently inferred from return values of all the hooks and should probably be explicitly defined in the types.ts file

### Example Table with client-side filtering/sorting/pagination logic

TODO explain benefits and limitations of client-side table logic
TODO show top-level usage of useLocalTableControls with components for rendering

### Example Table with server-side filtering/sorting/pagination logic

TODO explain benefits and limitations of server-side table logic
TODO show top-level usage of useTableControlState/useTableControlUrlParams with components for rendering

## Types

TODO maybe move this to the bottom?
TODO cover the stuff in types.ts export by export referencing the usage in specific hooks and components

## Hooks and Helper Functions

TODO maybe this section isn't necessary anymore if we go into enough detail in features and usage
TODO if we remove this remember to remove/change anchor links above

### Higher-level hooks (handle all state with combined options and return values)

TODO list all the hooks used above and their signatures and implementation overview

### Lower-level hooks (used internally by composite hooks but also usable standalone)

TODO list all the hooks for each concern and how they flow into each other in the composite hooks

## Components

TODO maybe this section isn't necessary anymore if we go into enough detail in features and usage
TODO summarize why it is still useful to have some component abstractions even though the goal is to preserve all composability / leave all control of JSX to the consumer
TODO list all the components exported from this directory, their signatures and why they are useful

## Future Features and Improvements

- Tech debt notes above should be addressed.
- It would be nice to support inline editable rows with a clean abstraction that fits into this pattern.
