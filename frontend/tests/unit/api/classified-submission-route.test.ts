import { describe, expect, it } from "vitest";
import { isSubmissionStillProcessing } from "@/lib/api/submission-recovery";

describe("classified submission route recovery", () => {
  it("treats a WordPress idempotency lock as a recoverable processing state", () => {
    const error = Object.assign(new Error("Cette demande est en cours de finalisation."), {
      status: 409,
      body: '{"code":"platform_submissions_request_in_progress"}',
    });

    expect(isSubmissionStillProcessing(error)).toBe(true);
  });

  it("does not hide unrelated WordPress errors as processing", () => {
    const error = Object.assign(new Error("Validation impossible."), {
      status: 422,
      body: '{"code":"platform_submissions_invalid_payload"}',
    });

    expect(isSubmissionStillProcessing(error)).toBe(false);
  });
});
