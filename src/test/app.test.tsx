import "@testing-library/jest-dom/vitest"

import { defaultSettings, mediaAssets } from "@/lib/mock-data"

describe("App", () => {
  it("provides default local-first settings and media fixtures", () => {
    expect(defaultSettings.writeMode).toBe("cli_fallback")
    expect(mediaAssets.length).toBeGreaterThan(0)
    expect(mediaAssets[0]?.type).toBe("audio")
  })
})
