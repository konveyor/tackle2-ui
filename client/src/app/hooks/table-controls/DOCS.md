# table-controls

## Documentation for our reusable hooks and components for managing state related to PatternFly tables

# Goals

TODO explain pros/cons of the legacy table vs composable table, and how the composability came at the cost of verbose code since page components are responsible for all the state
TODO explain that the goal is to restore some of the lost benefits of the legacy table abstraction without compromising the goals of the composable table.
TODO show tables with checks/Xs comparing legacy, composable, and composable w/ control hooks. goal is low-code but 100% composable with high refactorability.

# Terms/Concerns/Features (TODO)

TODO cover terms like filtering, sorting, pagination, expansion, selection and active-row concerns (is concerns the best word? maybe domains? functions? features?)

# Usage

## Table with client-side filtering/sorting/pagination logic

TODO show top-level usage of useLocalTableControls with components for rendering

## Table with server-side filtering/sorting/pagination logic

TODO explain benefits and limitations of server-side table logic
TODO explain separating useLocalTableControls into useTableControlState/useTableControlUrlParams and useTableControlProps so we can leverage state when making API requests and have API data in scope for prop helpers
TODO show top-level usage of those separated hooks with components for rendering

# Types

TODO maybe move this to the bottom?
TODO cover the stuff in types.ts export by export referencing the usage in specific hooks and components

# Hooks

## Higher-level hooks (handle all state with combined options and return values)

TODO list all the hooks used above and their signatures and implementation overview

## Lower-level hooks (used internally by composite hooks but also usable standalone)

TODO list all the hooks for each concern and how they flow into each other in the composite hooks

# Components

TODO summarize why it is still useful to have some component abstractions even though the goal is to preserve all composability / leave all control of JSX to the consumer
TODO list all the components exported from this directory, their signatures and why they are useful
