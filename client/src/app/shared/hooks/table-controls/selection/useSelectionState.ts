// TODO move useSelectionState as-is into here, rename to useLegacySelectionState? maybe don't need to?
// TODO restructure useSelectionState and useSelectionUrlParams like the other concerns in table hooks - rely on idProperty, etc
// TODO figure out how to make the URL param piece of it optional? give useUrlParams a disabled flag? maybe make that optional for all the concerns? play around with that...
// TODO make useUrlParams just omit the param from the URL if it is using the default -- does this prevent all the history.replace thrashing on first page mount?

// TODO figure out where it is being used right now with useLocalTableControls and play with it there

// TODO compared with lib-ui useSelectionState, have things driven from selectedItemIds instead of selectedItem objects
// TODO should we rename ActiveRowState to ActiveItemState? everything is driven from items not rows?
