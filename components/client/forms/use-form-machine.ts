"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  deliveryModeSchema,
  safeFormErrorCodeSchema,
  type FormEndpoint,
  type FormSubmitResult,
  type SafeFormErrorCode,
} from "../../../lib/forms/contracts";

type State =
  | { name: "editing" }
  | { name: "submitting" }
  | { name: "accepted"; result: Extract<FormSubmitResult, { ok: true }> }
  | { name: "error"; result: Extract<FormSubmitResult, { ok: false }> };

const networkError: Extract<FormSubmitResult, { ok: false }> = {
  ok: false,
  status: "error",
  code: "network_error",
  retryable: true,
  message: "The network request did not finish. Check your connection and try again.",
};

function parseResult(value: unknown, response: Response, submissionId: string): FormSubmitResult | null {
  if (!value || typeof value !== "object") return null;
  const result = value as Record<string, unknown>;
  if (result.ok === true) {
    if (
      response.status !== 202 ||
      result.status !== "accepted" ||
      result.submissionId !== submissionId ||
      typeof result.replayed !== "boolean" ||
      typeof result.message !== "string" ||
      !deliveryModeSchema.safeParse(result.deliveryMode).success
    ) return null;
    return result as Extract<FormSubmitResult, { ok: true }>;
  }
  if (
    response.ok ||
    result.ok !== false ||
    result.status !== "error" ||
    typeof result.retryable !== "boolean" ||
    typeof result.message !== "string" ||
    !safeFormErrorCodeSchema.safeParse(result.code).success
  ) return null;
  return result as Extract<FormSubmitResult, { ok: false }>;
}

export function useFormMachine(
  endpoint: FormEndpoint,
  callbacks: { onAccepted?: () => void; onError?: (code: SafeFormErrorCode) => void } = {},
) {
  const [submissionId, setSubmissionId] = useState(() => crypto.randomUUID());
  const [state, setState] = useState<State>({ name: "editing" });
  const [resetSignal, setResetSignal] = useState(0);
  const attempted = useRef(false);
  const inFlight = useRef(false);
  const responseVersion = useRef(0);
  const acceptedCallback = useRef(callbacks.onAccepted);
  const errorCallback = useRef(callbacks.onError);
  useEffect(() => {
    acceptedCallback.current = callbacks.onAccepted;
    errorCallback.current = callbacks.onError;
  }, [callbacks.onAccepted, callbacks.onError]);

  const markEdited = useCallback(() => {
    if (inFlight.current || !attempted.current) return;
    attempted.current = false;
    responseVersion.current += 1;
    setSubmissionId(crypto.randomUUID());
    setState({ name: "editing" });
    setResetSignal((value) => value + 1);
  }, []);

  const submit = useCallback(
    async (payload: Record<string, unknown>) => {
      if (inFlight.current || state.name === "submitting" || state.name === "accepted") return;
      inFlight.current = true;
      const version = ++responseVersion.current;
      attempted.current = true;
      setState({ name: "submitting" });
      try {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 10_000);
        let response: Response;
        try {
          response = await fetch(`/api/forms/${endpoint}`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ ...payload, submissionId }),
            signal: controller.signal,
          });
        } finally {
          window.clearTimeout(timeout);
        }
        const raw: unknown = await response.json();
        const value = parseResult(raw, response, submissionId);
        if (!value) throw new Error("invalid safe response");
        if (version !== responseVersion.current) return;
        if (value.ok) {
          setState({ name: "accepted", result: value });
          acceptedCallback.current?.();
          return;
        }
        setResetSignal((current) => current + 1);
        setState({ name: "error", result: value });
        errorCallback.current?.(value.code);
      } catch {
        if (version !== responseVersion.current) return;
        setResetSignal((current) => current + 1);
        setState({ name: "error", result: networkError });
        errorCallback.current?.(networkError.code);
      } finally {
        if (version === responseVersion.current) inFlight.current = false;
      }
    },
    [endpoint, state.name, submissionId],
  );

  return { state, submissionId, resetSignal, locked: state.name === "submitting", markEdited, submit };
}
