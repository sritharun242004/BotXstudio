import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { BadRequestError, ForbiddenError, NotFoundError } from "../utils/errors.js";

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const { search = "", role, page = "1", limit = "20" } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          permissions: true,
          createdAt: true,
          _count: { select: { images: true, storyboards: true, apiLogs: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
}

export async function addAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, permissions } = req.body as { email: string; permissions?: Record<string, boolean> };
    if (!email) throw new BadRequestError("Email is required");
    if (!email.endsWith("@thebotcompany.in")) {
      throw new BadRequestError("Admin email must end with @thebotcompany.in");
    }

    const user = await prisma.user.upsert({
      where: { email: email.toLowerCase() },
      create: {
        email: email.toLowerCase(),
        name: email.split("@")[0],
        role: "ADMIN",
        permissions: permissions ? (permissions as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
      update: {
        role: "ADMIN",
        permissions: permissions ? (permissions as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
      select: { id: true, email: true, name: true, role: true, permissions: true },
    });

    await logAdminAction(req.user!.userId, "add_admin", user.id, { email });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function updatePermissions(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, permissions } = req.body as { userId: string; permissions: Record<string, boolean> };
    if (!userId || !permissions) throw new BadRequestError("userId and permissions are required");

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) throw new NotFoundError("User not found");
    if (target.role === "SUPER_ADMIN") throw new ForbiddenError("Cannot modify SUPER_ADMIN permissions");

    const user = await prisma.user.update({
      where: { id: userId },
      data: { permissions },
      select: { id: true, email: true, role: true, permissions: true },
    });

    await logAdminAction(req.user!.userId, "update_permissions", userId, { permissions });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params["id"] as string;
    if (id === req.user!.userId) throw new BadRequestError("Cannot delete yourself");

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundError("User not found");
    if (target.role === "SUPER_ADMIN") throw new ForbiddenError("Cannot delete a SUPER_ADMIN");

    await prisma.user.delete({ where: { id } });
    await logAdminAction(req.user!.userId, "delete_user", id, { email: target.email });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function logAdminAction(adminId: string, action: string, targetId?: string, details?: object) {
  await prisma.adminLog.create({ data: { adminId, action, targetId, details } }).catch(() => {});
}
