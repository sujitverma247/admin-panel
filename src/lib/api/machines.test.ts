import { describe, expect, it } from "vitest"
import {
  machineStatus,
  machineStatusLabel,
  machineTone,
  machinesQuery,
} from "@/lib/api/machines"

describe("machines query", () => {
  it("sends allowed page sizes and skips empty filters", () => {
    expect(machinesQuery()).toBe("/admin/machines?page=1&limit=10")
    expect(
      machinesQuery({
        page: 2,
        limit: 50,
        q: " desk ",
        status: "online",
        productId: 4,
        from: "2026-01-01",
        sort: "machine",
        dir: "asc",
      }),
    ).toBe(
      "/admin/machines?page=2&limit=50&q=desk&status=online&productId=4&from=2026-01-01&sort=machine&dir=asc",
    )
    expect(machinesQuery({ limit: 15, status: "all", q: "  ", productId: 0 })).toBe(
      "/admin/machines?page=1&limit=10",
    )
  })
})

describe("machine status", () => {
  it("maps seated/online into labels and tones", () => {
    expect(machineStatus({ seated: true, online: true })).toBe("online")
    expect(machineStatus({ seated: true, online: false })).toBe("offline")
    expect(machineStatus({ seated: false, online: false })).toBe("released")
    expect(machineStatusLabel("online")).toBe("Online")
    expect(machineStatusLabel("released")).toBe("Released")
    expect(machineTone("online")).toBe("success")
    expect(machineTone("offline")).toBe("warning")
    expect(machineTone("released")).toBe("muted")
  })
})
