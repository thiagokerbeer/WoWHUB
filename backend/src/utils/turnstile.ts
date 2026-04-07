import { getEnv } from "../config/env";

type TurnstileVerifyResponse = {
  success: boolean;
  "error-codes"?: string[];
};

function getClientIp(remoteIp?: string) {
  if (!remoteIp) {
    return "";
  }

  if (remoteIp.includes(",")) {
    return remoteIp.split(",")[0].trim();
  }

  return remoteIp.trim();
}

export async function verifyTurnstileToken(token: string, remoteIp?: string) {
  const secret = getEnv().turnstileSecretKey;

  if (!secret) {
    throw new Error("TURNSTILE_SECRET_KEY_NOT_CONFIGURED");
  }

  const body = new URLSearchParams();
  body.append("secret", secret);
  body.append("response", token);

  const normalizedIp = getClientIp(remoteIp);

  if (normalizedIp) {
    body.append("remoteip", normalizedIp);
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error("TURNSTILE_VERIFY_REQUEST_FAILED");
  }

  const result = (await response.json()) as TurnstileVerifyResponse;

  return {
    success: result.success,
    errorCodes: result["error-codes"] || [],
  };
}