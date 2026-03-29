import { AppError } from "./AppError";

type UserAccessState = {
  isBlocked: boolean;
  bannedUntil: Date | null;
};

export function getBanMessage(bannedUntil: Date) {
  return `Usuário temporariamente banido até ${bannedUntil.toLocaleString("pt-BR")}`;
}

export function assertUserCanAccess(user: UserAccessState) {
  if (Boolean(user.isBlocked)) {
    throw new AppError(403, "Usuário bloqueado pelo administrador");
  }

  if (user.bannedUntil && user.bannedUntil > new Date()) {
    throw new AppError(403, getBanMessage(user.bannedUntil));
  }
}