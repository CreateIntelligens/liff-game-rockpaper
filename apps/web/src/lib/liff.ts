import liff from "@line/liff";
import type { PublicConfig } from "@rockpaper/config";
import { authenticateWithLine } from "./api";

export async function initializeLiff(config: PublicConfig): Promise<"disabled" | "preview" | "authenticated"> {
  if (!config.liffEnabled) return "disabled";
  if (!config.liffId) throw new Error("LIFF_ID_REQUIRED");

  await liff.init({ liffId: config.liffId, withLoginOnExternalBrowser: true });
  if (!liff.isLoggedIn()) {
    liff.login();
    return "preview";
  }

  const idToken = liff.getIDToken();
  if (!idToken) throw new Error("LINE_ID_TOKEN_MISSING");
  await authenticateWithLine(idToken);
  return "authenticated";
}
