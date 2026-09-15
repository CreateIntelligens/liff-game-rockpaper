import type { CampaignRule } from "@rockpaper/core";
import type { AssetManifest } from "@rockpaper/config";

export const defaultCampaignRule: CampaignRule = {
  id: "v1",
  initialEnergy: 3,
  energyCap: 3,
  energyCost: 1,
  referralEnergyReward: 1,
  fallbackEnabled: true,
  fallbackModes: ["manual", "random"],
  timezone: "Asia/Taipei",
  invitationLeaderboardEnabled: true,
  winLeaderboardEnabled: true,
};

export const defaultAssetManifest: AssetManifest = {
  version: "assets-v1",
  frame: {
    canvasWidth: 1080,
    canvasHeight: 1080,
    safeArea: { top: 80, right: 80, bottom: 80, left: 80 },
    borderAsset: "/assets/campaign/v1/frame.svg",
    formats: ["png", "webp"],
    transparent: true,
    crop: "contain",
  },
  gestureModel: {
    name: "mediapipe-gesture-recognizer",
    version: "v1",
    path: "/models/gesture_recognizer.task",
  },
  decorativeAsset: "/assets/campaign/v1/gesture-collage.png",
};
