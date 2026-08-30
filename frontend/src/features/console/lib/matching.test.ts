import { describe, expect, it } from "vitest";
import {
  consoleSuggestionSegments,
  rankedConsoleSuggestions,
} from "./matching";

describe("rankedConsoleSuggestions", () => {
  it("ranks prefixes before substrings and ordered word-part matches", () => {
    const candidates = [
      "server.reload-options",
      "reload-server",
      "server-reload",
      "server.restart",
    ];

    expect(rankedConsoleSuggestions(candidates, "server reload", 10)).toEqual([
      "server.reload-options",
      "server-reload",
    ]);
    expect(rankedConsoleSuggestions(candidates, "reload", 10)).toEqual([
      "reload-server",
      "server.reload-options",
      "server-reload",
    ]);
  });

  it("matches without regard to letter case while preserving suggestions", () => {
    expect(
      rankedConsoleSuggestions(["AddUser", "additem", "RemoveUser"], "ADD", 10),
    ).toEqual(["AddUser", "additem"]);
  });

  it("keeps source order among matches of equal quality", () => {
    expect(
      rankedConsoleSuggestions(["addxp", "adduser", "additem"], "add", 10),
    ).toEqual(["addxp", "adduser", "additem"]);
  });

  it.each([
    { expected: [], limit: 0 },
    { expected: ["one", "two"], limit: 2 },
    { expected: ["one", "two", "three"], limit: 10 },
  ])("returns at most $limit suggestions", ({ expected, limit }) => {
    expect(
      rankedConsoleSuggestions(["one", "two", "three"], "", limit),
    ).toEqual(expected);
  });

  it("does not match query parts in reverse candidate order", () => {
    expect(
      rankedConsoleSuggestions(["reload-server"], "server reload", 10),
    ).toEqual([]);
  });
});

describe("consoleSuggestionSegments", () => {
  it("marks a case-insensitive substring in the original suggestion", () => {
    expect(consoleSuggestionSegments("RemoveUser", "USER")).toEqual([
      { matched: false, start: 0, text: "Remove" },
      { matched: true, start: 6, text: "User" },
    ]);
  });

  it("marks ordered query parts and leaves separators unmatched", () => {
    expect(
      consoleSuggestionSegments("server.reload-options", "server options"),
    ).toEqual([
      { matched: true, start: 0, text: "server" },
      { matched: false, start: 6, text: ".reload-" },
      { matched: true, start: 14, text: "options" },
    ]);
  });

  it.each(["", "not-present"])(
    "returns one unmatched segment for query %j",
    (query) => {
      expect(consoleSuggestionSegments("AddUser", query)).toEqual([
        { matched: false, start: 0, text: "AddUser" },
      ]);
    },
  );
});
