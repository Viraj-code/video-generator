import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";

// Video generation request schema
export const videoGenerationRequestSchema = z.object({
  prompt: z.string().min(10, "Prompt must be at least 10 characters").max(500, "Prompt must be less than 500 characters"),
  duration: z.enum(["5", "10"]).default("5"),
  model: z.enum(["luma", "gemini", "demo"]).default("demo"),
});

// Video generation response schema
export const videoGenerationResponseSchema = z.object({
  id: z.string(),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  videoUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  prompt: z.string(),
  duration: z.number(),
  model: z.string(),
  createdAt: z.string(),
  metadata: z.object({
    resolution: z.string().optional(),
    fileSize: z.string().optional(),
    format: z.string().optional(),
  }).optional(),
});

// Video generation status schema
export const videoStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  progress: z.number().min(0).max(100).optional(),
  message: z.string().optional(),
  error: z.string().optional(),
});

export type VideoGenerationRequest = z.infer<typeof videoGenerationRequestSchema>;
export type VideoGenerationResponse = z.infer<typeof videoGenerationResponseSchema>;
export type VideoStatus = z.infer<typeof videoStatusSchema>;

// Error response schema
export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.any().optional(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
