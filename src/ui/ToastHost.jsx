import { useEffect, useState } from "react";
import { TOAST_EVENT_NAME } from "./toast";

function colorClasses(type) {
  switch (type) {
    case "success":
      return "border-emerald-300/40 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white";
    case "error":
      return "border-red-300/40 bg-gradient-to-r from-red-700 to-red-600 text-white";
    case "warn":
      return "border-amber-300/40 bg-gradient-to-r from-amber-700 to-amber-600 text-white";
    default:
      return "border-sky-300/40 bg-gradient-to-r from-sky-700 to-sky-600 text-white";
  }
}

function typeLabel(type) {
  switch (type) {
    case "success":
      return "Success";
    case "error":
      return "Error";
    case "warn":
      return "Warning";
    default:
      return "Info";
  }
}

function typeBadge(type) {
  switch (type) {
    case "success":
      return "bg-white/15 ring-1 ring-white/25";
    case "error":
      return "bg-white/15 ring-1 ring-white/25";
    case "warn":
      return "bg-white/15 ring-1 ring-white/25";
    default:
      return "bg-white/15 ring-1 ring-white/25";
  }
}

export default function ToastHost() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const onToast = (e) => {
      const { type, message } = e?.detail || {};
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      setToasts((prev) => [...prev, { id, type, message }]);

      // Auto-dismiss
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3200);
    };

    window.addEventListener(TOAST_EVENT_NAME, onToast);
    return () => window.removeEventListener(TOAST_EVENT_NAME, onToast);
  }, []);

  const closeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  if (!toasts.length) return null;

  return (
    <div
      className="pointer-events-none fixed right-3 top-3 z-[9999] flex w-[min(92vw,420px)] flex-col gap-2"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto rounded-xl border p-3 shadow-xl backdrop-blur ${colorClasses(t.type)}`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 grid h-8 w-8 place-items-center rounded-full ${typeBadge(t.type)}`}
              aria-hidden="true"
            >
              <span className="text-sm font-black">{typeLabel(t.type)[0]}</span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <div className="truncate text-sm font-extrabold tracking-wide">
                  {typeLabel(t.type)}
                </div>
                <button
                  type="button"
                  onClick={() => closeToast(t.id)}
                  className="pointer-events-auto rounded-md px-2 py-1 text-white/90 hover:bg-white/10"
                  aria-label="Close toast"
                  title="Close"
                >
                  x
                </button>
              </div>
              <div className="mt-1 break-words text-sm text-white/95">{t.message}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
