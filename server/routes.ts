import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  videoGenerationRequestSchema, 
  videoStatusSchema,
  errorResponseSchema 
} from "@shared/schema";
import { ZodError } from "zod";

// Luma Dream Machine API integration
async function generateVideoWithLuma(prompt: string, duration: number): Promise<{ taskId: string }> {
  const lumaApiKey = process.env.LUMA_API_KEY || process.env.DREAM_MACHINE_API_KEY || "";
  
  if (!lumaApiKey) {
    throw new Error("Luma API key not configured. Please set LUMA_API_KEY or DREAM_MACHINE_API_KEY environment variable.");
  }

  const response = await fetch("https://api.lumalabs.ai/dream-machine/v1/generations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${lumaApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      aspect_ratio: "16:9",
      // Use text-to-video for this implementation
      generation_type: "text_to_video"
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Luma API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return { taskId: data.id };
}

async function checkLumaVideoStatus(taskId: string): Promise<any> {
  const lumaApiKey = process.env.LUMA_API_KEY || process.env.DREAM_MACHINE_API_KEY || "";
  
  const response = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations/${taskId}`, {
    headers: {
      "Authorization": `Bearer ${lumaApiKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Luma status check error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

// Background job to poll video status
async function pollVideoStatus(videoId: string, taskId: string, model: string) {
  const maxAttempts = 60; // 5 minutes with 5-second intervals
  let attempts = 0;

  const poll = async () => {
    attempts++;
    
    try {
      let status;
      let videoUrl;
      let thumbnailUrl;
      
      if (model === "luma") {
        const lumaStatus = await checkLumaVideoStatus(taskId);
        
        switch (lumaStatus.state) {
          case "completed":
            status = "completed";
            videoUrl = lumaStatus.assets?.video;
            break;
          case "failed":
            status = "failed";
            await storage.updateVideoStatus(videoId, {
              status: "failed",
              error: lumaStatus.failure_reason || "Video generation failed"
            });
            return;
          case "processing":
          case "queued":
          default:
            status = "processing";
            break;
        }
      } else {
        // For Pika Labs or other models, implement respective API calls
        throw new Error("Pika Labs integration not yet implemented");
      }

      if (status === "completed" && videoUrl) {
        await storage.updateVideoResult(videoId, {
          status: "completed",
          videoUrl,
          thumbnailUrl,
          metadata: {
            resolution: "1080p",
            format: "mp4"
          }
        });
        
        await storage.updateVideoStatus(videoId, {
          status: "completed",
          progress: 100,
          message: "Video generation completed successfully"
        });
        return;
      }

      if (status === "processing" && attempts < maxAttempts) {
        const progress = Math.min(95, (attempts / maxAttempts) * 100);
        await storage.updateVideoStatus(videoId, {
          status: "processing",
          progress,
          message: "Generating video... This may take a few minutes"
        });
        
        // Continue polling
        setTimeout(poll, 5000);
      } else if (attempts >= maxAttempts) {
        await storage.updateVideoStatus(videoId, {
          status: "failed",
          error: "Video generation timed out"
        });
      }
    } catch (error) {
      console.error("Error polling video status:", error);
      await storage.updateVideoStatus(videoId, {
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  };

  // Start polling after a short delay
  setTimeout(poll, 2000);
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Generate video endpoint
  app.post("/api/videos/generate", async (req, res) => {
    try {
      const validatedData = videoGenerationRequestSchema.parse(req.body);
      
      // Store initial video generation request
      const video = await storage.storeVideoGeneration({
        prompt: validatedData.prompt,
        duration: parseInt(validatedData.duration),
        model: validatedData.model,
        status: "pending",
        createdAt: new Date().toISOString(),
      });

      // Start video generation based on selected model
      let taskId: string;
      
      try {
        if (validatedData.model === "luma") {
          const result = await generateVideoWithLuma(
            validatedData.prompt, 
            parseInt(validatedData.duration)
          );
          taskId = result.taskId;
        } else {
          throw new Error("Pika Labs integration not yet implemented. Please use Luma Dream Machine.");
        }

        // Update status to processing
        await storage.updateVideoStatus(video.id, {
          status: "processing",
          progress: 10,
          message: "Video generation started"
        });

        // Start background polling
        pollVideoStatus(video.id, taskId, validatedData.model);

        res.json(video);
      } catch (apiError) {
        // Update status to failed
        await storage.updateVideoStatus(video.id, {
          status: "failed",
          error: apiError instanceof Error ? apiError.message : "API error occurred"
        });
        
        throw apiError;
      }
      
    } catch (error) {
      console.error("Video generation error:", error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Validation Error",
          message: "Invalid request data",
          details: error.errors
        });
      }
      
      res.status(500).json({
        error: "Generation Failed", 
        message: error instanceof Error ? error.message : "Failed to start video generation"
      });
    }
  });

  // Get video status endpoint
  app.get("/api/videos/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const status = await storage.getVideoStatus(id);
      
      if (!status) {
        return res.status(404).json({
          error: "Not Found",
          message: "Video not found"
        });
      }
      
      res.json(status);
    } catch (error) {
      console.error("Status check error:", error);
      res.status(500).json({
        error: "Status Check Failed",
        message: "Failed to check video status"
      });
    }
  });

  // Get video details endpoint
  app.get("/api/videos/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const video = await storage.getVideoGeneration(id);
      
      if (!video) {
        return res.status(404).json({
          error: "Not Found",
          message: "Video not found"
        });
      }
      
      res.json(video);
    } catch (error) {
      console.error("Video fetch error:", error);
      res.status(500).json({
        error: "Fetch Failed",
        message: "Failed to fetch video details"
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    const hasLumaKey = !!(process.env.LUMA_API_KEY || process.env.DREAM_MACHINE_API_KEY);
    
    res.json({
      status: "ok",
      apiConnected: hasLumaKey,
      models: {
        luma: hasLumaKey,
        pika: false // Not implemented yet
      }
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
