import { describe, expect, it } from "vitest";
import { createSqliteDatabase } from "./sqlite.js";
import { createSqliteReferralStore } from "./referral-store.js";

describe("SQLite referral store", () => {
  it("requires opt-in and grants one capped energy reward", async () => {
    const database = createSqliteDatabase(":memory:");
    const store = createSqliteReferralStore(database);
    const now = new Date().toISOString();
    const insert = database.raw.prepare("INSERT INTO members (id, line_user_id, created_at) VALUES (?, ?, ?)");
    insert.run("inviter", "line-inviter", now);
    insert.run("invited", "line-invited", now);
    insert.run("invited-2", "line-invited-2", now);
    database.raw
      .prepare("INSERT INTO energy_events (id, member_id, delta, reason, reference_id, created_at) VALUES (?, ?, ?, 'initial', 'campaign', ?)")
      .run("initial", "inviter", 2, now);

    await expect(
      store.completeReferral({
        inviterMemberId: "inviter",
        invitedMemberId: "invited",
        attributionSource: "A",
        isEligibleNewFriend: true,
        energyReward: 1,
        energyCap: 3,
      }),
    ).resolves.toMatchObject({ status: "rejected", rejectionReason: "INVITER_NOT_OPTED_IN" });

    await store.optIn("inviter", "v1");
    const token = await store.createInviteLink("inviter");
    expect(await store.createInviteLink("inviter")).toBe(token);
    expect(await store.recordAttribution(token, "invited")).toBe(true);
    await expect(
      store.completeReferral({
        inviterMemberId: "inviter",
        invitedMemberId: "invited-2",
        attributionSource: "A",
        isEligibleNewFriend: true,
        energyReward: 1,
        energyCap: 3,
      }),
    ).resolves.toMatchObject({ status: "valid", rewardGranted: 1 });

    await expect(
      store.completeReferral({
        inviterMemberId: "inviter",
        invitedMemberId: "invited-2",
        attributionSource: "A",
        isEligibleNewFriend: true,
        energyReward: 1,
        energyCap: 3,
      }),
    ).resolves.toMatchObject({ status: "valid", rewardGranted: 0 });

    database.raw.close();
  });
});
