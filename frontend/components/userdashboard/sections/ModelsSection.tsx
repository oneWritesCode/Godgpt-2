import React from "react";
import BenefitCard from "./BenefitCard";
import {
  FREE_MODELS,
  PREMIUM_MODELS,
  IMAGE_MODELS,
  MODEL_CONFIGS,
} from "@/lib/models";
import { Badge } from "../../ui/badge";
import { Sparkles, Eye, Image as ImageIcon, Zap, Star } from "lucide-react";

const modelDescriptions: Record<string, string> = {
  "Deepseek R1 0528":
    "A fast, free, and capable text model for general chat and coding.",
  "Deepseek V3":
    "Advanced open-source model for reasoning, coding, and creative tasks.",
  "Gemini 2.5 Flash":
    "Google's ultra-fast vision model for text, image, and multimodal tasks.",
  "GPT 4o Mini":
    "OpenAI's lightweight vision model for quick, smart responses and image understanding.",
  "Anthropic Claude 3.5":
    "Anthropic's latest model for safe, helpful, and creative conversations.",
  "Meta-Llama 3.3 70b":
    "Meta's open Llama model, great for reasoning and general chat.",
  "Qwen 2.5 7B":
    "Qwen's compact model for efficient, high-quality text generation.",
  "Grok 3 Mini":
    "xAI's Grok, designed for real-time, witty, and informative chat.",
  "Gemini 2.5 Pro":
    "Google's most advanced model for complex reasoning, coding, and multimodal tasks.",
  "Claude Sonnet 4":
    "Anthropic's premium model for nuanced, safe, and high-quality conversations.",
  "GPT-4.1":
    "OpenAI's flagship model for advanced reasoning, creativity, and coding.",
  "GPT-4o": "OpenAI's latest vision model for text, images, and tools in one.",
  "GPT-4V (Vision)":
    "OpenAI's vision model for deep image understanding and multimodal tasks.",
  "DALL-E 3":
    "OpenAI's top-tier image generation model for creative, high-quality images.",
  "DALL-E 2":
    "OpenAI's earlier image model for fast, creative image generation.",
  "Stable Diffusion 3.5":
    "Stability AI's open-source model for flexible, high-quality image generation.",
};

const modelIcons: Record<string, React.ReactNode> = {
  text: <Sparkles className="text-purple-500" />,
  vision: <Eye className="text-blue-500" />,
  image: <ImageIcon className="text-pink-500" />,
  premium: <Star className="text-yellow-500" />,
  fast: <Zap className="text-green-500" />,
};

function getModelIcon(type: string) {
  if (type === "text") return modelIcons.text;
  if (type === "vision") return modelIcons.vision;
  if (type === "image") return modelIcons.image;
  return modelIcons.text;
}

function ModelsSection() {
  return (
    <div className="bg-white dark:bg-[var(--bg)] rounded-lg p-4 sm:p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
        Models
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Explore all available AI models and their specialties. Choose the best
        one for your needs!
      </p>

      {/* Premium Models - more prominent */}
      <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-2 mt-6">
        Premium Models
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mb-8">
        {PREMIUM_MODELS.map((model) => {
          const config = MODEL_CONFIGS[model];
          return (
            <div
              key={model}
              className="transform hover:scale-105 transition-transform duration-200"
            >
              <BenefitCard
                icon={
                  <span className="">
                    <Star className="text-yellow-400 mr-1 inline" />
                  </span>
                }
                title={
                  <span className="w-full flex gap-2 items-center">
                    <span className="font-medium text-sm whitespace-nowrap text-yellow-700 dark:text-yellow-300 flex gap-2">
                      {model}
                    </span>
                    <Badge
                      variant="outline"
                      className="border-yellow-400 text-yellow-700 dark:text-yellow-300 ml-1 self-end"
                    >
                      Premium
                    </Badge>
                  </span>
                }
                description={
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-400">
                    {modelDescriptions[model] || "A premium AI model."}
                  </span>
                }
                highlight=""
              />
            </div>
          );
        })}
      </div>

      {/* Image Generation Models - neutral, now above free models */}
      <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-2 mt-6">
        Image Generation Models
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-10">
        {IMAGE_MODELS.map((model) => {
          const config = MODEL_CONFIGS[model];
          return (
            <BenefitCard
              key={model}
              icon={getModelIcon(config.type || "image")}
              title={
                <span className="font-medium text-sm whitespace-nowrap flex gap-2">
                  {model}
                </span>
              }
              description={
                <span className="text-sm font-medium text-gray-800 dark:text-gray-400">
                  {modelDescriptions[model] || "An image generation model."}
                </span>
              }
              highlight="Image"
            />
          );
        })}
      </div>

      {/* Free Models - responsive, no opacity */}
      <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-2 mt-6">
        Free Models
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-2 mb-6">
        {FREE_MODELS.map((model) => {
          const config = MODEL_CONFIGS[model];
          return (
            <div key={model} className="text-xs">
              <BenefitCard
                icon={
                  <span className="scale-90">
                    {getModelIcon(config.type || "text")}
                  </span>
                }
                title={
                  <span className="font-semibold text-xs text-gray-500 dark:text-gray-300">
                    {model}
                  </span>
                }
                description={
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {modelDescriptions[model] || "A powerful AI model."}
                  </span>
                }
                highlight="Free"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ModelsSection;
