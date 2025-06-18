import { Button } from "../../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { useState, useEffect, KeyboardEvent } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

interface Preferences {
  language: "english" | "spanish" | "french" | "german";
}

export default function PreferencesSection() {
  const { theme, setTheme } = useTheme();
  const [preferences, setPreferences] = useState<Preferences>({
    language: "english"
  });

  useEffect(() => {
    // Load saved language preference from localStorage
    const savedPreferences = localStorage.getItem("userPreferences");
    if (savedPreferences) {
      const parsed = JSON.parse(savedPreferences);
      setPreferences(prev => ({ ...prev, language: parsed.language }));
    }
  }, []);

  const handleLanguageChange = (value: string) => {
    setPreferences(prev => ({ ...prev, language: value as Preferences["language"] }));
    localStorage.setItem("userPreferences", JSON.stringify({
      ...preferences,
      language: value
    }));
    toast.success("Language preference updated");
  };

  const handleThemeChange = (value: string) => {
    setTheme(value);
    toast.success("Theme updated");
  };

  const handleKeyPress = (e: KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 space-y-4"
      onKeyDown={(e) => handleKeyPress(e, () => {
        // Handle any global Enter key actions if needed
      })}
    >
      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">Preferences</h3>
      <div className="grid gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">Theme</span>
          <Select 
            value={theme} 
            onValueChange={handleThemeChange}
          >
            <SelectTrigger 
              className="w-full sm:w-48"
              onKeyDown={(e) => handleKeyPress(e, () => {
                const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
                handleThemeChange(nextTheme);
              })}
            >
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">Language</span>
          <Select 
            value={preferences.language} 
            onValueChange={handleLanguageChange}
          >
            <SelectTrigger 
              className="w-full sm:w-48"
              onKeyDown={(e) => handleKeyPress(e, () => {
                const languages: Preferences["language"][] = ["english", "spanish", "french", "german"];
                const currentIndex = languages.indexOf(preferences.language);
                const nextLanguage = languages[(currentIndex + 1) % languages.length];
                handleLanguageChange(nextLanguage);
              })}
            >
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="spanish">Spanish</SelectItem>
              <SelectItem value="french">French</SelectItem>
              <SelectItem value="german">German</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
} 