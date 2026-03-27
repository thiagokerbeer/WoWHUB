import { Request, Response } from "express";
import * as bcrypt from "bcryptjs";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { prisma } from "../config/prisma";
import { generateToken } from "../utils/jwt";
import { createActivity } from "../utils/activity";

const registerSchema = z.object({
  name: z.string().trim().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z
    .string()
    .min(6, "Senha deve ter pelo menos 6 caracteres")
    .max(100, "Senha muito longa"),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatar: true,
  isBlocked: true,
  bannedUntil: true,
  createdAt: true,
} as const;

type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
  isBlocked: boolean;
  bannedUntil: Date | null;
  createdAt: Date;
};

type LoginUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isBlocked: boolean;
  bannedUntil: Date | null;
};

type AuthenticatedRequest = Request & {
  user?: {
    userId: string;
    role: UserRole;
  };
};

function getBanMessage(bannedUntil: Date) {
  return `Usuário temporariamente banido até ${bannedUntil.toLocaleString("pt-BR")}`;
}

async function findPublicUserById(userId: string): Promise<PublicUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    isBlocked: user.isBlocked,
    bannedUntil: user.bannedUntil,
    createdAt: user.createdAt,
  };
}

export async function register(req: Request, res: Response) {
  try {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Dados inválidos",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { name, email, password } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "E-mail já cadastrado",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const firstUser = (await prisma.user.count()) === 0;

    const createdUserRaw = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: firstUser ? UserRole.ADMIN : UserRole.USER,
        avatar: name.slice(0, 2).toUpperCase(),
      },
      select: publicUserSelect,
    });

    const createdUser: PublicUser = {
      id: createdUserRaw.id,
      name: createdUserRaw.name,
      email: createdUserRaw.email,
      role: createdUserRaw.role,
      avatar: createdUserRaw.avatar,
      isBlocked: createdUserRaw.isBlocked,
      bannedUntil: createdUserRaw.bannedUntil,
      createdAt: createdUserRaw.createdAt,
    };

    await createActivity(
      createdUser.id,
      "Account created",
      `${createdUser.name} created a WoWHUB account.`
    );

    const token = generateToken({
      userId: createdUser.id,
      role: createdUser.role,
    });

    return res.status(201).json({
      message: "Cadastro realizado com sucesso",
      token,
      user: createdUser,
    });
  } catch {
    return res.status(500).json({
      message: "Erro interno ao cadastrar usuário",
    });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Dados inválidos",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { email, password } = parsed.data;

    const userRaw = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        isBlocked: true,
        bannedUntil: true,
      },
    });

    if (!userRaw) {
      return res.status(401).json({
        message: "Credenciais inválidas",
      });
    }

    const user: LoginUser = {
      id: userRaw.id,
      name: userRaw.name,
      email: userRaw.email,
      password: userRaw.password,
      role: userRaw.role,
      isBlocked: userRaw.isBlocked,
      bannedUntil: userRaw.bannedUntil,
    };

    if (user.isBlocked) {
      return res.status(403).json({
        message: "Usuário bloqueado pelo administrador",
      });
    }

    if (user.bannedUntil && user.bannedUntil > new Date()) {
      return res.status(403).json({
        message: getBanMessage(user.bannedUntil),
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Credenciais inválidas",
      });
    }

    await createActivity(user.id, "Login", `${user.name} signed in.`);

    const token = generateToken({
      userId: user.id,
      role: user.role,
    });

    const publicUser = await findPublicUserById(user.id);

    if (!publicUser) {
      return res.status(404).json({
        message: "Usuário não encontrado",
      });
    }

    return res.status(200).json({
      message: "Login realizado com sucesso",
      token,
      user: publicUser,
    });
  } catch {
    return res.status(500).json({
      message: "Erro interno ao fazer login",
    });
  }
}

export async function me(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Não autenticado",
      });
    }

    const user = await findPublicUserById(userId);

    if (!user) {
      return res.status(404).json({
        message: "Usuário não encontrado",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message: "Usuário bloqueado pelo administrador",
      });
    }

    if (user.bannedUntil && user.bannedUntil > new Date()) {
      return res.status(403).json({
        message: getBanMessage(user.bannedUntil),
      });
    }

    return res.status(200).json(user);
  } catch {
    return res.status(500).json({
      message: "Erro interno ao buscar usuário",
    });
  }
}