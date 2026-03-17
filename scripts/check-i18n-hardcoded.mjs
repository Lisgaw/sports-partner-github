#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcRoot = path.join(root, "src");
const exts = new Set([".ts", ".tsx"]);

const allowedTurkishLiteralFiles = new Set([
  path.join(srcRoot, "lib", "localized-ui.ts"),
  path.join(srcRoot, "lib", "sport-catalog.ts"),
]);

const allowedReactHotToastImports = new Set([
  path.join(srcRoot, "components", "Providers.tsx"),
  path.join(srcRoot, "lib", "toast.ts"),
]);

function walk(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
      continue;
    }
    if (exts.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

function relative(filePath) {
  return path.relative(root, filePath).replace(/\\/g, "/");
}

function findLines(text, regex) {
  const lines = text.split(/\r?\n/);
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    if (regex.test(lines[i])) {
      hits.push({ line: i + 1, text: lines[i].trim() });
    }
  }
  return hits;
}

const files = walk(srcRoot);
const issues = [];

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");

  if (!allowedReactHotToastImports.has(file) && content.includes('from "react-hot-toast"')) {
    const hits = findLines(content, /from\s+"react-hot-toast"/);
    for (const hit of hits) {
      issues.push({
        type: "react-hot-toast-import",
        file,
        line: hit.line,
        text: hit.text,
      });
    }
  }

  if (allowedTurkishLiteralFiles.has(file)) {
    continue;
  }

  // Rough signal for hardcoded Turkish literals in source code.
  const literalHits = findLines(content, /["'`][^"'`]*[çğıöşüÇĞİÖŞÜ][^"'`]*["'`]/);
  for (const hit of literalHits) {
    issues.push({
      type: "turkish-literal",
      file,
      line: hit.line,
      text: hit.text,
    });
  }
}

if (issues.length === 0) {
  console.log("i18n-check:ok");
  process.exit(0);
}

console.error(`i18n-check:failed (${issues.length} issue)`);
for (const issue of issues.slice(0, 200)) {
  console.error(`${issue.type}: ${relative(issue.file)}:${issue.line} -> ${issue.text}`);
}

process.exit(1);
