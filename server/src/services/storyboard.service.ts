import { PrismaClient } from "@prisma/client";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";
import type {
  CreateStoryboardInput,
  UpdateStoryboardInput,
} from "../validators/storyboard.validators.js";

const prisma = new PrismaClient();

// Config fields that map from camelCase input to Prisma column names
const CONFIG_FIELDS = [
  "occasionPreset",
  "occasionDetails",
  "accessories",
  "bottomWearPreset",
  "bottomWearDetails",
  "printInputKind",
  "printColorHex",
  "printAdditionalPrompt",
  "printTargetGender",
  "printGarmentCategory",
  "footwearPreset",
  "footwearDetails",
  "stylePreset",
  "styleKeywordsDetails",
  "backgroundThemePreset",
  "backgroundThemeDetails",
  "modelPreset",
  "modelDetails",
  "modelPosePreset",
  "modelPoseDetails",
  "modelStylingPreset",
  "modelStylingNotes",
] as const;

function extractConfigData(input: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  for (const field of CONFIG_FIELDS) {
    if (field in input && input[field] !== undefined) {
      data[field] = input[field];
    }
  }
  return data;
}

/** Shape a storyboard row into a response with nested config */
function toResponse(sb: Record<string, unknown>) {
  const config: Record<string, unknown> = {};
  for (const field of CONFIG_FIELDS) {
    config[field] = sb[field] ?? "";
  }
  return {
    id: sb.id,
    userId: sb.userId,
    title: sb.title,
    garmentType: sb.garmentType,
    isActive: sb.isActive,
    previewUrl: sb.previewUrl,
    createdAt: sb.createdAt,
    updatedAt: sb.updatedAt,
    config,
  };
}

export async function create(userId: string, input: CreateStoryboardInput) {
  const { title, garmentType, previewUrl, ...rest } = input;
  const configData = extractConfigData(rest);

  const sb = await prisma.storyboard.create({
    data: {
      userId,
      title: title || "New storyboard",
      garmentType: garmentType || "",
      previewUrl: previewUrl || null,
      ...configData,
    },
  });

  return toResponse(sb as unknown as Record<string, unknown>);
}

export async function list(userId: string) {
  const storyboards = await prisma.storyboard.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  return storyboards.map((sb) => toResponse(sb as unknown as Record<string, unknown>));
}

export async function getById(userId: string, id: string) {
  const sb = await prisma.storyboard.findUnique({ where: { id } });
  if (!sb) throw new NotFoundError("Storyboard not found");
  if (sb.userId !== userId) throw new ForbiddenError();
  return toResponse(sb as unknown as Record<string, unknown>);
}

export async function update(userId: string, id: string, input: UpdateStoryboardInput) {
  const sb = await prisma.storyboard.findUnique({ where: { id } });
  if (!sb) throw new NotFoundError("Storyboard not found");
  if (sb.userId !== userId) throw new ForbiddenError();

  const { title, garmentType, previewUrl, ...rest } = input;
  const configData = extractConfigData(rest);

  const data: Record<string, unknown> = { ...configData };
  if (title !== undefined) data.title = title;
  if (garmentType !== undefined) data.garmentType = garmentType;
  if (previewUrl !== undefined) data.previewUrl = previewUrl;

  const updated = await prisma.storyboard.update({
    where: { id },
    data,
  });

  return toResponse(updated as unknown as Record<string, unknown>);
}

export async function remove(userId: string, id: string) {
  const sb = await prisma.storyboard.findUnique({ where: { id } });
  if (!sb) throw new NotFoundError("Storyboard not found");
  if (sb.userId !== userId) throw new ForbiddenError();

  await prisma.storyboard.delete({ where: { id } });
}

export async function duplicate(userId: string, id: string) {
  const sb = await prisma.storyboard.findUnique({ where: { id } });
  if (!sb) throw new NotFoundError("Storyboard not found");
  if (sb.userId !== userId) throw new ForbiddenError();

  // Extract all config fields from existing storyboard
  const configData: Record<string, unknown> = {};
  for (const field of CONFIG_FIELDS) {
    configData[field] = (sb as unknown as Record<string, unknown>)[field];
  }

  const clone = await prisma.storyboard.create({
    data: {
      userId,
      title: `${sb.title} (copy)`,
      garmentType: sb.garmentType,
      previewUrl: sb.previewUrl,
      ...configData,
    },
  });

  return toResponse(clone as unknown as Record<string, unknown>);
}

export async function setActive(userId: string, id: string) {
  const sb = await prisma.storyboard.findUnique({ where: { id } });
  if (!sb) throw new NotFoundError("Storyboard not found");
  if (sb.userId !== userId) throw new ForbiddenError();

  // Deactivate all, then activate the target
  await prisma.$transaction([
    prisma.storyboard.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    }),
    prisma.storyboard.update({
      where: { id },
      data: { isActive: true },
    }),
  ]);

  return toResponse({ ...sb, isActive: true } as unknown as Record<string, unknown>);
}
