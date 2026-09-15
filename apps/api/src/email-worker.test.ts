import { describe, expect, it, vi } from "vitest";
import type { EmailDeliveryStore, Mailer } from "@rockpaper/ports";
import { processEmailOutbox } from "./email-worker.js";

describe("email outbox worker", () => {
  it("marks successful sends and retries provider failures", async () => {
    const store = {
      listQueued: vi.fn().mockResolvedValue([
        { id: "delivery-1", gameId: "game-1", memberId: "member", recipient: "a@example.com", status: "queued", retryCount: 0, subject: "Result", html: "<p>Win</p>" },
        { id: "delivery-2", gameId: "game-2", memberId: "member", recipient: "b@example.com", status: "queued", retryCount: 0, subject: "Result", html: "<p>Lose</p>" },
      ]),
      markSent: vi.fn(),
      markRetry: vi.fn(),
    } as unknown as EmailDeliveryStore;
    const mailer = { send: vi.fn<Mailer["send"]>().mockResolvedValueOnce({ providerMessageId: "email-1" }).mockRejectedValueOnce(new Error("timeout")) } as Mailer;

    await expect(processEmailOutbox(store, mailer)).resolves.toBe(2);
    expect(store.markSent).toHaveBeenCalledWith("delivery-1", "email-1");
    expect(store.markRetry).toHaveBeenCalledWith("delivery-2", "timeout", 5);
  });
});
