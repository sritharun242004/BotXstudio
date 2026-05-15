import { z } from "zod";

const configFields = {
  occasionPreset: z.string().optional(),
  occasionDetails: z.string().optional(),
  accessories: z.string().optional(),
  bottomWearPreset: z.string().optional(),
  bottomWearDetails: z.string().optional(),
  printInputKind: z.enum(["image", "color"]).optional(),
  printColorHex: z.string().optional(),
  printAdditionalPrompt: z.string().optional(),
  printTargetGender: z.enum(["Male", "Female"]).optional(),
  printGarmentCategory: z.string().optional(),
  footwearPreset: z.string().optional(),
  footwearDetails: z.string().optional(),
  stylePreset: z.string().optional(),
  styleKeywordsDetails: z.string().optional(),
  backgroundThemePreset: z.string().optional(),
  backgroundThemeDetails: z.string().optional(),
  modelPreset: z.string().optional(),
  modelDetails: z.string().optional(),
  modelPosePreset: z.string().optional(),
  modelPoseDetails: z.string().optional(),
  modelStylingPreset: z.string().optional(),
  modelStylingNotes: z.string().optional(),
};

export const createStoryboardSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  garmentType: z.string().max(100).optional(),
  previewUrl: z.string().optional(),
  ...configFields,
});

export const updateStoryboardSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  garmentType: z.string().max(100).optional(),
  previewUrl: z.string().nullable().optional(),
  ...configFields,
});

export type CreateStoryboardInput = z.infer<typeof createStoryboardSchema>;
export type UpdateStoryboardInput = z.infer<typeof updateStoryboardSchema>;
