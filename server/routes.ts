import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  videoGenerationRequestSchema, 
  videoStatusSchema,
  errorResponseSchema 
} from "@shared/schema";
import { ZodError } from "zod";

// HeyGen API integration for avatar video generation
async function generateVideoWithHeyGen(prompt: string, duration: number): Promise<{ taskId: string }> {
  const heygenApiKey = process.env.HEYGEN_API_KEY || "";
  
  if (!heygenApiKey) {
    throw new Error("HeyGen API key not configured. Please set HEYGEN_API_KEY environment variable.");
  }

  const payload = {
    video_inputs: [
      {
        character: {
          type: "avatar",
          avatar_id: "Daisy-inskirt-20220818",
          avatar_style: "normal"
        },
        voice: {
          type: "text",
          input_text: prompt,
          voice_id: "2d5b0e6cf36f460aa7fc47e3eee4ba54"
        },
        background: {
          type: "color",
          value: "#667eea"
        }
      }
    ],
    dimension: {
      width: 1280,
      height: 720
    },
    caption: false
  };

  const response = await fetch("https://api.heygen.com/v2/video/generate", {
    method: "POST",
    headers: {
      "X-Api-Key": heygenApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HeyGen API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return { taskId: data.data.video_id };
}

// Demo video generation (for testing without API keys)
async function generateDemoVideo(prompt: string, duration: number): Promise<{ taskId: string; videoUrl: string }> {
  // Simulate video generation with a placeholder
  const taskId = `demo-${Date.now()}`;
  
  // Create a simple placeholder "video" (actually an SVG converted to data URL)
  const svg = `<svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <text x="640" y="300" font-family="Arial, sans-serif" font-size="32" fill="white" text-anchor="middle">AI Video Demo</text>
    <text x="640" y="360" font-family="Arial, sans-serif" font-size="24" fill="#f0f0f0" text-anchor="middle">Prompt: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}</text>
    <text x="640" y="420" font-family="Arial, sans-serif" font-size="20" fill="#d0d0d0" text-anchor="middle">Duration: ${duration} seconds</text>
    <text x="640" y="480" font-family="Arial, sans-serif" font-size="16" fill="#b0b0b0" text-anchor="middle">This is a demo placeholder. Add API keys for real video generation.</text>
  </svg>`;
  
  const videoUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  
  return { taskId, videoUrl };
}

async function checkHeyGenVideoStatus(taskId: string): Promise<any> {
  const heygenApiKey = process.env.HEYGEN_API_KEY || "";
  
  const response = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${taskId}`, {
    headers: {
      "X-Api-Key": heygenApiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HeyGen status check error: ${response.status} - ${errorText}`);
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
      
      if (model === "heygen") {
        const heygenStatus = await checkHeyGenVideoStatus(taskId);
        
        switch (heygenStatus.data?.status) {
          case "completed":
            status = "completed";
            videoUrl = heygenStatus.data?.video_url;
            thumbnailUrl = heygenStatus.data?.thumbnail_url;
            break;
          case "failed":
            status = "failed";
            await storage.updateVideoStatus(videoId, {
              status: "failed",
              error: heygenStatus.data?.error || "Video generation failed"
            });
            return;
          case "processing":
          case "pending":
          default:
            status = "processing";
            break;
        }
      } else {
        throw new Error("Unsupported video generation model");
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
        let result: { taskId: string; videoUrl?: string };
        
        if (validatedData.model === "heygen") {
          const heygenResult = await generateVideoWithHeyGen(validatedData.prompt, parseInt(validatedData.duration));
          result = { taskId: heygenResult.taskId };
        } else if (validatedData.model === "demo") {
          result = await generateDemoVideo(validatedData.prompt, parseInt(validatedData.duration));
        } else {
          // Default fallback to demo mode
          console.log("Unknown model, using demo mode...");
          result = await generateDemoVideo(validatedData.prompt, parseInt(validatedData.duration));
        }
        
        taskId = result.taskId;
        
        // If we got a videoUrl immediately (Gemini or demo), complete the video right away
        if (result.videoUrl) {
          await storage.updateVideoResult(video.id, {
            status: "completed",
            videoUrl: result.videoUrl,
            metadata: {
              resolution: "1080p",
              format: validatedData.model === "demo" ? "svg" : "jpg"
            }
          });
          
          await storage.updateVideoStatus(video.id, {
            status: "completed",
            progress: 100,
            message: "Video generation completed successfully"
          });
          
          res.json({...video, status: "completed", videoUrl: result.videoUrl});
          return;
        }

        // Update status to processing
        await storage.updateVideoStatus(video.id, {
          status: "processing",
          progress: 10,
          message: "Video generation started"
        });

        // Start background polling for HeyGen
        if (validatedData.model === "heygen") {
          pollVideoStatus(video.id, taskId, validatedData.model);
        }

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
    const hasHeyGenKey = !!process.env.HEYGEN_API_KEY;
    
    res.json({
      status: "ok",
      apiConnected: hasHeyGenKey,
      models: {
        heygen: hasHeyGenKey,
        demo: true // Always available
      }
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
