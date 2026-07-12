"use client";

import { useEffect, useId, useRef, useState, type ReactElement } from "react";
import type { PrayerPlacement } from "../../../lib/forms/contracts";
import { publicFormConfig } from "../../../lib/forms/public-config";
import { FieldError, FormEnvironmentNotice, FormFeedback, fieldErrorProps } from "./form-feedback";
import { TurnstileField } from "./turnstile-field";
import { useFormMachine } from "./use-form-machine";
import styles from "./forms.module.css";

export type PrayerFormProps = { placement: PrayerPlacement; className?: string };

export function PrayerForm(props: PrayerFormProps): ReactElement {
  const id = useId();
  const ids = {
    displayName: `${id}-display-name`,
    displayNameError: `${id}-display-name-error`,
    email: `${id}-email`,
    emailError: `${id}-email-error`,
    request: `${id}-request`,
    requestError: `${id}-request-error`,
  };
  const machine = useFormMachine("prayer");
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const [token, setToken] = useState("");
  const [followUp, setFollowUp] = useState(false);
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
      aria-label="Private prayer form"
      noValidate
      onFocusCapture={() => setSecurityActive(true)}
      onPointerDownCapture={() => setSecurityActive(true)}
      onInput={() => {
        setSecurityActive(true);
        machine.markEdited();
      }}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        void machine.submit({
          displayName: String(data.get("displayName") ?? ""),
          email: String(data.get("email") ?? ""),
          request: String(data.get("request") ?? ""),
          followUpRequested: data.get("followUpRequested") === "on",
          turnstileToken: token,
          website: String(data.get("website") ?? ""),
        });
      }}
    >
      <p>This inbox is not continuously monitored and is not an emergency service. If you or someone else is in immediate danger, contact local emergency services now.</p>
      <FormEnvironmentNotice mode={publicFormConfig.deliveryMode} />
      <FormFeedback state={machine.state} formRef={formRef} />
      <fieldset className={styles.fields} disabled={machine.locked}>
      <label htmlFor={ids.displayName}>Name <span>(optional)</span></label>
      <input id={ids.displayName} name="displayName" autoComplete="name" maxLength={80} {...fieldErrorProps(machine.state, "displayName", ids.displayNameError)} />
      <FieldError state={machine.state} name="displayName" id={ids.displayNameError} />
      <label htmlFor={ids.email}>Email address <span>(required only for follow-up)</span></label>
      <input id={ids.email} name="email" type="email" autoComplete="email" required={followUp} maxLength={254} {...fieldErrorProps(machine.state, "email", ids.emailError)} />
      <FieldError state={machine.state} name="email" id={ids.emailError} />
      <label htmlFor={ids.request}>Prayer request</label>
      <textarea id={ids.request} name="request" minLength={20} maxLength={4000} required rows={8} {...fieldErrorProps(machine.state, "request", ids.requestError)} />
      <FieldError state={machine.state} name="request" id={ids.requestError} />
      <label className={styles.checkbox}>
        <input
          name="followUpRequested"
          type="checkbox"
          checked={followUp}
          onChange={(event) => {
            setFollowUp(event.currentTarget.checked);
            machine.markEdited();
          }}
        />
        I would like a ministry responder to follow up by email.
      </label>
      <label className={styles.honeypot} aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <TurnstileField action="prayer_submit" active={securityActive} resetSignal={machine.resetSignal} onToken={setToken} />
      <button type="submit" disabled={!token || machine.state.name === "submitting"}>Send private request</button>
      </fieldset>
      <noscript><p>JavaScript is required for the security check. Your prayer is never placed in an email link or URL.</p></noscript>
    </form>
  );
}
