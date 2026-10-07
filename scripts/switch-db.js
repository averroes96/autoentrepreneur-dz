#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const target = process.argv[2]?.toLowerCase();
const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma");
const postgresSchemaPath = path.join(__dirname, "..", "prisma", "schema.postgresql.prisma");

if (!target || !["postgres", "postgresql", "sqlite"].includes(target)) {
  console.log("Usage: node scripts/switch-db.js [postgres|sqlite]");
  process.exit(1);
}

let content = fs.readFileSync(schemaPath, "utf8");

if (target === "postgres" || target === "postgresql") {
  console.log("Switching Prisma schema to PostgreSQL (Supabase)...");
  if (fs.existsSync(postgresSchemaPath)) {
    fs.copyFileSync(postgresSchemaPath, schemaPath);
  } else {
    content = content.replace(
      /datasource db \{[\s\S]*?\}/,
      `datasource db {\n  provider  = "postgresql"\n  url       = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")\n}`
    );
    fs.writeFileSync(schemaPath, content, "utf8");
  }
} else {
  console.log("Switching Prisma schema to SQLite (Local Dev)...");
  content = content.replace(
    /datasource db \{[\s\S]*?\}/,
    `datasource db {\n  provider = "sqlite"\n  url      = env("DATABASE_URL")\n}`
  );
  fs.writeFileSync(schemaPath, content, "utf8");
}

console.log("Regenerating Prisma client...");
execSync("npx prisma generate", { stdio: "inherit" });
console.log("✓ Prisma schema successfully configured for " + target);
