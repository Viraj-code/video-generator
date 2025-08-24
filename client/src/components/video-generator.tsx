import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { VideoPlayer } from "./video-player";
import { videoApi } from "@/lib/api";
import { videoGenerationRequestSchema } from "@shared/schema";
import type { VideoGenerationRequest, VideoGenerationResponse, VideoStatus } from "@shared/schema";
import { AlertCircle, CheckCircle2, Clock, Wand2, Info, Wifi } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function VideoGenerator() {
  const [currentVideo, setCurrentVideo] = useState<VideoGenerationResponse | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<VideoGenerationRequest>({
    resolver: zodResolver(videoGenerationRequestSchema),
    defaultValues: {
      prompt: "",
      duration: "5",
      model: "demo"
    }
  });

  // Health check query
  const { data: healthStatus } = useQuery<{
    status: string;
    apiConnected: boolean;
    models: { heygen: boolean; demo: boolean };
  }>({
    queryKey: ["/api/health"],
    refetchInterval: 30000
  });

  // Video status query (only when polling)
  const { data: videoStatus } = useQuery<VideoStatus>({
    queryKey: ["/api/videos", currentVideo?.id, "status"],
    enabled: isPolling && !!currentVideo?.id,
    refetchInterval: false
  });

  // Generation mutation
  const generateMutation = useMutation({
    mutationFn: videoApi.generateVideo,
    onSuccess: (data) => {
      setCurrentVideo(data);
      setIsPolling(true);
      toast({
        title: "Generation Started",
        description: "Your video is being generated. This may take a few minutes.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to start video generation",
        variant: "destructive",
      });
    }
  });

  // Status polling mutation
  const statusMutation = useMutation({
    mutationFn: (id: string) => videoApi.getVideoStatus(id),
    onSuccess: (status: VideoStatus) => {
      if (status.status === "completed") {
        setIsPolling(false);
        // Fetch the complete video data
        queryClient.invalidateQueries({ queryKey: ["/api/videos", currentVideo?.id] });
        fetchCompletedVideo(currentVideo!.id);
        toast({
          title: "Video Ready!",
          description: "Your AI-generated video is ready to view and download.",
        });
      } else if (status.status === "failed") {
        setIsPolling(false);
        toast({
          title: "Generation Failed",
          description: status.error || "Video generation failed",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error("Status check failed:", error);
      setIsPolling(false);
      toast({
        title: "Status Check Failed",
        description: "Unable to check video status. Please refresh and try again.",
        variant: "destructive",
      });
    }
  });

  const fetchCompletedVideo = async (id: string) => {
    try {
      const completedVideo = await videoApi.getVideo(id);
      setCurrentVideo(completedVideo);
    } catch (error) {
      console.error("Failed to fetch completed video:", error);
    }
  };

  // Polling effect
  useEffect(() => {
    if (isPolling && currentVideo?.id) {
      const interval = setInterval(() => {
        statusMutation.mutate(currentVideo.id);
      }, 3000);
      setPollingInterval(interval);
      return () => clearInterval(interval);
    } else {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    }
  }, [isPolling, currentVideo?.id]);

  const onSubmit = (data: VideoGenerationRequest) => {
    generateMutation.mutate(data);
  };

  const resetForm = () => {
    form.reset();
    setCurrentVideo(null);
    setIsPolling(false);
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  const promptValue = form.watch("prompt");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 -mx-4 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Wand2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Video Generator</h1>
                <p className="text-sm text-gray-600">Powered by HeyGen AI Avatar Technology</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${healthStatus?.apiConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {healthStatus?.apiConnected ? 'API Connected' : 'API Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prompt Input Section */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Create Your Video</h2>
            <p className="text-gray-600">Describe what you want to see in your AI-generated video</p>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video Prompt</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="e.g., A cute cat dancing in the rain under colorful umbrellas, cinematic lighting, 4k quality"
                        className="resize-none"
                        rows={4}
                        data-testid="textarea-prompt"
                        {...field}
                      />
                    </FormControl>
                    <div className="flex justify-between items-center text-sm">
                      <p className="text-gray-600">Be specific for better results</p>
                      <span className="text-gray-500">{promptValue?.length || 0}/500</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-duration">
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="5">5 seconds</SelectItem>
                          <SelectItem value="10">10 seconds</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AI Model</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-model">
                            <SelectValue placeholder="Select model" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="demo">Demo Mode (No API needed)</SelectItem>
                          <SelectItem value="heygen">HeyGen AI Avatar Videos</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary text-white hover:bg-primary/90 py-4"
                disabled={generateMutation.isPending || isPolling}
                data-testid="button-generate"
              >
                {generateMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Starting Generation...
                  </>
                ) : isPolling ? (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Video
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Status Section */}
      {isPolling && videoStatus && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <LoadingSpinner className="text-yellow-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">Generating Your Video</h3>
                <p className="text-gray-600 mt-1" data-testid="text-status-message">
                  {videoStatus.message || "Processing your request... This may take 30-60 seconds"}
                </p>
                <div className="mt-4">
                  <Progress 
                    value={videoStatus.progress || 0} 
                    className="w-full"
                    data-testid="progress-generation"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {videoStatus.progress || 0}% complete
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Section */}
      {generateMutation.isError && (
        <Card className="border-red-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">Generation Failed</h3>
                <p className="text-gray-600 mt-1" data-testid="text-error-message">
                  {generateMutation.error?.message || "We encountered an issue generating your video. Please try again."}
                </p>
                <div className="mt-4">
                  <Button 
                    onClick={() => generateMutation.reset()}
                    variant="outline"
                    data-testid="button-retry"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Video Display Section */}
      {currentVideo && currentVideo.status === "completed" && currentVideo.videoUrl && (
        <VideoPlayer 
          video={currentVideo} 
          onGenerateAnother={resetForm}
        />
      )}

      {/* API Info Section */}
      <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <Info className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">Free Tier Information</h3>
              <div className="mt-2 space-y-2 text-sm text-gray-700">
                <p><strong>Demo Mode:</strong> Instant generation with concept visualization - works without API keys</p>
                <p><strong>HeyGen AI:</strong> Professional avatar videos with your text spoken by AI avatars (10 free credits)</p>
                <p><strong>Video Quality:</strong> 1280x720 HD resolution with natural voice synthesis</p>
                <p><strong>Processing Time:</strong> Demo: Instant, HeyGen: 30-60 seconds</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-white/50 text-primary text-sm font-medium rounded-full">
                  <Clock className="w-3 h-3 mr-1 inline" />
                  Fast Processing
                </span>
                <span className="px-3 py-1 bg-white/50 text-primary text-sm font-medium rounded-full">
                  <CheckCircle2 className="w-3 h-3 mr-1 inline" />
                  HD Quality
                </span>
                <span className="px-3 py-1 bg-white/50 text-primary text-sm font-medium rounded-full">
                  <Wifi className="w-3 h-3 mr-1 inline" />
                  Secure API
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
