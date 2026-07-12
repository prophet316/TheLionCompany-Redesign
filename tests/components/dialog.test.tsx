import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { Dialog } from "@/components/client/dialog";

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open story</button>
      <Dialog open={open} title="A product story" onClose={() => setOpen(false)}>
        <a href="https://the-lion-company.printify.me/">Continue</a>
      </Dialog>
    </>
  );
}

describe("Dialog", () => {
  afterEach(() => cleanup());

  it("traps through native modal behavior, closes on Escape, and restores trigger focus", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Open story" });
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "A product story" })).toBeVisible();
    expect(document.body).toHaveAttribute("data-scroll-lock", "true");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
