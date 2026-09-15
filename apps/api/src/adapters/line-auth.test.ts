import { describe, expect, it, vi } from "vitest";
import { LineIdTokenVerifier } from "./line-auth.js";

describe("LineIdTokenVerifier", () => {
  it("verifies the token audience and returns the LINE subject", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          iss: "https://access.line.me",
          sub: "U123",
          aud: "channel-1",
          exp: 2_000_000_000,
          email: "member@example.com",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    const verifier = new LineIdTokenVerifier("channel-1", fetcher, () => 1_900_000_000);

    await expect(verifier.verifyToken("id-token")).resolves.toMatchObject({
      memberId: "U123",
      lineUserId: "U123",
      email: "member@example.com",
    });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("rejects an expired token", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({ iss: "https://access.line.me", sub: "U123", aud: "channel-1", exp: 10 }),
        { status: 200 },
      ),
    );
    const verifier = new LineIdTokenVerifier("channel-1", fetcher, () => 11);

    await expect(verifier.verifyToken("expired")).rejects.toThrow("LINE_ID_TOKEN_INVALID");
  });
});
