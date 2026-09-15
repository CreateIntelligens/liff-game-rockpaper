import type { Mailer, MailMessage } from "@rockpaper/ports";
import { z } from "zod";

const resendResponseSchema = z.object({ id: z.string().min(1) });

export class ResendMailer implements Mailer {
  constructor(private readonly apiKey: string, private readonly from: string, private readonly fetcher: typeof fetch = fetch) {}

  async send(message: MailMessage): Promise<{ providerMessageId: string }> {
    const response = await this.fetcher("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        "content-type": "application/json",
        "Idempotency-Key": message.idempotencyKey,
      },
      body: JSON.stringify({ from: this.from, to: [message.to], subject: message.subject, html: message.html }),
    });
    if (!response.ok) throw new Error(`RESEND_HTTP_${response.status}`);
    return { providerMessageId: resendResponseSchema.parse(await response.json()).id };
  }
}
