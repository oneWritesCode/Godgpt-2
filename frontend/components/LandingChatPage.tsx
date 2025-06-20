import React, { useState } from "react";
import { MessageSquare, Sparkles, Brain, User, Code, Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

const categories = [
  {
    key: "philosophy",
    label: "Debate",
    icon: Brain,
    questions: [
      "What is the meaning of life?",
      "How do you define happiness?",
      "What motivates human behavior?",
      "Is free will an illusion?",
    ],
  },
  {
    key: "personal",
    label: "Personal Talk",
    icon: User,
    questions: [
      "How was your day?",
      "Tell me something about yourself.",
      "What are your hobbies?",
      "How do you handle stress?",
    ],
  },
  {
    key: "code",
    label: "About Tech",
    icon: Code,
    questions: [
      "Can you write a Python function for sorting?",
      "How do I create a React component?",
      "Show me an example of a REST API.",
      "How to use async/await in JavaScript?",
    ],
  },
  {
    key: "research",
    label: "Do Research",
    icon: Search,
    questions: [
      "What are the latest AI trends?",
      "Summarize the theory of relativity.",
      "What is quantum computing?",
      "Find recent news on climate change.",
    ],
  },
];

function LandingChatPage() {
  const [selected, setSelected] = useState(categories[0].key);
  const selectedCategory = categories.find((cat) => cat.key === selected);

  return (
    <div className="flex w-full mt-10 flex-col items-center justify-center h-[calc(100vh-300px)] capitalize`">
      <Card className="w-full max-w-2xl mx-auto h-full flex flex-col justify-center bg-transparent border-0">
        <CardHeader>
          <div className="flex items-center justify-center gap-2 mb-4 flex-col">
            <CardTitle className="lg:text-3xl text-xl">
              Hi, I'm God <span className="font-light opacity-90">of gpt's</span>
            </CardTitle>
            <CardTitle className="lg:text-sm text-lg font-light opacity-70">
              how can i help you today?
            </CardTitle>
          </div>
        </CardHeader>
          <div className="flex items-center justify-center gap-3 mb-4 w-full lg:flex-wrap">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.key}
                  onClick={() => setSelected(cat.key)}
                  className={`w-20 h-20 sm:w-1/5 sm:h-24 flex flex-col items-center justify-center rounded-md text-black dark:text-white transition-all duration-200 cursor-pointer focus:outline-none select-none p-2 font-medium dark:hover:bg-white/10 bg-white
                    ${selected === cat.key ? "dar)] dark:bg-white/10" : "dark:bg-black/20"}
                  `}
                >
                  <span className="flex flex-col items-center gap-1 text-sm font-md">
                    <Icon size={18} />
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-col gap-5 items-center w-full">
            <span className="text-center">

            {selectedCategory?.questions.map((q, idx) => (
              <div
              key={idx}
              className="w-full text-center sm:text-sm text-[0.8rem] text-gray-600 mb-1 dark:text-gray-400 font-light text-base"
              >
                {q}
              </div>
            ))}
            </span>
        </div>
      </Card>
    </div>
  );
}

export default LandingChatPage;
