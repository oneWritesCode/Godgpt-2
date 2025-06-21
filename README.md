# 🧠 GodGPT - God of All GPTs

> A powerful, feature-rich chat application providing seamless access to 18+ Large Language Models through a single, elegant interface.

![image](https://github.com/user-attachments/assets/784951cf-a05c-4778-8fe9-3ccb933d5736)

![image](https://github.com/user-attachments/assets/4a4a3466-8362-4feb-9259-190c12197b24)

![image](https://github.com/user-attachments/assets/71f5fd58-b300-46cb-a490-31e40cca32f2)

![image](https://github.com/user-attachments/assets/6bfbea90-c11a-4b42-85e3-3b9b3d80fc20)

https://github.com/user-attachments/assets/2c3026e2-e4d9-45fa-8f76-5ad923befef4

![image](https://github.com/user-attachments/assets/aaeec274-fb19-4ed7-ad06-05930a777bcc)

![image](https://github.com/user-attachments/assets/c0bb053a-dc81-4603-979d-82c22c1ad7e7)

![image](https://github.com/user-attachments/assets/a70b4762-0200-4b7c-a591-9854d24c1731)

![image](https://github.com/user-attachments/assets/9272f784-fcb8-4d0a-ad72-328721e6fb96)

![image](https://github.com/user-attachments/assets/1ee0266f-46ef-40b8-8d1a-a6b380e5a6b2)


## 🚀 Project Overview

GodGPT is a modern, production-ready chat application that unifies access to the world's most powerful AI models. Built with cutting-edge web technologies and designed for both developers and end-users, it offers a comprehensive solution for AI-powered conversations with advanced features like real-time sync, offline capabilities, and intelligent model fallbacks.

## ✨ What Makes GodGPT Special

- **18+ AI Models**: Access to the latest models from OpenAI, Anthropic, Google, Meta, DeepSeek, and more
- **Multi MOdels Response Proccessing Queue**: Queue-based multi-model responses, so you don’t have to go full psycho opening the same prompt in 5 tabs
- **Pre Prompt Generation**: Pre-prompt generator to fix your shitty prompts, make them actually usable 
- **Smart Fallback System**: Automatic fallback to OpenRouter when user API keys aren't available
- **Real-time Multi-tab Sync**: Conversations sync instantly across all browser tabs
- **BYOK**: Bring Your Own Keys Support
- **Production Ready**: Built with enterprise-grade architecture and security

## 🎯 Core Features

### 🤖 Multi-LLM Support
- **8 Free Models**: Including DeepSeek R1, Gemini 2.5 Flash, GPT-4o Mini, Claude 3.5 Haiku
- **5 Premium Text Models**: GPT-4.1, Claude Sonnet 4, Gemini 2.5 Pro, and more
- **3 Image Models**: DALL-E 3/2, Stable Diffusion 3.5
- **2 Vision Models**: GPT-4o, GPT-4V for image analysis
- **Smart Model Selection**: Detailed model capability icons

### 🔐 Authentication & Security
- **Better Auth Integration**: Modern, secure authentication system
- **Multiple Providers**: Google OAuth, GitHub OAuth
- **Session Management**: Secure session handling with automatic expiration
- **API Key Management**: Secure storage of user API keys with encryption

### 💾 Data Management
- **Dual Storage System**: PostgreSQL for server data, Dexie.js for offline capabilities
- **Real-time Synchronization**: Instant sync across devices and browser tabs
- **Persistent Chat History**: Never lose your conversations
- **Usage Tracking**: Monitor API usage and rate limits

### 🎨 Modern UI/UX
- **Responsive Design**: Perfect experience on desktop, tablet, and mobile
- **Dark/Light Themes**: System preference detection with manual override

### 🚀 Advanced Features
- **Streaming Responses**: Real-time message streaming with typing indicators
- **Multi-tab Sync**: Continue conversations seamlessly across browser tabs
- **Error Recovery**: Automatic retry logic with graceful error handling
- **Syntax Highlighting**: Beautiful code rendering with copy functionality

## 🛠️ Tech Stack

### Core Framework
- **Next.js** - React framework with App Router
- **TypeScript** - Type-safe development

### Database & Storage
- **Prisma** - Next-generation ORM
- **PostgreSQL** - Robust relational database (Neon)
- **Dexie.js** - Client-side IndexedDB wrapper for offline support

### Authentication & Security
- **Better Auth** - Modern authentication solution
- **bcryptjs** - Password hashing
- **OAuth Providers** - Google, GitHub integration

### AI & APIs
- **AI SDK 4.3.16** - Vercel's AI SDK for streaming
- **OpenRouter Provider** - Access to multiple LLM providers
- **Google AI SDK** - Direct Google Gemini integration
- **OpenAI SDK** - Direct OpenAI API integration

### UI & Styling
- **Tailwind CSS 4.1.8** - Utility-first CSS framework
- **Radix UI** - Unstyled, accessible components
- **Lucide React** - Beautiful icon library
- **Next Themes** - Theme switching capabilities

### State Management & Utils
- **Zustand 5.0.5** - Lightweight state management
- **React Hook Form** - Performant form handling
- **Zod 3.25.56** - Schema validation
- **Lodash 4.17.21** - Utility library

## 🏗️ Architecture

### Smart Model Fallback System
```typescript
// Example: Premium models automatically fallback to OpenRouter
'GPT-4.1': {
  modelId: 'gpt-4.1',
  provider: 'openai',
  fallbackProvider: 'openrouter',
  fallbackModelId: 'openai/gpt-4.1',
}
```

### Real-time Multi-tab Synchronization
- **Broadcast Channel API** for cross-tab communication
- **Optimistic Updates** for instant UI feedback
- **Conflict Resolution** for simultaneous edits
- **Streaming State Sync** across all active sessions

### Offline-First Data Layer
- **Dexie.js** for client-side persistence
- **Background Sync** when connection restored
- **Conflict Resolution** between local and server state
- **Optimistic UI Updates** for responsive experience

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** or **Bun** (recommended)
- **PostgreSQL Database** (or Neon for cloud)
- **Git** for version control

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/godgpt.git
cd godgpt
```

2. **Install dependencies**
```bash
# Using bun (recommended)
bun install

# Or using npm
npm install
```

3. **Configure your environment**
```env
# Database
DATABASE_URL="your-postgresql-connection-string"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key-32-chars-minimum"
BETTER_AUTH_URL="http://localhost:3000"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# OpenRouter (required for free models)
OPENROUTER_API_KEY="sk-or-v1-your-api-key-here"

# Image Generation (optional)
IMAGEROUTER_API_KEY="your-imagerouter-key"
CLOUDINARY_CLOUD_NAME="your-cloudinary-name"
CLOUDINARY_API_KEY="your-cloudinary-key"
CLOUDINARY_API_SECRET="your-cloudinary-secret"
```

4. **Set up the database**
```bash
npm run db:push
```

6. **Start the development server**
```bash
npm run dev
```

7. **Open your browser**
Navigate to `http://localhost:3000`

## 🔧 Environment Setup

### Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `BETTER_AUTH_SECRET` | Secret for authentication | ✅ |
| `BETTER_AUTH_URL` | Application URL | ✅ |
| `OPENROUTER_API_KEY` | OpenRouter API key for free models | ✅ |

### Optional Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | ❌ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | ❌ |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | ❌ |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | ❌ |
| `IMAGEROUTER_API_KEY` | Image generation API key | ❌ |
| `CLOUDINARY_*` | Cloudinary configuration | ❌ |

### Getting API Keys

1. **OpenRouter**: Sign up at [openrouter.ai](https://openrouter.ai) - Required for free models
2. **Google OAuth**: Create project at [Google Cloud Console](https://console.cloud.google.com)
3. **GitHub OAuth**: Create app at [GitHub Developer Settings](https://github.com/settings/developers)
4. **Neon PostgreSQL**: Create database at [neon.tech](https://neon.tech)

## 📱 Usage

### Starting Your First Chat
1. **Sign up** with email, Google, or GitHub
2. **Select a model** from the dropdown (18+ options available)
3. **Start chatting** - responses stream in real-time
4. **Upload images** for vision-capable models

### Advanced Features
- **Can Select Multiple Models too** (optional)
- **Multi-tab Sync**: Open multiple tabs - conversations sync instantly
- **Offline Mode**: Continue chatting even without internet
- **Model Switching**: Change models mid-conversation
- **Chat History**: Access all previous conversations
- **Code Highlighting**: Beautiful syntax highlighting for code blocks

### Model Categories

#### 🆓 Free Models (No API key required)
- **DeepSeek R1 0528** - Latest reasoning model
- **Gemini 2.5 Flash** - Fast Google model with vision
- **GPT-4o Mini** - OpenAI's efficient model with vision
- **Claude 3.5 Haiku** - Anthropic's fast model
- **Meta-Llama 3.3 70B** - Meta's open source model

#### 💎 Premium Models (User API key recommended)
- **Claude Sonnet 4** - Anthropic's latest flagship
- **GPT-4.1** - OpenAI's advanced model
- **Gemini 2.5 Pro** - Google's most capable model
- **GPT-4o** - OpenAI's multimodal model
- **GPT-4V** - Enhanced vision capabilities

#### 🎨 Image Generation
- **DALL-E 3** - OpenAI's latest image generator
- **DALL-E 2** - Reliable image generation
- **Stable Diffusion 3.5** - Open source image generation

## 🏗️ Project Structure

```
godgpt/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── chat/         # Chat completion endpoint
│   │   ├── image/        # Image generation endpoint
│   │   └── upload/       # File upload endpoint
│   ├── globals.css       # Global styles
│   └── layout.tsx        # Root layout
├── frontend/              # Client-side code
│   ├── components/       # React components
│   │   ├── ui/          # Reusable UI components
│   │   └── userdashboard/ # User dashboard components
│   ├── dexie/           # Offline database layer
│   ├── hooks/           # Custom React hooks
│   ├── routes/          # Route components
│   └── stores/          # Zustand state stores
├── lib/                  # Shared utilities
├── prisma/              # Database schema and migrations
└── public/              # Static assets
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Cloudflare Workers (Edge)
```bash
bun run build
wrangler deploy
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📈 Future Implementation

- [ ] **Voice Chat** - Speech-to-text and text-to-speech
- [ ] **Branch Chat** - supports branching of chats
- [ ] **File Analysis** - PDF, CSV, and document processing
- [ ] **Plugin System** - Extensible plugin architecture
- [ ] **Team Workspaces** - Collaborative chat environments like share chat 
- [ ] **Advanced Analytics** - Usage statistics and insights
- [ ] **Mobile Apps** - Native iOS and Android applications

## 🔒 Security

- **End-to-end Encryption** for API keys
- **Rate Limiting** to prevent abuse
- **Input Sanitization** for XSS protection
- **CSRF Protection** with secure tokens
- **Secure Headers** with Next.js security headers

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team** for the incredible framework
- **Vercel** for the AI SDK and deployment platform
- **Better Auth** for modern authentication
- **OpenRouter** for unified LLM access
- **Neon** for serverless PostgreSQL
- **Open Source Community** for all the amazing tools

---

**Built with ❤️ by Neeraj (me) and Deepak (https://github.com/oneWritesCode)**

*"We want to make our app as its name"*
