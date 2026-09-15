import type { AuthVerifier, MemberIdentity } from "@rockpaper/ports";
import { z } from "zod";

const lineTokenResponseSchema = z.object({
  iss: z.literal("https://access.line.me"),
  sub: z.string().min(1),
  aud: z.string().min(1),
  exp: z.number().int(),
  name: z.string().optional(),
  picture: z.string().url().optional(),
  email: z.string().email().optional(),
});

export class LineIdTokenVerifier implements AuthVerifier {
  constructor(
    private readonly channelId: string,
    private readonly fetcher: typeof fetch = fetch,
    private readonly clock: () => number = () => Math.floor(Date.now() / 1000),
  ) {}

  async verifyToken(token: string): Promise<MemberIdentity> {
    if (!token) throw new Error("LINE_ID_TOKEN_REQUIRED");

    const response = await this.fetcher("https://api.line.me/oauth2/v2.1/verify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ id_token: token, client_id: this.channelId }),
    });
    if (!response.ok) throw new Error("LINE_ID_TOKEN_INVALID");

    const payload = lineTokenResponseSchema.parse(await response.json());
    if (payload.aud !== this.channelId || payload.exp <= this.clock()) {
      throw new Error("LINE_ID_TOKEN_INVALID");
    }

    return {
      memberId: payload.sub,
      lineUserId: payload.sub,
      email: payload.email,
      displayName: payload.name,
    };
  }
}
