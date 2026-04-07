import { Prisma } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { createActivity } from "../utils/activity";
import { AppError } from "../utils/AppError";
import { generateToken } from "../utils/jwt";
import { verifyTurnstileToken } from "../utils/turnstile";
import { assertUserCanAccess } from "../utils/userAccess";
import { getEnv } from "../config/env";

const registerSchema = z.object({
  name: z.string().trim().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z
    .string()
    .min(6, "Senha deve ter pelo menos 6 caracteres")
    .max(100, "Senha muito longa"),
  turnstileToken: z.string().min(10).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  turnstileToken: z.string().min(10).optional(),
});

const publicUserSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  name: true,
  email: true,
  role: true,
  avatar: true,
  isBlocked: true,
  bannedUntil: true,
  createdAt: true,
});

const loginUserSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  name: true,
  email: true,
  password: true,
  role: true,
  isBlocked: true,
  bannedUntil: true,
});

type PublicUser = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;

type LoginUserRecord = Prisma.UserGetPayload<{
  select: typeof loginUserSelect;
}>;

function parseRegisterPayload(payload: unknown) {
  const parsed = registerSchema.safeParse(payload);

  if (!parsed.success) {
    throw new AppError(400, "Dados inválidos", {
      details: parsed.error.flatten().fieldErrors,
    });
  }

  return parsed.data;
}

function parseLoginPayload(payload: unknown) {
  const parsed = loginSchema.safeParse(payload);

  if (!parsed.success) {
    throw new AppError(400, "Dados inválidos", {
      details: parsed.error.flatten().fieldErrors,
    });
  }

  return parsed.data;
}

async function findPublicUserById(userId: string): Promise<PublicUser | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });
}

async function findLoginUserByEmail(
  email: string
): Promise<LoginUserRecord | null> {
  return prisma.user.findUnique({
    where: { email },
    select: loginUserSelect,
  });
}

function buildAvatar(name: string) {
  return name.trim().slice(0, 2).toUpperCase();
}

export async function registerUser(payload: unknown) {
  const { name, email, password, turnstileToken } = parseRegisterPayload(payload);
  const env = getEnv();

  if (env.turnstileEnabled && turnstileToken) {
    const turnstileResult = await verifyTurnstileToken(turnstileToken);

    if (!turnstileResult.success) {
      throw new AppError(400, "Falha na validação anti-bot");
    }
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError(409, "E-mail já cadastrado");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const firstUser = (await prisma.user.count()) === 0;

  const createdUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: firstUser ? "ADMIN" : "USER",
      avatar: buildAvatar(name),
    },
    select: publicUserSelect,
  });

  await createActivity(
    createdUser.id,
    "Account created",
    `${createdUser.name} created a WoWHUB account.`
  );

  const token = generateToken({
    userId: createdUser.id,
    role: createdUser.role,
  });

  return {
    message: "Cadastro realizado com sucesso",
    token,
    user: createdUser,
  };
}

export async function loginUser(payload: unknown) {
  const { email, password, turnstileToken } = parseLoginPayload(payload);
  const env = getEnv();

  if (env.turnstileEnabled && turnstileToken) {
    const turnstileResult = await verifyTurnstileToken(turnstileToken);

    if (!turnstileResult.success) {
      throw new AppError(400, "Falha na validação anti-bot");
    }
  }

  const user = await findLoginUserByEmail(email);

  if (!user) {
    throw new AppError(401, "Credenciais inválidas");
  }

  try {
    assertUserCanAccess({
      isBlocked: user.isBlocked,
      bannedUntil: user.bannedUntil,
    });
  } catch {
    throw new AppError(401, "Credenciais inválidas");
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    throw new AppError(401, "Credenciais inválidas");
  }

  await createActivity(user.id, "Login", `${user.name} signed in.`);

  const publicUser = await findPublicUserById(user.id);

  if (!publicUser) {
    throw new AppError(404, "Usuário não encontrado");
  }

  const token = generateToken({
    userId: user.id,
    role: user.role,
  });

  return {
    message: "Login realizado com sucesso",
    token,
    user: publicUser,
  };
}

export async function getCurrentUser(userId?: string) {
  if (!userId) {
    throw new AppError(401, "Não autenticado");
  }

  const user = await findPublicUserById(userId);

  if (!user) {
    throw new AppError(404, "Usuário não encontrado");
  }

  assertUserCanAccess({
    isBlocked: user.isBlocked,
    bannedUntil: user.bannedUntil,
  });

  return user;
}