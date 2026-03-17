import { ESLint } from "eslint";

const eslint = new ESLint();
const results = await eslint.lintFiles(["."]);

const warningByRule = new Map();
const warningByFile = new Map();

for (const result of results) {
  const fileWarnings = result.messages.filter((msg) => msg.severity === 1);
  if (fileWarnings.length === 0) continue;

  warningByFile.set(result.filePath, fileWarnings.length);

  for (const warning of fileWarnings) {
    const key = warning.ruleId || "(unknown-rule)";
    warningByRule.set(key, (warningByRule.get(key) || 0) + 1);
  }
}

const totalWarnings = [...warningByRule.values()].reduce((sum, count) => sum + count, 0);

console.log(`Total warnings: ${totalWarnings}`);
console.log("\nTop warning rules:");
[...warningByRule.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15)
  .forEach(([rule, count]) => {
    console.log(`- ${rule}: ${count}`);
  });

console.log("\nTop files by warning count:");
[...warningByFile.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15)
  .forEach(([file, count]) => {
    console.log(`- ${file}: ${count}`);
  });