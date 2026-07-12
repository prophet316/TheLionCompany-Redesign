"use client";

import { useEffect, useId, useRef, useState, type ReactElement } from "react";
import { useAnalytics } from "../analytics-provider";
import type { NewsletterPlacement } from "../../../lib/forms/contracts";
import { publicFormConfig } from "../../../lib/forms/public-config";
import { FieldError, FormEnvironmentNotice, FormFeedback, fieldErrorProps } from "./form-feedback";
import { TurnstileField } from "./turnstile-field";
import { useFormMachine } from "./use-form-machine";
import styles from "./forms.module.css";

export type NewsletterFormProps = {
  placement: NewsletterPlacement;
  onAccepted?: () => void;
  headingId?: string;
  className?: string;
};

export function NewsletterForm(props: NewsletterFormProps): ReactElement {
  const id = useId();
  const ids = {
    firstName: `${id}-first-name`,
    firstNameError: `${id}-first-name-error`,
    email: `${id}-email`,
    emailError: `${id}-email-error`,
    consentError: `${id}-consent-error`,
  };
  const { track } = useAnalytics();
  const started = useRef(false);
  const machine = useFormMachine("newsletter", {
    onAccepted: () => {
      track("newsletter_request_accepted", { placement: props.placement });
      props.onAccepted?.();
    },
    onError: (code) => track("newsletter_error", { placement: props.placement, code }),
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
      aria-label="Monthly field notes"
      aria-labelledby={props.headingId}
      noValidate
      onFocusCapture={() => setSecurityActive(true)}
      onPointerDownCapture={() => setSecurityActive(true)}
      onInput={() => {
        setSecurityActive(true);
        machine.markEdited();
        if (!started.current) {
          started.current = true;
          track("newsletter_form_start", { placement: props.placement });
        }
      }}
      onSubmit={(event) => {
        event.preventDefault();
        track("newsletter_submit", { placement: props.placement });
        const data = new FormData(event.currentTarget);
        void machine.submit({
          email: String(data.get("email") ?? ""),
          firstName: String(data.get("firstName") ?? ""),
          consent: data.get("consent") === "on",
          placement: props.placement,
          turnstileToken: token,
          website: String(data.get("website") ?? ""),
        });
      }}
    >
      <FormEnvironmentNotice mode={publicFormConfig.deliveryMode} />
      <FormFeedback state={machine.state} formRef={formRef} />
      <fieldset className={styles.fields} disabled={machine.locked}>
      <label htmlFor={ids.firstName}>First name <span>(optional)</span></label>
      <input id={ids.firstName} name="firstName" autoComplete="given-name" maxLength={80} {...fieldErrorProps(machine.state, "firstName", ids.firstNameError)} />
      <FieldError state={machine.state} name="firstName" id={ids.firstNameError} />
      <label htmlFor={ids.email}>Email address</label>
      <input id={ids.email} name="email" type="email" autoComplete="email" required maxLength={254} {...fieldErrorProps(machine.state, "email", ids.emailError)} />
      <FieldError state={machine.state} name="email" id={ids.emailError} />
      <label className={styles.checkbox}>
        <input name="consent" type="checkbox" required {...fieldErrorProps(machine.state, "consent", ids.consentError)} />
        Send me the monthly field notes. I can unsubscribe at any time.
      </label>
      <FieldError state={machine.state} name="consent" id={ids.consentError} />
      <label className={styles.honeypot} aria-hidden="true">
        Website<input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <TurnstileField action="newsletter_submit" active={securityActive} resetSignal={machine.resetSignal} onToken={setToken} />
      <button type="submit" disabled={!token || machine.state.name === "submitting"}>Request confirmation email</button>
      </fieldset>
      <noscript><p>JavaScript is required for the security check. No form text is placed in email or a URL.</p></noscript>
    </form>
  );
}
