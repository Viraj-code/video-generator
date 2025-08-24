# AI Video Generator

A modern, full-stack web application that transforms text prompts into professional AI-generated videos using cutting-edge artificial intelligence technology.

## 🎯 What It Does

This application enables users to create high-quality videos from simple text descriptions. Whether you need content for social media, presentations, or marketing materials, the AI Video Generator makes video creation accessible to everyone.

**Key Features:**
- **Text-to-Video Generation**: Convert written descriptions into dynamic video content
- **Professional AI Avatars**: Create videos featuring realistic AI presenters
- **Real-time Processing**: Monitor generation progress with live status updates
- **HD Quality Output**: Generate videos in 1280x720 resolution
- **Instant Preview**: Watch and download your videos immediately
- **Responsive Design**: Works seamlessly across desktop and mobile devices

## 🚀 How It Works

1. **Enter Your Prompt**: Describe what you want your video to show
2. **Choose Duration**: Select 5 or 10-second video length
3. **Select Generation Mode**: Pick between Demo mode or AI Avatar generation
4. **Generate**: Watch as AI creates your custom video
5. **Download & Share**: Save your video or share it directly

## 🛠 Technology Stack

### Frontend
- **React 18** with TypeScript for robust UI development
- **Tailwind CSS** for modern, responsive styling
- **Shadcn/UI** components for professional design consistency
- **React Query** for efficient data fetching and caching
- **React Hook Form** with Zod validation for type-safe forms
- **Wouter** for lightweight client-side routing

### Backend
- **Node.js** with Express.js for scalable server architecture
- **TypeScript** for end-to-end type safety
- **RESTful API** design with comprehensive error handling
- **Real-time status polling** for live generation updates
- **In-memory storage** for fast development and testing

### AI Integration
- **HeyGen API** for professional avatar video generation
- **Advanced AI Models** for natural voice synthesis and realistic avatars
- **Asynchronous Processing** with background job management
- **Fallback Systems** ensuring reliable service delivery

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ installed on your system
- HeyGen API key (free tier available with 10 credits)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-video-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   Create a `.env` file in the root directory:
   ```env
   HEYGEN_API_KEY=your_api_key_here
   NODE_ENV=development
   ```

   **Getting your HeyGen API Key:**
   - Visit [HeyGen](https://heygen.com) and create a free account
   - Navigate to your dashboard settings
   - Generate an API key (comes with 10 free credits)
   - Copy the key to your `.env` file

4. **Start the application**
   ```bash
   npm run dev
   ```

5. **Access the app**
   Open your browser to `http://localhost:5000`

## 🎮 Usage Guide

### Demo Mode
Perfect for testing the application without using API credits:
- Instant generation with concept visualization
- Shows the complete workflow
- No API key required

### HeyGen AI Avatar Mode
Professional video generation with AI presenters:
- High-quality avatar videos with natural voice synthesis
- 1280x720 HD resolution
- Uses your HeyGen API credits (10 free included)
- Processing time: 30-60 seconds

### Example Prompts
- "Welcome to our new product launch presentation"
- "Introduce the benefits of sustainable energy solutions"
- "Explain the features of our mobile application"
- "Share the latest company news and updates"

## 🏗 Architecture Overview

The application follows a modern full-stack architecture:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Client  │ ←→ │  Express Server  │ ←→ │   HeyGen API    │
│                 │    │                  │    │                 │
│ • Video Player  │    │ • REST Routes    │    │ • Avatar Gen    │
│ • Form Controls │    │ • Status Polling │    │ • Voice Synth   │
│ • Real-time UI  │    │ • Error Handling │    │ • HD Rendering  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Key Components
- **Video Generator**: Main interface for prompt input and model selection
- **Video Player**: Custom player with download and sharing capabilities
- **Status Tracker**: Real-time progress monitoring with polling
- **API Layer**: Typed endpoints with comprehensive error handling

## 🔧 API Reference

### Health Check
```http
GET /api/health
```
Returns service status and available models.

### Generate Video
```http
POST /api/videos/generate
Content-Type: application/json

{
  "prompt": "Your video description",
  "duration": "5",
  "model": "heygen"
}
```

### Check Status
```http
GET /api/videos/{id}/status
```
Returns current generation progress and status.

### Get Video
```http
GET /api/videos/{id}
```
Returns complete video data including download URL.

## 🚀 Deployment

The application is designed for easy deployment to any cloud platform:

### Build for Production
```bash
npm run build
```

### Environment Variables
Ensure these variables are set in your production environment:
- `HEYGEN_API_KEY`: Your HeyGen API authentication key
- `NODE_ENV`: Set to `production`
- `PORT`: Server port (default: 5000)

### Recommended Platforms
- **Vercel**: Seamless deployment with automatic builds
- **Railway**: Full-stack hosting with database support
- **Render**: Static sites and web services
- **AWS/GCP/Azure**: Enterprise-grade cloud deployment

## 📊 Performance & Limits

### Processing Times
- **Demo Mode**: Instant generation
- **HeyGen Avatar**: 30-60 seconds for HD quality

### API Limits
- **Free Tier**: 10 video generations per month
- **Rate Limits**: Managed automatically by the application
- **Video Length**: 5-10 seconds per generation
- **Resolution**: 1280x720 (HD quality)

## 🔒 Security Features

- **API Key Protection**: Server-side key storage with no client exposure
- **Request Validation**: Comprehensive input sanitization
- **Error Handling**: Graceful failure management
- **CORS Configuration**: Secure cross-origin request handling

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes with proper TypeScript typing
4. Test thoroughly across different scenarios
5. Submit a pull request with a clear description

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For technical support or feature requests:
- Check the documentation above
- Review the API error messages for troubleshooting
- Ensure your HeyGen API key is valid and has remaining credits
- Verify your internet connection for API calls

## 🎉 Acknowledgments

Built with cutting-edge AI technology to democratize video creation. Special thanks to the HeyGen team for providing powerful avatar generation capabilities.

---

**Ready to create your first AI video?** Start the application and enter your first prompt!