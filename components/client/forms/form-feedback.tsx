"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { DeliveryMode, FormSubmitResult } from "../../../lib/forms/contracts";
import styles from "./forms.module.css";

export type FeedbackState =
  | { name: "editing" }
  | { name: "submitting" }
  | { name: "accepted"; result: Extract<FormSubmitResult, { ok: true }> }
  | { name: "error"; result: Extract<FormSubmitResult, { ok: false }> };

export function fieldErrorProps(state: FeedbackState, name: string, errorId: string) {
  const invalid = state.name === "error" && Boolean(state.result.fieldErrors?.[name]);
  return invalid ? { "aria-invalid": true as const, "aria-describedby": errorId } : {};
}

export function FieldError(props: { state: FeedbackState; name: string; id: string }) {
  const messages = props.state.name === "error" ? props.state.result.fieldErrors?.[props.name] : undefined;
  if (!messages?.length) return null;
  return <p id={props.id} className={styles.fieldError}>{messages[0]}</p>;
}

export function FormEnvironmentNotice({ mode }: { mode: DeliveryMode }) {
  if (mode === "live") return null;
  return (
    <p className={styles.environment} role="status">
      Preview test mode: {mode === "no-send" ? "no message will be sent" : "messages go only to the restricted test recipient"}.
    </p>
  );
}

export function FormFeedback(props: {
  state: FeedbackState;
  formRef: RefObject<HTMLFormElement | null>;
}) {
  const summary = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (props.state.name !== "error") return;
    const form = props.formRef.current;
    const first = Object.keys(props.state.result.fieldErrors ?? {})[0];
    const field = first
      ? form?.querySelector<HTMLElement>(`[name="${CSS.escape(first)}"]`)
      : null;
    (field ?? summary.current)?.focus();
  }, [props.formRef, props.state]);
  if (props.state.name === "submitting") {
    return <p role="status" aria-live="polite">Sending securely…</p>;
  }
  if (props.state.name !== "error") return null;
  return (
    <div ref={summary} className={styles.errorSummary} role="alert" tabIndex={-1}>
      <p>{props.state.result.message}</p>
      {Object.entries(props.state.result.fieldErrors ?? {}).map(([field, messages]) => (
        <button
          key={field}
          type="button"
          onClick={() => props.formRef.current?.querySelector<HTMLElement>(`[name="${CSS.escape(field)}"]`)?.focus()}
        >
          {messages[0]}
        </button>
      ))}
    </div>
  );
}
