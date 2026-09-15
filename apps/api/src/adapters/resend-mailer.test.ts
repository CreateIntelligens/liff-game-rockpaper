import { describe, expect, it, vi } from "vitest";
import { ResendMailer } from "./resend-mailer.js";

describe("ResendMailer", () => {
  it("sends with an idempotency key and validates the provider response", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ id: "email-1" }), { status: 200 }));
    const mailer = new ResendMailer("re_secret", "Game <game@example.com>", fetcher);
    await expect(mailer.send({ idempotencyKey: "game-1", to: "member@example.com", subject: "Result", html: "<p>Win</p>" })).resolves.toEqual({ providerMessageId: "email-1" });
    expect(fetcher.mock.calls[0]?.[1]?.headers).toMatchObject({ "Idempotency-Key": "game-1" });
  });
});
