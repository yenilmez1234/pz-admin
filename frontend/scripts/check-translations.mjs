import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const i18nRoot = join(frontendRoot, "src", "i18n");
const resourcesRoot = join(i18nRoot, "resources");
const defaultLanguage = "en-US";
const localeNames = readJson(join(i18nRoot, "locales.json"));
const namespaceManifest = readJson(join(i18nRoot, "namespaces.json"));
const supportedLanguages = Object.keys(localeNames).sort();
const resourceLanguages = readdirSync(resourcesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
const errors = [];

validateLocaleRegistry();

compareSets(
  "locale registry and resource directories",
  supportedLanguages,
  resourceLanguages,
);

const defaultNamespaces = Object.keys(namespaceManifest).sort();
compareSets(
  "namespace manifest and default resources",
  defaultNamespaces,
  namespaceFiles(defaultLanguage),
);
const defaultResources = new Map(
  defaultNamespaces.map((namespace) => [
    namespace,
    flatten(
      readJson(resourceFile(defaultLanguage, namespace)),
      `${defaultLanguage}:${namespace}`,
    ),
  ]),
);

for (const language of supportedLanguages) {
  const namespaces = namespaceFiles(language);
  compareSets(`${language} namespaces`, defaultNamespaces, namespaces);

  for (const namespace of defaultNamespaces) {
    if (!namespaces.includes(namespace)) continue;

    const expected = defaultResources.get(namespace);
    const actual = flatten(
      readJson(resourceFile(language, namespace)),
      `${language}:${namespace}`,
    );
    compareSets(
      `${language}:${namespace} keys`,
      [...expected.keys()].sort(),
      [...actual.keys()].sort(),
    );

    for (const [key, expectedValue] of expected) {
      if (!actual.has(key)) continue;
      compareSets(
        `${language}:${namespace}.${key} interpolation variables`,
        interpolationVariables(expectedValue),
        interpolationVariables(actual.get(key)),
      );
    }
  }
}

if (errors.length > 0) {
  console.error(`Translation validation failed:\n- ${errors.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log(
    `Translation validation passed for ${supportedLanguages.length} locales and ${defaultNamespaces.length} namespaces.`,
  );
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function namespaceFiles(language) {
  const languageDirectory = join(resourcesRoot, language);
  if (!existsSync(languageDirectory)) return [];

  return readdirSync(languageDirectory)
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.slice(0, -5))
    .sort();
}

function resourceFile(language, namespace) {
  return join(resourcesRoot, language, `${namespace}.json`);
}

function flatten(value, context, prefix = "", entries = new Map()) {
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (child !== null && typeof child === "object" && !Array.isArray(child)) {
      flatten(child, context, path, entries);
    } else if (typeof child === "string") {
      entries.set(path, child);
    } else {
      const type = Array.isArray(child) ? "array" : String(child);
      errors.push(`${context}.${path}: expected a string, received ${type}`);
    }
  }
  return entries;
}

function validateLocaleRegistry() {
  for (const [language, nativeName] of Object.entries(localeNames)) {
    if (typeof nativeName !== "string" || nativeName.trim() === "") {
      errors.push(`${language}: native locale name must be a non-empty string`);
    }

    try {
      const canonical = Intl.getCanonicalLocales(language);
      if (canonical.length !== 1 || canonical[0] !== language) {
        errors.push(`${language}: use canonical BCP 47 code ${canonical[0]}`);
      }
    } catch {
      errors.push(`${language}: invalid BCP 47 locale code`);
    }
  }
}

function interpolationVariables(value) {
  const variables = new Set();
  const pattern = /{{\s*([^,}\s]+)(?:,[^}]*)?}}/g;
  for (const match of value.matchAll(pattern)) variables.add(match[1]);
  return [...variables].sort();
}

function compareSets(context, expected, actual) {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  const missing = expected.filter((value) => !actualSet.has(value));
  const extra = actual.filter((value) => !expectedSet.has(value));
  if (missing.length > 0)
    errors.push(`${context}: missing ${missing.join(", ")}`);
  if (extra.length > 0)
    errors.push(`${context}: unexpected ${extra.join(", ")}`);
}
