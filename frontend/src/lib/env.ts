export function warnIfApiUrlMissing() {
  if (import.meta.env.PROD && !import.meta.env.VITE_API_URL?.trim()) {
    console.warn(
      "[WoWHUB] VITE_API_URL não está definida no build de produção. Requisições usarão o fallback (localhost)."
    );
  }
}
