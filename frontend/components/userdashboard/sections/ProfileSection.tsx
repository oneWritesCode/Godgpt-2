import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { useState, KeyboardEvent } from "react";
import { toast } from "sonner";

interface ProfileData {
  name: string;
  email: string;
}

export default function ProfileSection() {
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "User Name",
    email: "user@example.com"
  });
  const [errors, setErrors] = useState<Partial<ProfileData>>({});

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSave = () => {
    const newErrors: Partial<ProfileData> = {};
    
    if (!profileData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!validateEmail(profileData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Here you would typically make an API call to save the data
    setErrors({});
    toast.success("Profile updated successfully");
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 space-y-4">
      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">Profile Information</h3>
      <div className="grid gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">Name</span>
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <Input
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              onKeyDown={handleKeyPress}
              className="w-full sm:w-48 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
            {errors.name && (
              <span className="text-xs text-red-500 dark:text-red-400">{errors.name}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">Email</span>
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <Input
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              onKeyDown={handleKeyPress}
              className="w-full sm:w-48 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
            {errors.email && (
              <span className="text-xs text-red-500 dark:text-red-400">{errors.email}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 