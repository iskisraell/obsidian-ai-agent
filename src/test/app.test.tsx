import "@testing-library/jest-dom/vitest"

import type { SettingsPayload } from "@/lib/tauri-contracts"

describe("App", () => {
  it("supports strict write mode settings contract", () => {
    const payload: SettingsPayload = {
      vault_path: "",
      obsidian_cli_path: "obsidian",
      gemini_model: "gemini-2.5-flash",
      write_mode: "cli_fallback",
    }

    expect(payload.write_mode).toBe("cli_fallback")
  })
})
