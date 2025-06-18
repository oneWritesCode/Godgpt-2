import React from "react";
import { MessageSquare, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

function LandingChatPage() {
  return (
    <div className="flex w-full flex-col items-center justify-center h-[calc(100vh-200px)]">
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
      </Card>
    </div>
  );
}

export default LandingChatPage;
