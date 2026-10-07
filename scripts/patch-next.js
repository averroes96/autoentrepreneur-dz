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

  // 4. Guard against sparse debugInfo[i] in react-dom createChildReconciler (stack property)
  if (content.includes("if (\"string\" === typeof debugInfo[i].stack)")) {
    content = content.replaceAll(
      "if (\"string\" === typeof debugInfo[i].stack)",
      "if (debugInfo[i] && \"string\" === typeof debugInfo[i].stack)"
    );
    modified = true;
  }

  // 5. Guard against sparse debugInfo[i] in react-dom getCurrentDebugTask
  if (content.includes("if (null != debugInfo[i].name)")) {
    content = content.replaceAll(
      "if (null != debugInfo[i].name)",
      "if (debugInfo[i] && null != debugInfo[i].name)"
    );
    modified = true;
  }

  // 6. Guard against sparse debugInfo[i] in react-dom serverComponentName
  if (content.includes("var serverComponentName = debugInfo[i].name;")) {
    content = content.replaceAll(
      "var serverComponentName = debugInfo[i].name;",
      "var serverComponentName = debugInfo[i] ? debugInfo[i].name : \"\";"
    );
    modified = true;
  }

  // 7. Guard against sparse debugInfo[i] in react-dom formatOwnerStack
  if (content.includes("var entry = debugInfo[i];\n              if (\"string\" === typeof entry.name)")) {
    content = content.replaceAll(
      "var entry = debugInfo[i];\n              if (\"string\" === typeof entry.name)",
      "var entry = debugInfo[i];\n              if (entry && \"string\" === typeof entry.name)"
    );
    modified = true;
  }

  // 8. Guard against sparse _info in flushComponentPerformance
  if (content.includes("if (\"number\" === typeof _info.time && _info.time > parentEndTime)")) {
    content = content.replaceAll(
      "if (\"number\" === typeof _info.time && _info.time > parentEndTime)",
      "if (_info && \"number\" === typeof _info.time && _info.time > parentEndTime)"
    );
    modified = true;
  }

  // 9. Guard against sparse info in flushComponentPerformance
  if (content.includes("var info = debugInfo[i];\n          \"number\" === typeof info.time")) {
    content = content.replaceAll(
      "var info = debugInfo[i];\n          \"number\" === typeof info.time",
      "var info = debugInfo[i];\n          if (!info) continue;\n          \"number\" === typeof info.time"
    );
    modified = true;
  }

  // 10. Guard against sparse _info2 in flushComponentPerformance
  if (content.includes("var _info2 = debugInfo[_i7];\n          if (\"number\" === typeof _info2.time)")) {
    content = content.replaceAll(
      "var _info2 = debugInfo[_i7];\n          if (\"number\" === typeof _info2.time)",
      "var _info2 = debugInfo[_i7];\n          if (_info2 && \"number\" === typeof _info2.time)"
    );
    modified = true;
  }

  // 11. Guard against sparse candidateInfo in flushComponentPerformance
  if (content.includes("var candidateInfo = debugInfo[j];\n                if (\"string\" === typeof candidateInfo.name)")) {
    content = content.replaceAll(
      "var candidateInfo = debugInfo[j];\n                if (\"string\" === typeof candidateInfo.name)",
      "var candidateInfo = debugInfo[j];\n                if (candidateInfo && \"string\" === typeof candidateInfo.name)"
    );
    modified = true;
  }

  // 12. Guard against sparse _candidateInfo in flushComponentPerformance
  if (content.includes("var _candidateInfo = debugInfo[_j];\n                if (\"string\" === typeof _candidateInfo.name)")) {
    content = content.replaceAll(
      "var _candidateInfo = debugInfo[_j];\n                if (\"string\" === typeof _candidateInfo.name)",
      "var _candidateInfo = debugInfo[_j];\n                if (_candidateInfo && \"string\" === typeof _candidateInfo.name)"
    );
    modified = true;
  }

  // 13. Guard flushInitialRenderPerformance against throwing unhandled errors into setTimeout
  if (content.includes("function flushInitialRenderPerformance(response) {\n      if (response._replayConsole) {")) {
    content = content.replaceAll(
      "flushInitialRenderPerformance(response) {\n      if (response._replayConsole) {\n        var rootChunk = getChunk(response, 0);\n        isArrayImpl(rootChunk._children) &&\n          (markAllTracksInOrder(),\n          flushComponentPerformance(\n            response,\n            rootChunk,\n            0,\n            -Infinity,\n            -Infinity\n          ));\n      }\n    }",
      "flushInitialRenderPerformance(response) {\n      try { if (response._replayConsole) {\n        var rootChunk = getChunk(response, 0);\n        isArrayImpl(rootChunk._children) &&\n          (markAllTracksInOrder(),\n          flushComponentPerformance(\n            response,\n            rootChunk,\n            0,\n            -Infinity,\n            -Infinity\n          ));\n      } } catch (e) {}\n    }"
    );
    modified = true;
  }

  // 14. Prevent fatal Error("Connection closed.") when RSC stream closes
  if (content.includes(": reportGlobalError(weakResponse, Error(\"Connection closed.\"));")) {
    content = content.replaceAll(
      "response._allowPartialStream\n          ? ((response._closed = !0),",
      "(response._allowPartialStream || true)\n          ? ((response._closed = !0),"
    );
    modified = true;
  }

  // 15. Guard against non-object or invalid ioInfo in initializeIOInfo
  if (content.includes("function initializeIOInfo(response, ioInfo) {\n      void 0 !== ioInfo.stack")) {
    content = content.replaceAll(
      "function initializeIOInfo(response, ioInfo) {\n      void 0 !== ioInfo.stack",
      "function initializeIOInfo(response, ioInfo) {\n      if (!ioInfo || typeof ioInfo !== \"object\" || typeof ioInfo.start !== \"number\") return;\n      void 0 !== ioInfo.stack"
    );
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(f, content, "utf8");
    count++;
  }
}

if (count > 0) {
  console.log(`[patch-next] Successfully patched ${count} Next.js / React compiled runtime files.`);
}
