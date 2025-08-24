import { randomUUID } from "crypto";
import type { VideoGenerationResponse, VideoStatus } from "@shared/schema";

export interface IStorage {
  // Video generation storage methods
  storeVideoGeneration(video: Omit<VideoGenerationResponse, "id">): Promise<VideoGenerationResponse>;
  getVideoGeneration(id: string): Promise<VideoGenerationResponse | undefined>;
  updateVideoStatus(id: string, status: Partial<VideoStatus>): Promise<void>;
  getVideoStatus(id: string): Promise<VideoStatus | undefined>;
  updateVideoResult(id: string, result: Partial<VideoGenerationResponse>): Promise<void>;
}

export class MemStorage implements IStorage {
  private videos: Map<string, VideoGenerationResponse>;
  private videoStatuses: Map<string, VideoStatus>;

  constructor() {
    this.videos = new Map();
    this.videoStatuses = new Map();
  }

  async storeVideoGeneration(video: Omit<VideoGenerationResponse, "id">): Promise<VideoGenerationResponse> {
    const id = randomUUID();
    const videoWithId: VideoGenerationResponse = { ...video, id };
    this.videos.set(id, videoWithId);
    
    // Initialize status
    const status: VideoStatus = {
      id,
      status: video.status,
      progress: 0,
      message: "Video generation started"
    };
    this.videoStatuses.set(id, status);
    
    return videoWithId;
  }

  async getVideoGeneration(id: string): Promise<VideoGenerationResponse | undefined> {
    return this.videos.get(id);
  }

  async updateVideoStatus(id: string, statusUpdate: Partial<VideoStatus>): Promise<void> {
    const currentStatus = this.videoStatuses.get(id);
    if (currentStatus) {
      const updatedStatus = { ...currentStatus, ...statusUpdate };
      this.videoStatuses.set(id, updatedStatus);
    }
  }

  async getVideoStatus(id: string): Promise<VideoStatus | undefined> {
    return this.videoStatuses.get(id);
  }

  async updateVideoResult(id: string, result: Partial<VideoGenerationResponse>): Promise<void> {
    const currentVideo = this.videos.get(id);
    if (currentVideo) {
      const updatedVideo = { ...currentVideo, ...result };
      this.videos.set(id, updatedVideo);
    }
  }
}

export const storage = new MemStorage();
