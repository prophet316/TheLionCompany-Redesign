import { describe, expect, it } from "vitest";
import { isContactReason, isDeliveryMode, isSafeFormErrorCode } from "../../../lib/forms/client-contracts";

describe("lightweight browser form contracts", () => {
  it("accepts only the server contract enum values", () => {
    expect(isDeliveryMode("no-send")).toBe(true);
    expect(isDeliveryMode("production")).toBe(false);
    expect(isContactReason("partnership")).toBe(true);
    expect(isContactReason("other")).toBe(false);
    expect(isSafeFormErrorCode("provider_unavailable")).toBe(true);
    expect(isSafeFormErrorCode("raw_provider_error")).toBe(false);
  });
});
