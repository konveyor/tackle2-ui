# table-controls

Our reusable hooks and components for managing state related to composable PatternFly Tables

## Why?

These hooks and components are intended as the missing "batteries" for the composable PatternFly Table. When PatternFly deprecated the "batteries included" legacy monolith Table in favor of the newer composable Table components, the price of the improved flexibility was that the table itself can no longer manage its own state and its usage became more verbose with more required boilerplate code. This trade-off was worth it for PatternFly because the composability offered by the new components is so crucial. However, we can have the best of both worlds by encapsulating the boilerplate logic into hooks that feed props into the composable components without abstracting them away.

The table-controls hooks and components provide a pattern where state logic is encapsulated in hooks with simple configuration, JSX for rendering table elements can be shortened via the use of "prop helpers" returned by the hooks, and the consumer retains full control over the JSX and has access to all the state at any level. With this pattern, tables are simpler to build and maintain but we don't have to sacrifice any of the benefits gained by migrating from the deprecated to the composable table. We also gain new easily-enabled features that the deprecated Table never had.

## Goals

- Featureful tables should be easy to implement with code that is short and readable without sacrificing composability and refactorability.
- The consumer should be able to override any and all props manually on any element of the table. If there is a future need for table state to be used for rendering in a way we don't currently anticipate, that should not be blocked by this abstraction.
- Client-paginated and server-paginated tables should be similar to implement and share reusable code. If a table needs to be converted between client logic and server logic, that should be relatively easy.
- There should not be a concept of a "row object" because rows are presentational details and defining them as a separate model from the API data causes unnecessary complexity. See [Item Objects, Not Row Objects](#item-objects-not-row-objects).
- Strict TypeScript types with generics inferred from parameters should be used to provide a safe and convenient development experience without having to repeat type annotations all over the page-level code. TypeScript should enforce that we are passing the options required for the features that are enabled.
- All features should be optional in order to support incremental/partial adoption.
- Code for each feature should be isolated enough that it could be reasonably used on its own.

## Usage

### Example table with client-side filtering/sorting/pagination

For client-paginated tables, the only hook we need is `useLocalTableControls`. All arguments can be passed to it in one object, and the `tableControls` object returned by it contains everything we need to render the composable table.

This simple example includes only the filtering, sorting and pagination features and excludes arguments and properties related to the other features (see [Features](#features)).

Features are enabled by passing `is[Feature]Enabled` boolean arguments. Required arguments for the enabled features will be enforced by TypeScript based on which features are enabled. All features are disabled by default; for this basic example with filtering, sorting and pagination, we must pass true values for `isFilterEnabled`, `isSortEnabled` and `isPaginationEnabled`.

```tsx
// In a real table, this API data would come from a useQuery call.
const isLoading = false;
const isError = false;
const things: Thing[] = [
  { id: 1, name: "Thing 1", description: "Something from the API" },
  { id: 2, name: "Thing 2", description: "Something else from the API" },
];

const tableControls = useLocalTableControls({
  idProperty: "id", // The name of a unique string or number property on the data items.
  items: things, // The generic type `TItem` is inferred from the items passed here.
  columnNames: {
    // The keys of this object define the inferred generic type `TColumnKey`. See "Unique Identifiers".
    name: "Name",
    description: "Description",
  },
  isFilterEnabled: true,
  isSortEnabled: true,
  isPaginationEnabled: true,
  // Because isFilterEnabled is true, TypeScript will require these filterCategories:
  filterCategories: [
    {
      key: "name",
      title: "Name",
      type: FilterType.search,
      placeholderText: "Filter by name...",
      getItemValue: (thing) => thing.name || "",
    },
  ],
  // Because isSortEnabled, TypeScript will require these sort-related properties:
  sortableColumns: ["name", "description"],
  getSortValues: (thing) => ({
    name: thing.name || "",
    description: thing.description || "",
  }),
  initialSort: { columnKey: "name", direction: "asc" },
  isLoading,
});

// Here we destructure some of the properties from `tableControls` for rendering.
// Later we also spread the entire `tableControls` object onto components whose props include subsets of it.
const {
  currentPageItems, // These items have already been paginated.
  // `numRenderedColumns` is based on the number of columnNames and additional columns needed for
  // rendering controls related to features like selection, expansion, etc.
  // It is used as the colSpan when rendering a full-table-wide cell.
  numRenderedColumns,
  // The objects and functions in `propHelpers` correspond to the props needed for specific PatternFly or Tackle
  // components and are provided to reduce prop-drilling and make the rendering code as short as possible.
  propHelpers: {
    toolbarProps,
    filterToolbarProps,
    paginationToolbarItemProps,
    paginationProps,
    tableProps,
    getThProps,
    getTrProps,
    getTdProps,
  },
} = tableControls;

return (
  <>
    <Toolbar {...toolbarProps}>
      <ToolbarContent>
        <FilterToolbar {...filterToolbarProps} />
        {/* You can render whatever other custom toolbar items you may need here! */}
        <ToolbarItem {...paginationToolbarItemProps}>
          <SimplePagination
            idPrefix="example-things-table"
            isTop
            paginationProps={paginationProps}
          />
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
    <Table {...tableProps} aria-label="Example things table">
      <Thead>
        <Tr>
          <TableHeaderContentWithControls {...tableControls}>
            <Th {...getThProps({ columnKey: "name" })} />
            <Th {...getThProps({ columnKey: "description" })} />
          </TableHeaderContentWithControls>
        </Tr>
      </Thead>
      <ConditionalTableBody
        isLoading={isLoading}
        isError={isError}
        isNoData={currentPageItems.length === 0}
        noDataEmptyState={
          <EmptyState variant="sm">
            <EmptyStateIcon icon={CubesIcon} />
            <Title headingLevel="h2" size="lg">
              No things available
            </Title>
          </EmptyState>
        }
        numRenderedColumns={numRenderedColumns}
      >
        <Tbody>
          {currentPageItems?.map((thing, rowIndex) => (
            <Tr key={thing.id} {...getTrProps({ item: thing })}>
              <TableRowContentWithControls
                {...tableControls}
                item={thing}
                rowIndex={rowIndex}
              >
                <Td width={25} {...getTdProps({ columnKey: "name" })}>
                  {thing.name}
                </Td>
                <Td width={75} {...getTdProps({ columnKey: "description" })}>
                  {thing.description}
                </Td>
              </TableRowContentWithControls>
            </Tr>
          ))}
        </Tbody>
      </ConditionalTableBody>
    </Table>
    <SimplePagination
      idPrefix="example-things-table"
      isTop={false}
      paginationProps={paginationProps}
    />
  <>
);
```

### Example table with server-side filtering/sorting/pagination (and state persistence)

The usage is similar here, but some client-specific arguments are no longer required (like `getSortValues` and the `getItemValue` property of the filter category) and we break up the arguments object passed to `useLocalTableControls` into two separate objects passed to `useTableControlState` and `useTableControlProps` based on when they are needed. Note that the object passed to the latter contains all the properties of the object returned by the former in addition to things derived from the fetched API data. All of the arguments passed to both `useTableControlState` and `useTableControlProps` as well as the return values from both are included in the `tableControls` object returned by `useTableControlProps` (and by `useLocalTableControls` above). This way, we have one big object we can pass around to any components or functions that need any of the configuration, state, derived state, or props present on it, and we can destructure/reference them from a central place no matter where they came from.

Note also: the destructuring of `tableControls` and returned JSX is not included in this example code because **_it is identical to the example above_**. The only differences between client-paginated and server-paginated tables are in the hook calls; the `tableControls` object and its usage are the same for all tables.

This example also shows a powerful optional capability of these hooks: the `persistTo` argument. This can be passed to either `useTableControlState` or `useLocalTableControls` and it allows us to store the current pagination/sort/filter state in a custom location and use that as the source of truth. The supported `persistTo` values are `"state"` (default), `"urlParams"` (recommended), `"localStorage"` or `"sessionStorage"`. For more on each persistence target see [Features](#features).

Here we use `persistTo: "urlParams"` which will use URL query parameters as the source of truth for the state of all this table's features. We also pass an optional `persistenceKeyPrefix` which distinguishes this persisted state from any other state that may be persisted in the URL by other tables on the same page (it can be omitted if there is only one table on the page). It should be a short string because it is included as a prefix on every URL param name. We'll use `"t"` for the table containing our Thing objects.

Because our state is persisted in the page URL, we can reload the browser or press the Back and Forward buttons without losing our current filter, sort, and pagination selections. We can even bookmark the page and all that state will be restored when loading the bookmark!

```tsx
const tableControlState = useTableControlState({
  persistTo: "urlParams",
  persistenceKeyPrefix: "t",
  columnNames: {
    name: "Name",
    description: "Description",
  },
  isFilterEnabled: true,
  isSortEnabled: true,
  isPaginationEnabled: true,
  filterCategories: [
    {
      key: "name",
      title: "Name",
      type: FilterType.search,
      placeholderText: "Filter by name...",
    },
  ],
  sortableColumns: ["name", "description"],
  initialSort: { columnKey: "name", direction: "asc" },
});

const hubRequestParams = getHubRequestParams({
  ...tableControlState, // Includes filterState, sortState and paginationState
  hubSortFieldKeys: {
    // The keys required for sorting on the server, in case they aren't the same as our columns here
    name: "name",
    description: "description",
  },
});

// `useFetchThings` is an example of a custom hook that calls a react-query `useQuery`
// and the `serializeRequestParamsForHub` helper.
// Any API fetch implementation could be used here as long as it will re-fetch when `hubRequestParams` changes.
// The `data` returned here has been paginated, filtered and sorted on the server.
const { data, totalItemCount, isLoading, isError } =
  useFetchThings(hubRequestParams);

const tableControls = useTableControlProps({
  ...tableControlState, // Includes filterState, sortState and paginationState
  idProperty: "id",
  currentPageItems: data,
  totalItemCount,
  isLoading,
});

// Everything else (destructuring `tableControls` and returning JSX) is the same as the client-side example!
```

### Kitchen sink example with per-feature state persistence and all features enabled

Here's an example of another server-computed table with all of the table-controls features enabled (see [Features](#features)). Note that if you wanted to make this example client-computed, you would pass all the new feature-specific properties seen here to `useLocalTableControls` instead of `useTableControlState`.

New features added here in addition to filtering, sorting and pagination are:

- Expansion - Each row has an expand toggle button to the left of its data (automatically injected by the `TableRowContentWithControls` component), which opens additional detail below the row. (this is the "single" expand variant, compound expansion is also supported). The `expandableVariant` option is required because `isExpansionEnabled` is true.
  - This makes the `getExpandedContentTdProps` propHelper and the `expansionDerivedState` object available on the `tableControls` object.
  - Each row is now contained in a `<Tbody>` component which pairs the existing `<Tr>` with another `<Tr>` containing that row's `<ExpandableRowContent>`.
- Active item - Rows have hover styles and are clickable (handled automatically by `getTrProps`). Clicking a row marks that row's item as "active", which can be used to open a drawer or whatever else is needed on the page. This is enabled by `isActiveItemEnabled`, which does not require any additional options.
  - This makes the `activeItemDerivedState` object available on the `tableControls` object.

> ⚠️ TECH DEBT NOTE: The selection feature is currently not enabled in this example because it is about to significantly change with a refactor. Currently to use selection you have to use the outdated `useSelectionState` from lib-ui and pass its return values to `useTableControlProps`. Once selection is moved into table-controls, it will be configurable alongside the other features in `useTableControlState` and added to this example.

> ⚠️ TECH DEBT NOTE: We should also add a compound-expand example, but that can maybe wait for the proper extension-seed docs in table-batteries after the code is moved there.

Here we'll also show an alternate way of using `persistTo`: separate persistence targets per feature. Let's say that for this table, we want the user's filters to persist in `localStorage` where they will be restored no matter what the user does, but we want the sort, pagination and other state to reset when we leave the page. We can do this by passing an object to `persistTo` instead of a string. We specify the default persistence target as React state with `default: "state"`, and override it for the filters with `filter: "localStorage"`.

```tsx
const tableControlState = useTableControlState({
  persistTo: {
    default: "state",
    filter: "localStorage",
  },
  persistenceKeyPrefix: "t",
  columnNames: {
    name: "Name",
    description: "Description",
  },
  isFilterEnabled: true,
  isSortEnabled: true,
  isPaginationEnabled: true,
  isExpansionEnabled: true,
  isActiveItemEnabled: true,
  filterCategories: [
    {
      key: "name",
      title: "Name",
      type: FilterType.search,
      placeholderText: "Filter by name...",
    },
  ],
  sortableColumns: ["name", "description"],
  initialSort: { columnKey: "name", direction: "asc" },
  expandableVariant: "single",
});

const hubRequestParams = getHubRequestParams({
  ...tableControlState,
  hubSortFieldKeys: {
    name: "name",
    description: "description",
  },
});

const { data, totalItemCount, isLoading, isError } =
  useFetchThings(hubRequestParams);

const tableControls = useTableControlProps({
  ...tableControlState,
  idProperty: "id",
  currentPageItems: data,
  totalItemCount,
  isLoading,
});

const {
  currentPageItems,
  numRenderedColumns,
  propHelpers: {
    toolbarProps,
    filterToolbarProps,
    paginationToolbarItemProps,
    paginationProps,
    tableProps,
    getThProps,
    getTrProps,
    getTdProps,
    getExpandedContentTdProps,
  },
  activeItemDerivedState: { activeItem, clearActiveItem },
  expansionDerivedState: { isCellExpanded },
} = tableControls;

return (
  <>
    <Toolbar {...toolbarProps}>
      <ToolbarContent>
        <FilterToolbar {...filterToolbarProps} />
        <ToolbarItem {...paginationToolbarItemProps}>
          <SimplePagination
            idPrefix="example-things-table"
            isTop
            paginationProps={paginationProps}
          />
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
    <Table {...tableProps} aria-label="Example things table">
      <Thead>
        <Tr>
          <TableHeaderContentWithControls {...tableControls}>
            <Th {...getThProps({ columnKey: "name" })} />
            <Th {...getThProps({ columnKey: "description" })} />
          </TableHeaderContentWithControls>
        </Tr>
      </Thead>
      <ConditionalTableBody
        isLoading={isLoading}
        isError={isError}
        isNoData={currentPageItems.length === 0}
        noDataEmptyState={
          <EmptyState variant="sm">
            <EmptyStateIcon icon={CubesIcon} />
            <Title headingLevel="h2" size="lg">
              No things available
            </Title>
          </EmptyState>
        }
        numRenderedColumns={numRenderedColumns}
      >
        <Tbody>
          {currentPageItems?.map((thing, rowIndex) => (
            <Tbody key={thing.id} isExpanded={isCellExpanded(thing)}>
              <Tr {...getTrProps({ item: thing })}>
                <TableRowContentWithControls
                  {...tableControls}
                  item={thing}
                  rowIndex={rowIndex}
                >
                  <Td width={25} {...getTdProps({ columnKey: "name" })}>
                    {thing.name}
                  </Td>
                  <Td width={75} {...getTdProps({ columnKey: "description" })}>
                    {thing.description}
                  </Td>
                </TableRowContentWithControls>
              </Tr>
              {isCellExpanded(thing) && (
                <Tr isExpanded>
                  <Td />
                  <Td {...getExpandedContentTdProps({ item: thing })}>
                    <ExpandableRowContent>
                      Some extra detail about thing {thing.name} goes here!
                    </ExpandableRowContent>
                  </Td>
                </Tr>
              )}
            </Tbody>
          ))}
        </Tbody>
      </ConditionalTableBody>
    </Table>
    <SimplePagination
      idPrefix="example-things-table"
      isTop={false}
      paginationProps={paginationProps}
    />
    {/* Stub example of something custom you might render based on the `activeItem`. Source not included. */}
    <ThingDetailDrawer
      thingId={activeItem?.id || null}
      onCloseClick={clearActiveItem}
    />
  <>
);
```

### Should I Use Client or Server Logic?

If the API endpoints you're using support server-side pagination parameters, it is generally a good idea to use them for better performance and scalability. If you do use server-side pagination, you'll need to also use server-side filtering and sorting.

If the endpoints do not support these parameters or you need to have the entire collection of items in memory at once for some other reason, you'll need a client-paginated table. It is also slightly easier to implement a client-paginated table.

### Which Hooks/Functions Do I Need?

In most cases, you'll only need to use these higher-level hooks and helpers to build a table:

- For client-paginated tables: `useLocalTableControls` is all you need.
  - Internally it uses `useTableControlState`, `useTableControlProps` and the `getLocalTableControlDerivedState` helper. The config arguments object is a combination of the arguments required by `useTableControlState` and `useTableControlProps`.
  - The return value (an object we generally name `tableControls`) has everything you need to render your table. Give it a `console.log` to see what is available.
- For server-paginated tables: `useTableControlState`, `getHubRequestParams`, and `useTableControlProps`.
  - Choose whether you want to use React state, URL params or localStorage/sessionStorage as the source of truth, and call `useTableControlState` with the appropriate `persistTo` option and optional `persistenceKeyPrefix` (to namespace persisted state for multiple tables on the same page).
    - `persistTo` can be `"state" | "urlParams" | "localStorage" | "sessionStorage"`, and defaults to `"state"` if omitted (falls back to regular React state).
    - You can also use a different type of storage for the state of each feature by passing an object for `persistTo`. See the [Kitchen sink example](#kitchen-sink-example-with-per-feature-state-persistence-and-all-features-enabled).
  - Take the object returned by that hook (generally named `tableControlState`) and pass it to the `getHubRequestParams` function (you may need to spread it and add additional properties like `hubSortFieldKeys`). (⚠️ TECH DEBT NOTE: This is Konveyor-specific)
  - Call your API query hooks, using the `hubRequestParams` as needed.
  - Call `useTableControlProps` and pass it an object spreading all properties from `tableControlState` along with additional config arguments. Some of these arguments will be derived from your API data, such as `currentPageItems`, `totalItemCount` and `isLoading`. Others are simply passed here rather than above because they are used only for rendering and not required for state management.
  - The return value (the same `tableControls` object returned by `useLocalTableControls`) has everything you need to render your table. Give it a `console.log` to see what is available.

If desired, you can use the lower-level feature-specific hooks (see [Features](#features)) on their own (for example, if you really only need pagination and you're not rendering a full table). However, if you are using more than one or two of them you may want to consider using these higher-level hooks even if you don't need all the features. You can omit the config arguments for any features you don't need and then just don't use the relevant `propHelpers`.

## Features

The functionality and state of the table-controls hooks is broken down into the following features. Each of these features represents a slice of the logical concerns for a table UI.

Note that the filtering, sorting and pagination features are special because they must be performed in a specific order to work correctly: filter and sort data, then paginate it. Using the higher-level hooks like `useLocalTableControls` or `useTableControlState` + `useTableControlProps` will take care of this for you (see [Usage](#usage)), but if you are handling filtering/sorting/pagination yourself with the lower-level hooks you'll need to be mindful of this order.

The state used by each feature (provided by `use[Feature]State` hooks) can be stored either in React state (default), in the browser's URL query parameters (recommended), or in the browser's `localStorage` or `sessionStorage`. If URL params are used, the user's current filters, sort, pagination state, expanded/active rows and more are preserved when reloading the browser, using the browser Back and Forward buttons, or loading a bookmark. The storage target for each feature is specified with the `persistTo` property. The supported `persistTo` values are:

- `"state"` (default) - Plain React state. Resets on component unmount or page reload.
- `"urlParams"` (recommended) - URL query parameters. Persists on page reload, browser history buttons (back/forward) or loading a bookmark. Resets on page navigation.
- `"localStorage"` - Browser localStorage API. Persists semi-permanently and is shared across all tabs/windows. Resets only when the user clears their browsing data.
- `"sessionStorage"` - Browser sessionStorage API. Persists on page/history navigation/reload. Resets when the tab/window is closed.

All of the hooks and helpers described in this section are used internally by the higher-level hooks and helpers, and do not need to be used directly (see [Usage](#usage)).

### Filtering

Items are filtered according to user-selected filter key/value pairs.

- Keys and filter types (search, select, etc) are defined by the `filterCategories` array config argument. The `key` properties of each of these `FilterCategory` objects are the source of truth for the inferred generic type `TFilterCategoryKeys` (For more, see the JSDoc comments in the `types.ts` file).
- Filter state is provided by `useFilterState`.
- For client-side filtering, the filter logic is provided by `getLocalFilterDerivedState` (based on the `getItemValue` callback defined on each `FilterCategory` object, which is not required when using server-side filtering).
- For server-side filtering, filter state is serialized for the API by `getFilterHubRequestParams`.
- Filter-related component props are provided by `useFilterPropHelpers`.
- Filter inputs and chips are rendered by the `FilterToolbar` component.

> ⚠️ TECH DEBT NOTE: The `FilterToolbar` component and `FilterCategory` type predate the table-controls pattern (they are tackle2-ui legacy code) and are not located in this directory. The abstraction there may be a little too opaque and it does not take full advantage of TypeScript generics. We may want to adjust that code to better fit these patterns and move it here.

### Sorting

Items are sorted according to the user-selected sort column and direction.

- Sortable columns are defined by a `sortableColumns` array of `TColumnKey` values (see [Unique Identifiers](#unique-identifiers)).
- Sort state is provided by `useSortState`.
- For client-side sorting, the sort logic is provided by `getLocalSortDerivedState` (based on the `getSortValues` config argument, which is not required when using server-side sorting).
- For server-side sorting, sort state is serialized for the API by `getSortHubRequestParams`.
- Sort-related component props are provided by `useSortPropHelpers`.
- Sort inputs are rendered by the table's `Th` PatternFly component.

### Pagination

Items are paginated according to the user-selected page number and items-per-page count.

- The only config argument for pagination is the optional `initialItemsPerPage` which defaults to 10.
- Pagination state is provided by `usePaginationState`.
- For client-side pagination, the pagination logic is provided by `getLocalPaginationDerivedState`.
- For server-side pagination, pagination state is serialized for the API by `getPaginationHubRequestParams`.
- Pagination-related component props are provided by `usePaginationPropHelpers`.
- A `useEffect` call which prevents invalid state after an item is deleted is provided by `usePaginationEffects`. This is called internally by `usePaginationPropHelpers`.
- Pagination inputs are rendered by our `SimplePagination` component which is a thin wrapper around the PatternFly `Pagination` component.

> ⚠️ TECH DEBT NOTE: The `SimplePagination` component also predates the table-controls pattern (legacy tackle2-ui code). We probably don't even need it and should remove it.

> ⚠️ TECH DEBT NOTE: Is usePaginationPropHelpers the best place to call usePaginationEffects? Should we make the consumer call it explicitly?

### Expansion

Item details can be expanded, either with a "single expansion" variant where an entire row is expanded to show more detail or a "compound expansion" variant where an individual cell in a row (one at a time per row) is expanded. This is tracked in state by a mapping of item ids (derived from the `idProperty` config argument) to either a boolean value (for single expansion) or a `columnKey` value (for compound expansion). See [Unique Identifiers](#unique-identifiers) for more on `idProperty` and `columnKey`.

- Single or compound expansion is defined by the optional `expandableVariant` config argument which defaults to `"single"`.
- Expansion state is provided by `useExpansionState`.
- Expansion shorthand functions are provided by `getExpansionDerivedState`.
- Expansion is never managed server-side.
- Expansion-related component props are provided by `useExpansionPropHelpers`.
- Expansion inputs are rendered by the table's `Td` PatternFly component and expanded content is managed at the consumer level by conditionally rendering a second row with full colSpan inside a PatternFly `Tbody` component. The `numRenderedColumns` value returned by `useTableControlProps` can be used for the correct colSpan here.

### Active Item

A row can be clicked to mark its item as "active", which usually opens a drawer on the page to show more detail. Note that this is distinct from expansion (toggle arrows) and selection (checkboxes) and these features can all be used together. Active item state is simply a single id value (number or string) for the active item, derived from the `idProperty` config argument (see [Unique Identifiers](#unique-identifiers)).

- The active item feature requires no config arguments.
- Active item state is provided by `useActiveItemState`.
- Active item shorthand functions are provided by `getActiveItemDerivedState`.
- Active-item-related component props are provided by `useActiveItemPropHelpers`.
- A `useEffect` call which prevents invalid state after an item is deleted is provided by `useActiveItemEffects`. This is called internally in `useActiveItemPropHelpers`.

> ⚠️ TECH DEBT NOTE: Is useActiveItemPropHelpers the best place to call useActiveItemEffects? Should we make the consumer call it explicitly?

### Selection

Items can be selected with checkboxes on each row or with a bulk select control that provides actions like "select all", "select none" and "select page". The list of selected item ids in state can be used to perform bulk actions like Delete.

> ⚠️ TECH DEBT NOTE: Currently, selection state has not yet been refactored to be a part of the table-controls pattern and we are still relying on [the old `useSelectionState` from lib-ui](https://migtools.github.io/lib-ui/?path=/docs/hooks-useselectionstate--checkboxes) which dates back to older migtools projects. The return value of this legacy `useSelectionState` is required by `useTableControlProps`. Mike is working on a refactor to bring selection state hooks into this directory.

## Important Data Structure Notes

### Item Objects, Not Row Objects

None of the code here treats "rows" as their own data structure. The content and style of a row is a presentational detail that should be limited to the JSX where rows are rendered. In implementations which use arrays of row objects (like the deprecated PatternFly table) those objects tend to duplicate API data with a different structure and the code must reason about two different representations of the data. Instead, this code works directly with arrays of "items" (the API data objects themselves) and makes all of an item's API object properties available where they might be needed without extra lookups. The consumer maps over item objects and derives row components from them only at render time.

An item object has the generic type `TItem`, which is inferred by TypeScript either from the type of the `items` array passed into `useLocalTableControls` (for client-paginated tables) or from the `currentPageItems` array passed into `useTableControlProps` (for server-paginated tables). For more, see the JSDoc comments in the `types.ts` file.

> ℹ️ CAVEAT: For server-paginated tables the item data is not in scope until after the API query hook is called, but the `useTableControlState` hook must be called _before_ API queries because its return values are needed to serialize filter/sort/pagination params for the API. This means the inferred `TItem` type is not available when passing arguments to `useTableControlState`. `TItem` resolves to `unknown` in this scope, which is usually fine since the arguments there don't need to know what type of items they are working with. If the item type is needed for any of these arguments it can be explicitly passed as a type param. However...
>
> ⚠️ TECH DEBT NOTE: TypeScript generic type param lists (example: `fn<This, List, Here>(args);`) are all-or-nothing (you must either omit the list and infer all generics for a function or pass them all explicitly). This means if you need to pass an explicit type for `TItem`, all other type params which are normally inferred must also be explicitly passed (including all of the `TColumnKey`s and `TFilterCategoryKey`s). This makes for some redundant code, although TypeScript will still enforce that it is all consistent. There is a possible upcoming TypeScript language feature which would allow partial inference in type param lists and may alleviate this in the future. See TypeScript pull requests [#26349](https://github.com/microsoft/TypeScript/pull/26349) and [#54047](https://github.com/microsoft/TypeScript/pull/54047), and our issue [#1456](https://github.com/konveyor/tackle2-ui/issues/1456).

### Unique Identifiers

#### Column keys

Table columns are identified by unique keys which are statically inferred from the keys of the `columnNames` object (used in many places via the inferred generic type `TColumnKey`. See the JSDoc comments in the `types.ts` file). Any state which keeps track of something by column (such as which columns are sorted and which columns are expanded in a compound-expandable row) uses these column keys as identifiers, and the user-facing column names can be looked up from the `columnNames` object anywhere a `columnKey` is present. Valid column keys are enforced via TypeScript generics; if a `columnKey` value is used that is not present in `columnNames`, you should get a type error.

#### Item IDs

Item objects must contain some unique identifier which is either a string or number. The property key of this identifier is a required config argument called `idProperty`, which will usually be `"id"`. If no unique identifier is present in the API data, an artificial one can be injected before passing the data into these hooks, which can be done in the useQuery `select` callback (see instances where we have used `"_ui_unique_id"`). Any state which keeps track of something by item (i.e. by row) makes use of `item[idProperty]` as an identifier. Examples of this include selected rows, expanded rows and active rows. Valid `idProperty` values are also enforced by TypeScript generics; if an `idProperty` is provided that is not a property on the `TItem` type, you should get a type error.

> ⚠️ TECH DEBT NOTE: Things specific to `useQuery` and `_ui_unique_id` here are Konveyor-specific notes that should be removed after moving this to table-batteries.

---

## Future Features and Improvements

- Tech debt notes above should be addressed.
- We should add full API docs for all the hooks, helpers and components generated from the JSDoc comments.
- It would be nice to support inline editable rows with a clean abstraction that fits into this pattern.
