import { apiRequest } from "./queryClient";
import type { 
  VideoGenerationRequest, 
  VideoGenerationResponse, 
  VideoStatus 
} from "@shared/schema";

export const videoApi = {
  // Generate a new video
  generateVideo: async (request: VideoGenerationRequest): Promise<VideoGenerationResponse> => {
    const response = await apiRequest("POST", "/api/videos/generate", request);
    return await response.json();
  },

  // Get video status
  getVideoStatus: async (id: string): Promise<VideoStatus> => {
    const response = await apiRequest("GET", `/api/videos/${id}/status`);
    return await response.json();
  },

  // Get video details
  getVideo: async (id: string): Promise<VideoGenerationResponse> => {
    const response = await apiRequest("GET", `/api/videos/${id}`);
    return await response.json();
  },

  // Health check
  getHealth: async () => {
    const response = await apiRequest("GET", "/api/health");
    return await response.json();
  }
};
