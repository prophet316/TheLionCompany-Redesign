"use client";

import { useEffect, useRef, useState } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import type { TurnstileAction } from "../../../lib/forms/contracts";
import { publicFormConfig } from "../../../lib/forms/public-config";

export function TurnstileField(props: {
  action: TurnstileAction;
  resetSignal: number;
  onToken(token: string): void;
}) {
  const widget = useRef<TurnstileInstance>(null);
  const [message, setMessage] = useState("Complete the security check before submitting.");
  const { onToken, resetSignal } = props;
  useEffect(() => {
    widget.current?.reset();
    onToken("");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetSignal is an external retry signal
    setMessage("Complete the new security check before retrying.");
  }, [onToken, resetSignal]);
  return (
    <div>
      <Turnstile
        ref={widget}
        siteKey={publicFormConfig.turnstileSiteKey}
        options={{ action: props.action, appearance: "interaction-only", theme: "light" }}
        onSuccess={(token) => {
          props.onToken(token);
          setMessage("Security check complete.");
        }}
        onExpire={() => {
          props.onToken("");
          setMessage("The security check expired. Complete it again.");
          widget.current?.reset();
        }}
        onError={() => {
          props.onToken("");
          setMessage("The security check could not load. Check your connection and try again.");
        }}
      />
      <p aria-live="polite">{message}</p>
    </div>
  );
}
