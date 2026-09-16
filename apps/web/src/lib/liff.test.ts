import { describe, expect, it } from "vitest";
import { isLineBrowserUserAgent } from "./liff";

describe("LINE browser detection", () => {
  it("detects the LINE in-app browser user agent", () => {
    expect(isLineBrowserUserAgent("Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Line/14.20.0"))
      .toBe(true);
  });

  it("does not block Safari or Chrome outside LINE", () => {
    expect(isLineBrowserUserAgent("Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Version/18.0 Safari/604.1"))
      .toBe(false);
    expect(isLineBrowserUserAgent("Mozilla/5.0 (iPhone) CriOS/130.0 Mobile Safari/604.1"))
      .toBe(false);
  });
});
