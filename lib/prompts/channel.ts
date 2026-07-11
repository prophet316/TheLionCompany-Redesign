import { PROMPT_STORAGE_KEY } from "./storage";

export function subscribePromptChanges(onChange: () => void) {
  const channel = typeof BroadcastChannel === "undefined"
    ? null
    : new BroadcastChannel("tlc-prompts-v1");
  const storage = (event: StorageEvent) => {
    if (event.key === PROMPT_STORAGE_KEY) onChange();
  };
  channel?.addEventListener("message", onChange);
  window.addEventListener("storage", storage);
  return {
    announce() { channel?.postMessage({ type: "changed" }); },
    close() {
      channel?.removeEventListener("message", onChange);
      channel?.close();
      window.removeEventListener("storage", storage);
    },
  };
}
