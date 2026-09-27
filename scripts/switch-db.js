// Switches prisma/schema.prisma between the SQLite (zero-config local, default)
// and PostgreSQL (production) twins so one codebase runs anywhere.
//
//   node scripts/switch-db.js sqlite     # default: file:./dev.db, no server needed
//   node scripts/switch-db.js postgres   # uses DATABASE_URL from .env
//
// After switching, run:  npx prisma generate && npx prisma db push
const fs = require("fs");
const path = require("path");

const dialect = (process.argv[2] || "sqlite").toLowerCase();
const dir = path.join(__dirname, "..", "prisma");
const target = path.join(dir, "schema.prisma");
const twins = {
  sqlite: path.join(dir, "schema.sqlite.prisma"),
  postgres: path.join(dir, "schema.postgres.prisma"),
};

const twin = twins[dialect];
if (!twin) {
  console.error("usage: node scripts/switch-db.js [sqlite|postgres]");
  process.exit(1);
}
if (!fs.existsSync(twin)) {
  console.error(`missing twin schema: ${path.relative(process.cwd(), twin)}`);
  process.exit(1);
}

fs.copyFileSync(twin, target);
console.log(`schema.prisma -> ${dialect}`);
if (dialect === "postgres") {
  console.log("next: npx prisma generate && npx prisma db push   (needs DATABASE_URL)");
} else {
  console.log("next: npx prisma generate && npx prisma db push   (creates prisma/dev.db)");
}
