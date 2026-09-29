import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const destination = resolve(process.argv[2] ?? "");
const withinRoot = relative(root, destination);
if (!process.argv[2] || (!withinRoot.startsWith(`..${sep}`) && withinRoot !== ".." && !isAbsolute(withinRoot))) {
  throw new Error("Pass a new destination directory outside this repository.");
}
if (existsSync(destination)) throw new Error(`Destination already exists: ${destination}`);

const rootFiles = new Set([
  ".easignore", ".env.example", ".gitignore", "AGENTS.md", "LICENSE", "README.md",
  "app.json", "eas.json", "eslint.config.js", "package-lock.json", "package.json", "tsconfig.json",
  "APP_STORE_MATERIALS.md", "ART_ASSETS_COMMUNITY.md", "ART_ASSETS_SEPTEMBER_8.md", "ART_DIRECTION.md",
  "DEMO_MODE.md", "RELEASE_READINESS.md", "SHIPATON_CHECKLIST.md",
]);
const directories = ["assets/", "docs/", "scripts/", "src/", "supabase/", "tests/"];
const privateName = /(^|\/)(?:\.env(?:\..*)?|google-services\.json|GoogleService-Info\.plist|credentials\.json|service-account\.json)$/i;
const privateExtension = /\.(?:jks|key|keystore|mobileprovision|p8|p12|pem)$/i;
const textExtension = /\.(?:cjs|css|example|js|json|jsx|md|mjs|sql|svg|toml|ts|tsx|txt)$/i;
const secretPattern = /-----BEGIN [^-]*PRIVATE KEY-----|\b(?:sk|appl|goog|test)_[A-Za-z0-9]{16,}\b|\bAKIA[0-9A-Z]{16}\b|\bghp_[A-Za-z0-9]{20,}\b|\b(?:EXPO_TOKEN|EAS_TOKEN|NPM_TOKEN|GITHUB_TOKEN)\s*[:=]\s*["']?[A-Za-z0-9._-]{12,}/;
const listed = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { cwd: root })
  .toString("utf8").split("\0").filter(Boolean);
const files = [...new Set(listed)].filter((name) => rootFiles.has(name) || directories.some((prefix) => name.startsWith(prefix))).sort();
for (const required of ["LICENSE", "README.md", "app.json", "package.json", "package-lock.json", "tsconfig.json"]) {
  if (!files.includes(required)) throw new Error(`Required source file is missing: ${required}`);
}

const manifest = [];
const contents = new Map();
for (const name of files) {
  if ((privateName.test(name) && name !== ".env.example") || privateExtension.test(name)) {
    throw new Error(`Private-looking file in source selection: ${name}`);
  }
  const source = resolve(root, name);
  const relativeSource = relative(root, source);
  if (relativeSource.startsWith(`..${sep}`) || isAbsolute(relativeSource)) throw new Error(`Unsafe path: ${name}`);
  const stat = lstatSync(source);
  if (!stat.isFile() || stat.size > 5_000_000) throw new Error(`Unexpected file type or size: ${name}`);
  const bytes = readFileSync(source);
  if (textExtension.test(name) && secretPattern.test(bytes.toString("utf8"))) throw new Error(`Possible secret in: ${name}`);
  contents.set(name, bytes);
  manifest.push({ path: name, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") });
}

mkdirSync(destination);
for (const file of manifest) {
  const target = resolve(destination, file.path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents.get(file.path));
}
writeFileSync(resolve(destination, "source-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Exported ${manifest.length} source files (${manifest.reduce((sum, file) => sum + file.bytes, 0)} bytes) to ${destination}`);
