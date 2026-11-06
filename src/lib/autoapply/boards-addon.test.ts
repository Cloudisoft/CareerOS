import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const db = vi.hoisted(() => ({ stored: { boardsAddon: false, boardsAddonAckAt: null as Date | null } }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    autoApplySettings: {
      findUnique: async () => db.stored,
      update: async ({ data }: { data: Record<string, unknown> }) => ({ boardsAddon: data.boardsAddon, boardsAddonAckAt: data.boardsAddonAckAt ?? null }),
    },
  },
}));
vi.mock("@/lib/company/service", () => ({ findOrCreateExternalCompany: vi.fn() }));
import { boardsAddonAllowed, effectiveBoardSettings, setBoardsAddon } from "./service";

describe("LinkedIn & Indeed add-on", () => {
  it("comes with paid plans only", () => {
    expect(boardsAddonAllowed({ planKey: "BASIC" })).toBe(true);
    expect(boardsAddonAllowed({ planKey: "FREE" })).toBe(false);
    expect(boardsAddonAllowed({ planKey: null })).toBe(false);
  });

  it("needs the warning acknowledged the first time it's turned on, then remembers it", async () => {
    db.stored = { boardsAddon: false, boardsAddonAckAt: null };
    await expect(setBoardsAddon("p1", { enabled: true }, { planKey: "BASIC" })).rejects.toThrow(/warning/);
    const on = await setBoardsAddon("p1", { enabled: true, acknowledge: true }, { planKey: "BASIC" });
    expect(on.boardsAddon).toBe(true);
    expect(on.boardsAddonAckAt).toBeInstanceOf(Date);
    db.stored = { boardsAddon: false, boardsAddonAckAt: new Date() };
    await expect(setBoardsAddon("p1", { enabled: true }, { planKey: "BASIC" })).resolves.toMatchObject({ boardsAddon: true });
    await expect(setBoardsAddon("p1", { enabled: true, acknowledge: true }, { planKey: "FREE" })).rejects.toThrow(/paid plan/);
  });

  it("tells the extension to apply on LinkedIn and Indeed only while it's on and allowed", () => {
    const ack = new Date();
    expect(effectiveBoardSettings({ boardsAddon: true, boardsAddonAckAt: ack, platformModes: { greenhouse: "assist" } }, { planKey: "PREMIUM" }))
      .toEqual({ boardsAddon: true, platformModes: { greenhouse: "assist", linkedin: "auto", indeed: "auto" } });
    expect(effectiveBoardSettings({ boardsAddon: true, boardsAddonAckAt: ack, platformModes: {} }, { planKey: "FREE" }))
      .toEqual({ boardsAddon: false, platformModes: {} });
    expect(effectiveBoardSettings({ boardsAddon: true, boardsAddonAckAt: null, platformModes: {} }, { planKey: "BASIC" }).boardsAddon).toBe(false);
  });
});
