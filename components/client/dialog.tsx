"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import styles from "./dialog.module.css";

export function Dialog({
  open,
  title,
  titleId,
  onClose,
  children,
}: {
  readonly open: boolean;
  readonly title: string;
  readonly titleId?: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const generatedTitleId = useId();
  const labelId = titleId ?? generatedTitleId;
  const triggerRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      triggerRef.current = document.activeElement as HTMLElement | null;
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
      document.body.dataset.scrollLock = "true";
      dialog.querySelector<HTMLElement>("[data-dialog-close]")?.focus();
    } else if (!open && dialog.open) {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const dialog = ref.current;
    if (!dialog) return;

    const finishClose = () => {
      delete document.body.dataset.scrollLock;
      onCloseRef.current();
      triggerRef.current?.focus();
    };

    const onDialogClose = () => {
      finishClose();
    };

    const onCancel = (event: Event) => {
      event.preventDefault();
      if (typeof dialog.close === "function") dialog.close();
      else {
        dialog.removeAttribute("open");
        finishClose();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      if (typeof dialog.close === "function") dialog.close();
      else {
        dialog.removeAttribute("open");
        finishClose();
      }
    };

    dialog.addEventListener("close", onDialogClose);
    dialog.addEventListener("cancel", onCancel);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      dialog.removeEventListener("close", onDialogClose);
      dialog.removeEventListener("cancel", onCancel);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={labelId}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        if (typeof event.currentTarget.close === "function") event.currentTarget.close();
        else {
          event.currentTarget.removeAttribute("open");
          delete document.body.dataset.scrollLock;
          onClose();
          triggerRef.current?.focus();
        }
      }}
    >
      <div className={styles.panel}>
        <button
          data-dialog-close
          className={styles.close}
          type="button"
          onClick={() => {
            if (typeof ref.current?.close === "function") ref.current.close();
            else {
              ref.current?.removeAttribute("open");
              delete document.body.dataset.scrollLock;
              onClose();
              triggerRef.current?.focus();
            }
          }}
        >
          Close
        </button>
        <h2 id={labelId}>{title}</h2>
        {children}
      </div>
    </dialog>
  );
}
