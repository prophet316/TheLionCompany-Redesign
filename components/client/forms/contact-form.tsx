"use client";

import { useEffect, useId, useRef, useState, type ReactElement } from "react";
import { useAnalytics } from "../analytics-provider";
import type { ContactReason } from "../../../lib/forms/contracts";
import { isContactReason } from "../../../lib/forms/client-contracts";
import { publicFormConfig } from "../../../lib/forms/public-config";
import { FieldError, FormEnvironmentNotice, FormFeedback, fieldErrorProps } from "./form-feedback";
import { TurnstileField } from "./turnstile-field";
import { useFormMachine } from "./use-form-machine";
import styles from "./forms.module.css";

export type ContactFormProps = { defaultReason?: ContactReason; className?: string };
const reasons: Array<[ContactReason, string]> = [
  ["speaking", "Speaking invitation"],
  ["partnership", "Partnership"],
  ["media", "Media inquiry"],
  ["testimony", "Share a testimony"],
  ["general", "General question"],
];

export function ContactForm(props: ContactFormProps): ReactElement {
  const id = useId();
  const ids = {
    name: `${id}-name`,
    nameError: `${id}-name-error`,
    email: `${id}-email`,
    emailError: `${id}-email-error`,
    reason: `${id}-reason`,
    reasonError: `${id}-reason-error`,
    message: `${id}-message`,
    messageError: `${id}-message-error`,
  };
  const { track } = useAnalytics();
  const started = useRef(false);
  const [reason, setReason] = useState<ContactReason>(props.defaultReason ?? "general");
  const machine = useFormMachine("contact", {
    onAccepted: () => track("contact_success", { reason }),
    onError: (code) => track("contact_error", { reason, code }),
  });
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const [token, setToken] = useState("");
  const [securityActive, setSecurityActive] = useState(false);
  useEffect(() => {
    if (machine.state.name === "accepted") successRef.current?.focus();
  }, [machine.state]);
  if (machine.state.name === "accepted") {
    return <h3 ref={successRef} tabIndex={-1}>{machine.state.result.message}</h3>;
  }
  return (
    <form
      ref={formRef}
      className={`${styles.form} ${props.className ?? ""}`}
      aria-label="Contact The Lion Company"
      noValidate
      onFocusCapture={() => setSecurityActive(true)}
      onPointerDownCapture={() => setSecurityActive(true)}
      onInput={() => {
        setSecurityActive(true);
        machine.markEdited();
        if (!started.current) {
          started.current = true;
          track("contact_form_start", { reason });
        }
      }}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        track("contact_submit", { reason });
        void machine.submit({
          name: String(data.get("name") ?? ""),
          email: String(data.get("email") ?? ""),
          reason,
          message: String(data.get("message") ?? ""),
          turnstileToken: token,
          website: String(data.get("website") ?? ""),
        });
      }}
    >
      <FormEnvironmentNotice mode={publicFormConfig.deliveryMode} />
      <FormFeedback state={machine.state} formRef={formRef} />
      <fieldset className={styles.fields} disabled={machine.locked}>
      <label htmlFor={ids.name}>Name</label>
      <input id={ids.name} name="name" autoComplete="name" required maxLength={80} {...fieldErrorProps(machine.state, "name", ids.nameError)} />
      <FieldError state={machine.state} name="name" id={ids.nameError} />
      <label htmlFor={ids.email}>Email address</label>
      <input id={ids.email} name="email" type="email" autoComplete="email" required maxLength={254} {...fieldErrorProps(machine.state, "email", ids.emailError)} />
      <FieldError state={machine.state} name="email" id={ids.emailError} />
      <label htmlFor={ids.reason}>Reason for contacting us</label>
      <select
        id={ids.reason}
        name="reason"
        value={reason}
        onChange={(event) => {
          const candidate = event.currentTarget.value;
          if (isContactReason(candidate)) setReason(candidate);
          machine.markEdited();
        }}
        {...fieldErrorProps(machine.state, "reason", ids.reasonError)}
      >
        {reasons.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <FieldError state={machine.state} name="reason" id={ids.reasonError} />
      <p>Submitting a testimony does not grant permission to publish it. Publication requires separate written consent.</p>
      <label htmlFor={ids.message}>Message</label>
      <textarea id={ids.message} name="message" minLength={20} maxLength={4000} required rows={8} {...fieldErrorProps(machine.state, "message", ids.messageError)} />
      <FieldError state={machine.state} name="message" id={ids.messageError} />
      <label className={styles.honeypot} aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <TurnstileField action="contact_submit" active={securityActive} resetSignal={machine.resetSignal} onToken={setToken} />
      <button type="submit" disabled={!token || machine.state.name === "submitting"}>Send message</button>
      </fieldset>
      <noscript><p>JavaScript is required for the security check. No message text is placed in email or a URL.</p></noscript>
    </form>
  );
}
