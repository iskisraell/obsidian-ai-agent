import path from "node:path"
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import tsconfigPaths from "vite-tsconfig-paths"

const projectRoot = path.resolve(import.meta.dirname)
const compatibilityRoot = path.join(
  process.env.USERPROFILE ?? "C:/Users/israel.toledo",
  "Documents",
  "Desenvolvimento",
  "Local Projects",
  "obsidian-web"
)

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  resolve: {
    alias: {
      "@": path.resolve(projectRoot, "src"),
    },
  },
  server: {
    fs: {
      allow: [projectRoot, compatibilityRoot],
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
})
