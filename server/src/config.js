import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jarvisRoot = path.resolve(__dirname, "..", "..");

export async function loadJsonConfig(relativePath) {
  const fullPath = path.join(jarvisRoot, relativePath);
  const content = await fs.readFile(fullPath, "utf-8");
  return JSON.parse(content);
}

export async function loadPrompt(relativePath) {
  const fullPath = path.join(jarvisRoot, relativePath);
  return fs.readFile(fullPath, "utf-8");
}
