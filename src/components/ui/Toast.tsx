import React from "react";

type ToastProps = { message: string; visible?: boolean };

export function Toast({ message, visible = true }: ToastProps){
  return (
    <div
      className={[
        "fixed bottom-5 left-1/2 -translate-x-1/2 transform",
        "z-50 pointer-events-none",
        "px-4 py-2 rounded-xl shadow-lg backdrop-blur-sm",
        "text-white bg-neutral-900/90",
        "transition-all duration-200 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
      ].join(" ")}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}

export function useToast(){
  const [msg, setMsg] = React.useState<string|undefined>();
  const [visible, setVisible] = React.useState(false);
  const tFadeRef = React.useRef<number | undefined>();
  const tHideRef = React.useRef<number | undefined>();

  // clear any pending timers
  const clearTimers = () => {
    if (tFadeRef.current) { window.clearTimeout(tFadeRef.current); tFadeRef.current = undefined; }
    if (tHideRef.current) { window.clearTimeout(tHideRef.current); tHideRef.current = undefined; }
  };

  React.useEffect(() => clearTimers, []); // cleanup on unmount

  const show = (m: string, durationMs: number = 1800) => {
    clearTimers();
    setMsg(m);
    setVisible(true);
    const fadeDelay = Math.max(0, durationMs - 180);
    tFadeRef.current = window.setTimeout(() => setVisible(false), fadeDelay);
    tHideRef.current = window.setTimeout(() => setMsg(undefined), durationMs);
    return clearTimers;
  };

  const ToastHost = () => (msg ? <Toast message={msg} visible={visible} /> : null);

  return { show, ToastHost };
}
