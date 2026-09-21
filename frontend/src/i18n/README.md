# Translation key conventions

Translation keys are stable semantic identifiers. They describe what a message
means, not its current English wording or the component prop that renders it.
These semantic conventions are maintained through review. Automated validation
only checks objective resource structure, English key syntax and coverage, and
the validity and interpolation compatibility of translations that exist.

English (`en-US`) is the source of truth and the only locale required to contain
every namespace and key. Other locales may omit namespaces or individual keys;
i18next falls back to English for those messages. A non-English resource may not
introduce a namespace or key that does not exist in English, and any translated
message must preserve the English interpolation variables.

Static translation calls are type-checked against the English resources by
TypeScript. Dynamic calls must use bounded domain values or typed key unions so
they cannot silently construct invalid keys.

## Namespaces and structure

- Use one namespace per stable feature or domain, such as `items`, `players`, or
  `vehicles`. Do not organize namespaces around individual components.
- Put a message in `common` only when every use has the same meaning and should
  change together. Identical English text alone is not a reason to share a key.
- Use lowerCamelCase for semantic path segments.
- Within a namespace, group keys by surface, then concept, then role:

  ```text
  browser.search.label
  browser.search.placeholder
  browser.search.clear
  ```

- Use a terminal `.label` only for text that names a control or region. Nest
  content roles instead of creating compound segments ending in
  `AccessibleLabel`, `Button`, `Column`, `Description`, `Label`, `Placeholder`,
  `Section`, or `Title`. For example, use `search.label` instead of
  `searchLabel` and `errors.load.title` instead of `errors.loadTitle`.
- Group actions semantically under `.actions`, for example
  `browser.actions.addItem`. Name the action itself; do not add a suffix based on
  whether it is visible text or an `aria-label`.

## File formatting

Hand-maintained `resources/**/*.json` files use two-space indentation, expanded
objects, LF line endings, and one final newline. Object keys are sorted recursively
using case-sensitive, locale-independent JavaScript string order (integer index
keys follow JSON.stringify's numeric ordering). Array order and all message values
are preserved. Catalog identifiers are sorted, never renamed. Generated game
translations are excluded.

Run `pnpm format:translations` to apply this format, or `pnpm format` to format the
whole frontend. `pnpm format:check` checks it without writing and runs as part of
`pnpm check`. Prettier's translation-only `json-stringify` override keeps editor
whitespace formatting consistent; the translation formatter also sorts keys.
This is a formatting rule, not a requirement for complete non-English locales.

## Messages

- Use sentence case for English and Turkish UI text, including headings,
  buttons, labels, and generic catalog descriptions: `Item browser`,
  `Edit starting items`, `Eşya kataloğu`. Follow each language's conventions
  for other locales.
- Preserve proper names, brands, acronyms, named keyboard keys, and technical
  identifiers. Keep fragments interpolated into sentences in their appropriate
  case. Do not change lookup keys or imported game names to match UI casing.
- Review capitalization in context; do not enforce it with automatic lowercasing
  or a casing validator.
- Translate complete messages. Do not concatenate translated fragments or
  assume English word order.
- Use named, semantic interpolation variables such as `{{name}}`, `{{count}}`,
  or `{{duration}}`, and keep their names identical in every locale.
- Use i18next plural suffixes on one semantic base, such as `summary_one` and
  `summary_other`, and always pass `count` when resolving that base.
- i18next context variants use a shared semantic base in the same way. The
  current UI contexts are `_minimum` and `_maximum`; resolve them by passing the
  matching `context` value rather than treating the suffix as another path
  segment.
- Keep accessibility-only copy beside the feature and control it describes.
  Prefer visible or native labels when available; otherwise make the accessible
  name specific enough to identify the control on its own.

## Catalog exceptions

Catalog resources may use stable game or domain identifiers as lookup keys.
Those identifiers are data contracts, so preserve their spelling, casing, and
structure instead of converting them to lowerCamelCase. This exception applies
to identifiers, not to surrounding UI translation keys.

## Changing keys

Treat a key rename as a migration:

1. Rename one coherent subtree at a time.
2. Update English and every call site atomically. Migrate the old key in each
   non-English locale where that translation currently exists.
3. Preserve interpolation variables and complete plural families.
4. Remove the old keys only after their usages have moved.
5. Run `pnpm check:translations` after each batch and `pnpm check` before
   completion from the `frontend` directory.

Do not rename a key merely because its translated wording changed. When a rename
is necessary, keep an old-to-new mapping in the change description so translation
history can be migrated in the translation platform.
