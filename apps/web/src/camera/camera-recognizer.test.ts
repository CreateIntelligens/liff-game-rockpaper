import { describe, expect, it } from "vitest";
import { createCameraConstraints, normalizeCameraError } from "./camera-recognizer";

describe("camera constraints", () => {
  it("defaults to the rear-facing camera for mobile play", () => {
    expect(createCameraConstraints()).toMatchObject({
      video: { facingMode: { ideal: "environment" } },
      audio: false,
    });
  });

  it("can explicitly request the front-facing camera", () => {
    expect(createCameraConstraints("user").video).toMatchObject({ facingMode: { ideal: "user" } });
  });
});

describe("camera error classification", () => {
  it.each([
    ["NotAllowedError", "CAMERA_PERMISSION_DENIED"],
    ["NotFoundError", "CAMERA_MISSING"],
    ["NotReadableError", "CAMERA_BUSY"],
  ])("maps %s to %s", (name, code) => {
    expect(normalizeCameraError(new DOMException("camera error", name)).message).toBe(code);
  });

  it("keeps unexpected camera errors classified as access failures", () => {
    expect(normalizeCameraError(new Error("unexpected")).message).toBe("unexpected");
  });
});
