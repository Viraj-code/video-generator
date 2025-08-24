import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Share2, RotateCcw, Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import type { VideoGenerationResponse } from "@shared/schema";

interface VideoPlayerProps {
  video: VideoGenerationResponse;
  onGenerateAnother: () => void;
}

export function VideoPlayer({ video, onGenerateAnother }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const downloadVideo = async () => {
    if (video.videoUrl) {
      try {
        const response = await fetch(video.videoUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-video-${video.id}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Download failed:', error);
      }
    }
  };

  const shareVideo = async () => {
    if (navigator.share && video.videoUrl) {
      try {
        await navigator.share({
          title: 'AI Generated Video',
          text: video.prompt,
          url: video.videoUrl
        });
      } catch (error) {
        // Fallback: copy URL to clipboard
        navigator.clipboard.writeText(video.videoUrl);
      }
    } else if (video.videoUrl) {
      navigator.clipboard.writeText(video.videoUrl);
    }
  };

  if (!video.videoUrl) {
    return null;
  }

  return (
    <Card className="overflow-hidden" data-testid="video-player">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Generated Video</h3>
            <p className="text-sm text-gray-600 mt-1" data-testid="video-prompt">
              {video.prompt}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full inline-block mr-1"></span>
              Complete
            </span>
          </div>
        </div>
      </div>
      
      <div 
        className="relative bg-black group"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <video 
          ref={videoRef}
          className="w-full h-auto max-h-96" 
          preload="metadata"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          data-testid="video-element"
          playsInline
        >
          <source src={video.videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Custom video controls overlay */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <div className="bg-black bg-opacity-50 rounded-lg p-4 flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlay}
              className="text-white hover:text-gray-300"
              data-testid="button-play-pause"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="text-white hover:text-gray-300"
              data-testid="button-mute"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white hover:text-gray-300"
              data-testid="button-fullscreen"
            >
              <Maximize className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Download button overlay */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="secondary"
            size="sm"
            onClick={downloadVideo}
            className="bg-black bg-opacity-50 text-white hover:bg-opacity-70"
            data-testid="button-download-overlay"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <CardContent className="p-6 bg-gray-50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
          <div>
            <span className="block text-gray-600">Duration</span>
            <span className="font-medium" data-testid="text-duration">{video.duration} seconds</span>
          </div>
          <div>
            <span className="block text-gray-600">Resolution</span>
            <span className="font-medium" data-testid="text-resolution">
              {video.metadata?.resolution || "1080p"}
            </span>
          </div>
          <div>
            <span className="block text-gray-600">Model</span>
            <span className="font-medium capitalize" data-testid="text-model">{video.model}</span>
          </div>
          <div>
            <span className="block text-gray-600">Format</span>
            <span className="font-medium" data-testid="text-format">
              {video.metadata?.format || "MP4"}
            </span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={downloadVideo}
            className="flex-1 bg-primary text-white hover:bg-primary/90"
            data-testid="button-download"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Video
          </Button>
          <Button 
            variant="outline"
            onClick={shareVideo}
            className="flex-1"
            data-testid="button-share"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button 
            variant="outline"
            onClick={onGenerateAnother}
            data-testid="button-generate-another"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Generate Another
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
