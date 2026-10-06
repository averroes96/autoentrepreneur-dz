const fs = require("fs");
const path = require("path");

function walk(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) walk(full, results);
    else if (full.endsWith(".js")) results.push(full);
  }
  return results;
}

const targetDir = path.join(__dirname, "..", "node_modules", "next", "dist", "compiled");
if (!fs.existsSync(targetDir)) {
  process.exit(0);
}

const files = walk(targetDir);
let count = 0;

for (const f of files) {
  let content = fs.readFileSync(f, "utf8");
  let modified = false;

  // 1. Guard against undefined debugInfo in initializeDebugInfo
  if (content.includes("function initializeDebugInfo(response, debugInfo) {\n      void 0 !== debugInfo.stack")) {
    content = content.replace(
      "function initializeDebugInfo(response, debugInfo) {\n      void 0 !== debugInfo.stack",
      "function initializeDebugInfo(response, debugInfo) {\n      if (!debugInfo || typeof debugInfo !== \"object\") return debugInfo;\n      void 0 !== debugInfo.stack"
    );
    modified = true;
  }

  // 2. Guard against non-array or undefined frame in buildFakeCallStack
  if (content.includes("var frame = stack[i],\n          frameKey =\n            frame.join(\"-\")")) {
    content = content.replace(
      "var frame = stack[i],\n          frameKey =\n            frame.join(\"-\")",
      "var frame = stack[i];\n        if (!frame || typeof frame.join !== \"function\") continue;\n        var frameKey =\n            frame.join(\"-\")"
    );
    modified = true;
  }

  // 3. Guard against chunk.reason without enqueueModel
  if (content.includes("if (\"pending\" !== chunk.status && \"pending_weak\" !== chunk.status)\n        chunk.reason.enqueueModel(value);")) {
    content = content.replace(
      "if (\"pending\" !== chunk.status && \"pending_weak\" !== chunk.status)\n        chunk.reason.enqueueModel(value);",
      "if (\"pending\" !== chunk.status && \"pending_weak\" !== chunk.status) {\n        if (chunk.reason && typeof chunk.reason.enqueueModel === \"function\") chunk.reason.enqueueModel(value);\n      }"
    );
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(f, content, "utf8");
    count++;
  }
}

if (count > 0) {
  console.log(`[patch-next] Successfully patched ${count} Next.js compiled runtime files.`);
}
