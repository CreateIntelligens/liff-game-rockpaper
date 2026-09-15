import type { EmailDeliveryStore, Mailer } from "@rockpaper/ports";

export async function processEmailOutbox(store: EmailDeliveryStore, mailer: Mailer, maxRetries = 5): Promise<number> {
  const messages = await store.listQueued(20);
  for (const message of messages) {
    try {
      const sent = await mailer.send({
        idempotencyKey: message.gameId,
        to: message.recipient!,
        subject: message.subject,
        html: message.html,
      });
      await store.markSent(message.id, sent.providerMessageId);
    } catch (error) {
      await store.markRetry(message.id, error instanceof Error ? error.message : "EMAIL_SEND_FAILED", maxRetries);
    }
  }
  return messages.length;
}
