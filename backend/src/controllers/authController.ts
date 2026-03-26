import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { generateToken } from "../utils/jwt";
import { createActivity } from "../utils/activity";

const registerSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export async function register(req: Request, res: Response) {
  try {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ message: "Dados inválidos", errors: parsed.error.flatten().fieldErrors });
    }

    const { name, email, password } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "E-mail já cadastrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const firstUser = (await prisma.user.count()) === 0;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: firstUser ? "ADMIN" : "USER",
        avatar: name.slice(0, 2).toUpperCase()
      }
    });

    await createActivity(user.id, "Account created", `${user.name} created a WoWHUB account.`);

    const token = generateToken({ userId: user.id, role: user.role });

    return res.status(201).json({
      message: "Cadastro realizado com sucesso",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch {
    return res.status(500).json({ message: "Erro interno ao cadastrar usuário" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ message: "Dados inválidos", errors: parsed.error.flatten().fieldErrors });
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    await createActivity(user.id, "Login", `${user.name} signed in.`);

    const token = generateToken({ userId: user.id, role: user.role });

    return res.status(200).json({
      message: "Login realizado com sucesso",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch {
    return res.status(500).json({ message: "Erro interno ao fazer login" });
  }
}

export async function me(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true
      }
    });

    return res.status(200).json(user);
  } catch {
    return res.status(500).json({ message: "Erro interno ao buscar usuário" });
  }
}
