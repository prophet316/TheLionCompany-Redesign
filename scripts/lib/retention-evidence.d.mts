export type RetentionEvidence = {
  schemaVersion: 1;
  completedAt: string;
  ownerRoles: { dataStewardConfirmed: true; mailboxAdministratorConfirmed: true; mfaConfirmed: true };
  mailbox: {
    prayerDeletionDays: 90;
    activeFollowUpReviewDays: 30;
    activeFollowUpMaxMonths: 12;
    activeFollowUpCloseDeletionDays: 30;
    contactDeletionMonthsAfterResolution: 12;
    unresolvedContactQuarterlyReview: true;
    autoForwardingDisabled: true;
    localArchivesDisabled: true;
  };
  brevo: { pendingDoiPurgeDays: 30; transactionalLogRetentionDays: 30; messagePreviewsDisabled: true; unsubscribeSuppressionEnabled: true };
  redis: { processingLockSeconds: 300; acceptedTtlSeconds: 86400; backupsDisabled: true; exportsDisabled: true; tlsRequired: true };
  syntheticDeletion: { prayerProviderIdSha256: string; contactProviderIdSha256: string; completedAt: string; outcome: "deleted" };
  evidenceFiles: Array<{ path: string; sha256: string }>;
};
export function validateRetentionEvidence(record: unknown, baseDirectory: string): Promise<{ status: "pass"; evidenceFiles: number }>;
