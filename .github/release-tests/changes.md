# Release workflow tests

Disposable changes for testing Release Please. Add or edit entries and commit with
`fix:`, `feat:`, or `feat!:` to test patch, minor, or major version bumps after the
initial release. This folder is not part of the application.

- Test 1: Update the pending release PR with a sample fix commit.
- Test 2: Verify a fix after 2.0.0 proposes 2.0.1 and preserves changelog history.
- Test 3: Exercise a patch release with signed update artifacts.
- Test 4: Exercise another patch release for the startup update check.
- Test 5: Exercise a patch release after the update timeout and settings changes.
