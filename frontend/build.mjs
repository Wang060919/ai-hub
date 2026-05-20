import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const projectRoot = resolve(__dirname, "..");
const publicDir = join(projectRoot, "frontend", "public");
const distDir = join(projectRoot, "frontend", "dist");

if (!existsSync(publicDir)) {
  throw new Error("frontend/public does not exist");
}

rmSync(distDir, { force: true, recursive: true });
mkdirSync(distDir, { recursive: true });
cpSync(publicDir, distDir, { recursive: true });

console.log("Frontend build completed: frontend/dist");
