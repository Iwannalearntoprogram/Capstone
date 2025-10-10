import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

const noop = () => {};

const ToastContext = createContext({
  showToast: noop,
  removeToast: noop,
});

const TOAST_VARIANTS = {
  success: "bg-[#1D3C34] text-white",
  error: "bg-[#8B1C13] text-white",
  info: "bg-gray-800 text-white",
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timers = timersRef.current;
    if (timers.has(id)) {
      clearTimeout(timers.get(id));
      timers.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (message, options = {}) => {
      if (!message) return;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const duration = options.duration ?? 3000;
      const type = options.type ?? "info";

      setToasts((prev) => [...prev, { id, message, type, duration }]);

      const timeoutId = setTimeout(() => removeToast(id), duration);
      timersRef.current.set(id, timeoutId);

      return id;
    },
    [removeToast]
  );

  const contextValue = useMemo(
    () => ({ showToast, removeToast }),
    [showToast, removeToast]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-[9999] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4">
        {toasts.map((toast) => (
          <button
            key={toast.id}
            type="button"
            onClick={() => removeToast(toast.id)}
            className={`pointer-events-auto w-full rounded-2xl px-4 py-3 text-sm shadow-lg transition hover:opacity-90 ${
              TOAST_VARIANTS[toast.type] ?? TOAST_VARIANTS.info
            }`}
          >
            {toast.message}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext);
