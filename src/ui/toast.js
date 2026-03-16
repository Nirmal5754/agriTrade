const EVENT_NAME = "app-toast";

function emit(type, message) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(EVENT_NAME, {
      detail: { type, message: String(message ?? "") },
    })
  );
}

export const toast = {
  success: (message) => emit("success", message),
  error: (message) => emit("error", message),
  info: (message) => emit("info", message),
  warn: (message) => emit("warn", message),
};

export const TOAST_EVENT_NAME = EVENT_NAME;

