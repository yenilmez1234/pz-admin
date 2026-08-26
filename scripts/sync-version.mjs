import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const versionPath = fileURLToPath(new URL("../VERSION", import.meta.url));
const configPath = fileURLToPath(
  new URL("../build/config.yml", import.meta.url),
);
const requestedVersion = process.argv[2];

if (requestedVersion !== undefined) {
  validateVersion(requestedVersion);
  await writeFile(versionPath, `${requestedVersion}\n`);
}

const version = (await readFile(versionPath, "utf8")).trim();
validateVersion(version);

const config = await readFile(configPath, "utf8");
const lines = config.split("\n");
let inInfo = false;
let updated = false;

for (let index = 0; index < lines.length; index += 1) {
  const line = lines[index];

  if (/^info:\s*$/.test(line)) {
    inInfo = true;
    continue;
  }

  if (inInfo && /^\S/.test(line)) break;
  if (!inInfo || !/^  version:/.test(line)) continue;

  lines[index] = line.replace(
    /^(  version:\s*)(?:"[^"]*"|'[^']*'|\S+)/,
    `$1"${version}"`,
  );
  updated = true;
  break;
}

if (!updated) {
  throw new Error(`Could not find info.version in ${configPath}`);
}

await writeFile(configPath, lines.join("\n"));

function validateVersion(value) {
  if (!/^\d+\.\d+\.\d+$/.test(value)) {
    throw new Error(`Invalid application version: ${JSON.stringify(value)}`);
  }
}
