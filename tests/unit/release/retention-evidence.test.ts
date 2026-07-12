import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { validateRetentionEvidence } from "../../../scripts/lib/retention-evidence.mjs";

function sha(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function fixture() {
  const directory = mkdtempSync(join(tmpdir(), "tlc-retention-"));
  writeFileSync(join(directory, "mailbox-rule.txt"), "restricted screenshot sha fixture");
  return {
    directory,
    record: {
      schemaVersion: 1,
      completedAt: "2026-07-11T12:00:00.000Z",
      ownerRoles: { dataStewardConfirmed: true, mailboxAdministratorConfirmed: true, mfaConfirmed: true },
      mailbox: {
        prayerDeletionDays: 90,
        activeFollowUpReviewDays: 30,
        activeFollowUpMaxMonths: 12,
        activeFollowUpCloseDeletionDays: 30,
        contactDeletionMonthsAfterResolution: 12,
        unresolvedContactQuarterlyReview: true,
        autoForwardingDisabled: true,
        localArchivesDisabled: true,
      },
      brevo: { pendingDoiPurgeDays: 30, transactionalLogRetentionDays: 30, messagePreviewsDisabled: true, unsubscribeSuppressionEnabled: true },
      redis: { processingLockSeconds: 300, acceptedTtlSeconds: 86400, backupsDisabled: true, exportsDisabled: true, tlsRequired: true },
      syntheticDeletion: {
        prayerProviderIdSha256: sha("prayer-provider-id"),
        contactProviderIdSha256: sha("contact-provider-id"),
        completedAt: "2026-07-11T12:30:00.000Z",
        outcome: "deleted",
      },
      evidenceFiles: [{ path: "mailbox-rule.txt", sha256: sha("restricted screenshot sha fixture") }],
    },
  };
}

describe("retention evidence", () => {
  it("accepts the exact policy constants and attachment hashes", async () => {
    const value = fixture();
    await expect(validateRetentionEvidence(value.record, value.directory)).resolves.toMatchObject({ status: "pass" });
  });

  it("rejects weaker retention, missing ownership, raw identifiers, and changed evidence", async () => {
    const value = fixture();
    await expect(validateRetentionEvidence({ ...value.record, mailbox: { ...value.record.mailbox, prayerDeletionDays: 120 } }, value.directory)).rejects.toThrow();
    await expect(validateRetentionEvidence({ ...value.record, ownerRoles: { ...value.record.ownerRoles, mfaConfirmed: false } }, value.directory)).rejects.toThrow();
    await expect(validateRetentionEvidence({ ...value.record, syntheticDeletion: { ...value.record.syntheticDeletion, prayerProviderIdSha256: "raw-provider-id" } }, value.directory)).rejects.toThrow();
    await expect(validateRetentionEvidence({ ...value.record, evidenceFiles: [{ ...value.record.evidenceFiles[0], path: "../mailbox-rule.txt" }] }, value.directory)).rejects.toThrow(/escapes base directory/);
    writeFileSync(join(value.directory, "mailbox-rule.txt"), "changed");
    await expect(validateRetentionEvidence(value.record, value.directory)).rejects.toThrow(/hash mismatch/);
  });
});
