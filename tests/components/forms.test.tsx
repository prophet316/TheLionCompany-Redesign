import React, { act, forwardRef, useImperativeHandle } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/forms/public-config", () => ({
  publicFormConfig: { turnstileSiteKey: "test-site-key", deliveryMode: "no-send" },
}));

vi.mock("../../components/client/analytics-provider", () => ({
  useAnalytics: () => ({ track: vi.fn() }),
}));

vi.mock("@marsidev/react-turnstile", () => ({
  Turnstile: forwardRef(function MockTurnstile(
    props: { onSuccess(token: string): void; onExpire(): void },
    ref: React.ForwardedRef<{ reset(): void }>,
  ) {
    useImperativeHandle(ref, () => ({ reset: vi.fn() }));
    return (
      <button type="button" onClick={() => props.onSuccess("turnstile-token")}>
        Complete security check
      </button>
    );
  }),
}));

import { ContactForm } from "../../components/client/forms/contact-form";
import { NewsletterForm } from "../../components/client/forms/newsletter-form";
import { PrayerForm } from "../../components/client/forms/prayer-form";

function acceptedResult(submissionId: string) {
  return {
    ok: true as const,
    status: "accepted" as const,
    submissionId,
    deliveryMode: "no-send" as const,
    replayed: false,
    message: "Preview test accepted — no message was sent.",
  };
}

function acceptedResponse(init?: RequestInit) {
  const body = typeof init?.body === "string" ? JSON.parse(init.body) as { submissionId?: string } : {};
  return Response.json(acceptedResult(String(body.submissionId ?? "")), { status: 202 });
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => acceptedResponse(init)));
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
  vi.unstubAllGlobals();
});

async function completeSecurity() {
  fireEvent.click(screen.getByRole("button", { name: /complete security check/i }));
}

describe("form components", () => {
  it("emits unique IDs when inline and prompt newsletter forms coexist", () => {
    const { container } = render(
      <>
        <NewsletterForm placement="inline" />
        <NewsletterForm placement="prompt" />
      </>,
    );
    const ids = [...container.querySelectorAll<HTMLElement>("[id]")].map(
      (element) => element.id,
    );
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("submits newsletter consent, announces no-send, and calls onAccepted once", async () => {
    const onAccepted = vi.fn();
    render(<NewsletterForm placement="inline" onAccepted={onAccepted} />);
    expect(screen.getByText(/preview test mode/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "person@example.org" },
    });
    fireEvent.click(screen.getByLabelText(/send me the monthly field notes/i));
    await completeSecurity();
    fireEvent.submit(screen.getByRole("form", { name: /monthly field notes/i }));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /preview test accepted/i })).toHaveFocus(),
    );
    expect(onAccepted).toHaveBeenCalledTimes(1);
  });

  it("locks all fields and coalesces rapid duplicate submit events", async () => {
    let resolveFetch!: (response: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(
      () => new Promise<Response>((resolve) => { resolveFetch = resolve; }),
    );
    render(<NewsletterForm placement="inline" />);
    const email = screen.getByLabelText(/email address/i);
    fireEvent.change(email, { target: { value: "person@example.org" } });
    fireEvent.click(screen.getByLabelText(/send me the monthly field notes/i));
    await completeSecurity();
    const form = screen.getByRole("form", { name: /monthly field notes/i });
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(email).toBeDisabled();
    resolveFetch(acceptedResponse({ body: String(vi.mocked(fetch).mock.calls[0]?.[1]?.body ?? "{}") }));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /preview test accepted/i })).toHaveFocus(),
    );
  });

  it("never treats malformed success JSON or a non-202 response as acceptance", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({ ok: true, message: "false success" }, { status: 500 }),
    );
    render(<NewsletterForm placement="inline" />);
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "person@example.org" } });
    fireEvent.click(screen.getByLabelText(/send me the monthly field notes/i));
    await completeSecurity();
    fireEvent.submit(screen.getByRole("form", { name: /monthly field notes/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/network request did not finish/i);
    expect(screen.queryByText("false success")).not.toBeInTheDocument();
  });

  it("times out a hung request after ten seconds without clearing private text", async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockImplementationOnce((_input, init) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
    }));
    render(<PrayerForm placement="prayer" />);
    const request = screen.getByLabelText(/^prayer request$/i);
    fireEvent.change(request, { target: { value: "Please pray for wisdom and peace this week." } });
    await completeSecurity();
    fireEvent.submit(screen.getByRole("form", { name: /private prayer/i }));
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    expect(screen.getByRole("alert")).toHaveTextContent(/network request did not finish/i);
    expect(request).toHaveValue("Please pray for wisdom and peace this week.");
  });

  it("retains prayer text and reuses the UUID for an unedited retry", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        Response.json(
          {
            ok: false,
            status: "error",
            code: "provider_unavailable",
            retryable: true,
            message: "We could not deliver this right now. Your text is still here; please try again.",
          },
          { status: 503 },
        ),
      )
      .mockImplementationOnce(async (_input, init) => acceptedResponse(init));
    render(<PrayerForm placement="prayer" />);
    const textarea = screen.getByLabelText(/^prayer request$/i);
    fireEvent.change(textarea, {
      target: { value: "Please pray for wisdom and peace this week." },
    });
    await completeSecurity();
    fireEvent.submit(screen.getByRole("form", { name: /private prayer/i }));
    expect(await screen.findByText(/could not deliver/i)).toBeInTheDocument();
    expect(textarea).toHaveValue("Please pray for wisdom and peace this week.");
    await completeSecurity();
    fireEvent.submit(screen.getByRole("form", { name: /private prayer/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const first = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    const second = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));
    expect(first.submissionId).toBe(second.submissionId);
  });

  it("focuses the first invalid contact field and preserves values", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json(
        {
          ok: false,
          status: "error",
          code: "invalid_fields",
          retryable: false,
          message: "Review the highlighted fields and try again.",
          fieldErrors: { message: ["Enter at least 20 characters."] },
        },
        { status: 422 },
      ),
    );
    render(<ContactForm defaultReason="general" />);
    fireEvent.change(screen.getByLabelText(/^name/i), { target: { value: "Ada" } });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "ada@example.org" },
    });
    fireEvent.change(screen.getByLabelText(/^message/i), { target: { value: "short" } });
    await completeSecurity();
    fireEvent.submit(screen.getByRole("form", { name: /contact the lion company/i }));
    await waitFor(() => expect(screen.getByLabelText(/^message/i)).toHaveFocus());
    expect(screen.getByLabelText(/^name/i)).toHaveValue("Ada");
  });
});
