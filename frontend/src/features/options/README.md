# Server options

The options feature has three layers:

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

The editor uses Mantine's normal controlled form state. Field controls receive
their current value explicitly, so related requirement and validation UI stays
in sync without a separate event system.

## Data flow

`useOptionsEditor` calls the backend and owns the form. `optionValues.ts`
converts between backend strings and form values. `validation.ts` validates
those form values. `OptionField` handles one setting row, while `OptionInput`
chooses its Mantine control. `useOptionsSearch` is independent of editing and
only decides which catalog entries are visible.

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
