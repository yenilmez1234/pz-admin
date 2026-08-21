# Options feature

The feature has three layers:

1. `catalog.ts` describes the options available in each game build and their
   category/section order. Metadata and layout are deliberately separate: the
   metadata is easy to look up by option name, while the layout remains easy to
   rearrange.
2. `useOptionsEditor` loads string values from the backend, parses them into a
   Mantine form, tracks edits, saves only changed values, and reloads the server
   state after saving.
3. `OptionsPage` selects the visible category or search results and renders
   sections. `OptionField` owns row-level behavior; `OptionInput` selects the
   concrete Mantine input for an option definition.

The form is uncontrolled because rendering every option on each keystroke made
typing noticeably slow. `useOptionFormEvents.ts` is the small bridge that
refreshes only the action footer and fields whose derived UI depends on another
value.

## Adding an option

1. Add its metadata to the build's definition map in `catalog.ts`.
2. Add its name to the desired category and section in the same build catalog.
3. Add the field label, description, and any choice labels to each
   `options.json` locale.

Unknown options returned by the server are ignored. Catalogued options missing
from the server response are hidden, allowing builds to differ without special
rendering code. Options marked `writeOnly` are the explicit exception: they
remain visible with an empty value because the server accepts changes but does
not reveal their current value.
