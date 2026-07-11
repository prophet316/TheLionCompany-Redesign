import "server-only";
import type { FormEndpoint, SafeFormErrorCode } from "./contracts";

export type SafeFormLog = {
  requestId: string;
  endpoint: FormEndpoint;
  status: number;
  durationMs: number;
  errorClass?: SafeFormErrorCode;
};

export interface SafeFormLogger {
  log(record: SafeFormLog): void;
  countPrayerAccepted(utcDay: string): void;
}

export const safeFormLogger: SafeFormLogger = {
  log(record) {
    console.info(JSON.stringify({ event: "form_request", ...record }));
  },
  countPrayerAccepted(utcDay) {
    console.info(JSON.stringify({ event: "prayer_accepted", endpoint: "prayer", utcDay, acceptedCount: 1 }));
  },
};
