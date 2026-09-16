import liff from "@line/liff";
import type { PublicConfig } from "@rockpaper/config";
import { authenticateWithLine } from "./api";

export function isLineBrowserUserAgent(userAgent: string): boolean {
  return /\bLine\/\d/i.test(userAgent);
}

export function isLineEmbeddedBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  if (isLineBrowserUserAgent(navigator.userAgent)) return true;
  try {
    return liff.isInClient();
  } catch {
    return false;
  }
}

export function openExternalBrowser(url: string, useLiffWindow: boolean): void {
  if (useLiffWindow) {
    try {
      liff.openWindow({ url, external: true });
      return;
    } catch {
      // Fall through to the browser primitive if the LIFF bridge is unavailable.
    }
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

export interface LiffInitialization {
  state: "disabled" | "preview" | "authenticated";
  requiresExternalBrowser: boolean;
}

export async function initializeLiff(config: PublicConfig): Promise<LiffInitialization> {
  if (!config.liffEnabled) return { state: "disabled", requiresExternalBrowser: isLineEmbeddedBrowser() };
  if (!config.liffId) throw new Error("LIFF_ID_REQUIRED");

  await liff.init({ liffId: config.liffId, withLoginOnExternalBrowser: true });
  const requiresExternalBrowser = isLineEmbeddedBrowser();
  if (!liff.isLoggedIn()) {
    liff.login();
    return { state: "preview", requiresExternalBrowser };
  }

  const idToken = liff.getIDToken();
  if (!idToken) throw new Error("LINE_ID_TOKEN_MISSING");
  await authenticateWithLine(idToken);
  return { state: "authenticated", requiresExternalBrowser };
}
