import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          theme?: "light" | "dark" | "auto";
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      remove?: (widgetId?: string) => void;
    };
  }
}

type TurnstileWidgetProps = {
  onTokenChange: (token: string) => void;
};

let turnstileScriptPromise: Promise<void> | null = null;

function loadTurnstileScript() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.turnstile) {
    return Promise.resolve();
  }

  if (turnstileScriptPromise) {
    return turnstileScriptPromise;
  }

  turnstileScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Falha ao carregar Turnstile")), {
        once: true,
      });

      if (window.turnstile) {
        resolve();
      }

      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Falha ao carregar Turnstile"));
    document.head.appendChild(script);
  });

  return turnstileScriptPromise;
}

export function TurnstileWidget({ onTokenChange }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim();

  useEffect(() => {
    onTokenChange("");
  }, [onTokenChange]);

  useEffect(() => {
    if (!siteKey) {
      setStatus("error");
      return;
    }

    let cancelled = false;

    async function mountWidget() {
      try {
        await loadTurnstileScript();

        if (cancelled || !containerRef.current || !window.turnstile) {
          return;
        }

        containerRef.current.innerHTML = "";

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: "dark",
          callback: (token) => {
            onTokenChange(token);
          },
          "expired-callback": () => {
            onTokenChange("");
          },
          "error-callback": () => {
            onTokenChange("");
          },
        });

        setStatus("ready");
      } catch {
        if (!cancelled) {
          setStatus("error");
          onTokenChange("");
        }
      }
    }

    mountWidget();

    return () => {
      cancelled = true;

      if (window.turnstile && widgetIdRef.current && window.turnstile.remove) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [onTokenChange, siteKey]);

  if (!siteKey) {
    return (
      <div className="error-box">
        Proteção de segurança indisponível. Configure a variável
        <strong> VITE_TURNSTILE_SITE_KEY </strong>
        no frontend.
      </div>
    );
  }

  if (status === "error") {
    return <div className="error-box">Não foi possível carregar a verificação de segurança.</div>;
  }

  return (
    <div>
      <div ref={containerRef} />
      {status === "loading" && <p className="body-copy">Carregando verificação de segurança...</p>}
    </div>
  );
}