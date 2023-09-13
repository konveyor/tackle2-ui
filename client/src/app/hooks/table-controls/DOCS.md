# table-controls

Our reusable hooks and components for managing state related to composable PatternFly Tables

# Why?

These hooks and components are intended as the missing "batteries" for the composable PatternFly Table. When PatternFly moved away from the "batteries included" legacy monolith Table towards the newer composable Table components, the price of the improved flexibility was that the table itself can no longer manage its own state and its usage became more verbose with more required boilerplate code.

The table-controls hooks and components provide a pattern where state logic can be encapsulated with simple configuration and JSX for rendering table elements can be shortened via the use of "prop helpers", but the consumer can retain full control over the JSX composition and have access to all the state at any level. With this pattern, tables are simpler to build and maintain but we don't have to sacrifice any of the benefits gained by migrating from the legacy to the composable table.

# Goals

- Featureful tables should be easy to implement with code that is short and readable without sacrificing composability and refactorability.
- The consumer should be able to override any and all props manually on any element of the table. If there is a future need for table state to be used for rendering in a way we don't currently anticipate, that should not be blocked by this abstraction.
- Client-paginated and server-paginated tables should be similar to implement and share reusable. If a table needs to be converted between client logic and server logic, that should be relatively easy.
- Strict TypeScript types with generics inferred from parameters should be used to provide a safe and convenient development experience without having to repeat type annotations all over the page-level code.
- All features should be optional and fall back to reasonable defaults if their options are omitted.
- Code for each feature should be isolated enough that it could be reasonably used on its own.

# Features

The functionality of the table-controls hooks is broken down into the following features. Most features are defined by operations to be performed on API data before it is displayed in a table.

Note that filtering, sorting and pagination are special because they must be performed in a specific order to work correctly: filter and sort data, then paginate it. Using the higher-level hooks like `useLocalTableControls` or `useTableControlState` + `useTableControlProps` will take care of this for you (see [Usage](#usage)), but if you are handling pagination yourself with the lower-level hooks you'll need to be mindful of this order (see [Hooks and Helper Functions](#hooks-and-helper-functions)).

## Filtering

Items are filtered according to user-selected filter key/value pairs. Keys and filter types (search, select, etc) are defined by configurable `filterCategories`. Logic for client-side filtering is defined in each `FilterCategory` object with the `getItemValue` callback, which is not required when using server-side filtering.

Filter state is provided by `useFilterState` or `useFilterUrlParams`. For client-side filtering, the filter logic is provided by `getLocalFilterDerivedState` (based on `getItemValue`). For server-side filtering, filter state is serialized for the API by `getFilterHubRequestParams`. Filter-related component props are provided by `getFilterProps`, and the filter inputs and chips are rendered by the `FilterToolbar` component. All of these are used internally by the higher-level hooks and helpers (see [Hooks and Helper Functions](#hooks-and-helper-functions)).

⚠️ NOTE: The `FilterToolbar` component and `FilterCategory` type predate the table-controls pattern and are not located in this directory. The abstraction there may be a little too opaque and it does not take full advantage of TypeScript generics. We may want to adjust that code to better fit these patterns and move it here.

## Sorting

Items are sorted according to user-selected sort column and direction. Sortable columns are identified by a `sortableColumns` array of `TColumnKey` values (see [Unique Identifiers](#unique-identifiers)). Logic for client-side sorting is defined by the `getSortValues` callback, which is not required when using server-side sorting.

## Pagination

## Expansion

## Active Row

# ❗ Important Data Structure Notes

## Item Objects, Not Row Objects

None of the code here treats "rows" as their own data structure, because the structure and style of a row is a presentation detail that should be limited to the JSX where rows are rendered. Instead, this code works with arrays of "items" (the API data objects themselves) and makes all of an item's properties available where they might be needed. An item has the generic type `TItem`, which is inferred either from the type of the `items` array passed into `useLocalTableControls` (for client-paginated tables) or from the `currentPageItems` array passed into `useTableControlProps` (for server-paginated tables). See [Types](#types).

⚠️ NOTE: For server-paginated tables the item data is not in scope until after the API query hook is called. This means the inferred `TItem` type is not available when passing arguments to `useTableControlState` (which must be called before API queries because its return values are needed to serialize filter/sort/pagination params for the API). `TItem` is resolved as `unknown` in this scope, which is usually fine since the arguments there don't need to know what type of items they are working with. If the item type is needed for any of these arguments it can be explicitly passed as a type param, but due to the way TypeScript type params currently work this means all other inferred params must also be explicitly passed (including all of the `TFilterCategoryKey`s). This makes for a lot of repeated code (although TypeScript will still enforce that it is all consistent). There is an upcoming TypeScript feature which allows partial inference in type params and may alleviate this in the future. See TypeScript pull requests [#26349](https://github.com/microsoft/TypeScript/pull/26349) and [#54047](https://github.com/microsoft/TypeScript/pull/54047).

## Unique Identifiers

Columns are identified by unique keys which are statically inferred from the keys of the `columnNames` object (used in many places via the generic type `TColumnKey`. See [Types](#types)). Any state which keeps track of something by column (such as which columns are sorted, and which columns are expanded in a compound-expandable row) uses these column keys as identifiers, and the user-facing column names can be looked up from the `columnNames` object anywhere a `columnKey` is present. Valid column keys are enforced via TypeScript generics; if a `columnKey` value is used that is not present in `columnNames`, you should get a type error.

Item objects must contain some unique identifier which is either a string or number. The property key of this identifier must be passed into the hooks as `idProperty`, which will usually be `"id"`. If no unique identifier is present in the API data, an artificial one can be injected before passing the data into these hooks (see instances of `_ui_unique_id`), which can be done a the useQuery `select` callback. Any state which keeps track of something by item (i.e. by row) makes use of `item[idProperty]` as an identifier. Examples of this include selected rows, expandable rows and active rows. Valid `idProperty` values are also enforced by TypeScript generics; if an `idProperty` is provided that is not a property on the `TItem` type, you should get a type error.

# Usage

``

## Table with client-side filtering/sorting/pagination logic

TODO show top-level usage of useLocalTableControls with components for rendering

## Table with server-side filtering/sorting/pagination logic

TODO explain benefits and limitations of server-side table logic
TODO explain separating useLocalTableControls into useTableControlState/useTableControlUrlParams and useTableControlProps so we can leverage state when making API requests and have API data in scope for prop helpers
TODO show top-level usage of those separated hooks with components for rendering

# Types

TODO maybe move this to the bottom?
TODO cover the stuff in types.ts export by export referencing the usage in specific hooks and components

# Hooks and Helper Functions

## Higher-level hooks (handle all state with combined options and return values)

TODO list all the hooks used above and their signatures and implementation overview

## Lower-level hooks (used internally by composite hooks but also usable standalone)

TODO list all the hooks for each concern and how they flow into each other in the composite hooks

# Components

TODO summarize why it is still useful to have some component abstractions even though the goal is to preserve all composability / leave all control of JSX to the consumer
TODO list all the components exported from this directory, their signatures and why they are useful

# Future Features and Improvements

- It would be nice to support inline editable rows with a clean abstraction that fits into this pattern.
