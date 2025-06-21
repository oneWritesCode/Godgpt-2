import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Progress } from "../../ui/progress";
import { useState } from "react";
import { toast } from "../../ui/use-toast";

interface AccountStats {
  apiCalls: number;
  maxCalls: number;
  accountType: "free" | "premium" | "enterprise";
  memberSince: string;
}

export default function AccountSection() {
  const [accountStats] = useState<AccountStats>({
    apiCalls: 250,
    maxCalls: 1000,
    accountType: "free",
    memberSince: "January 2024"
  });

  const handleUpgrade = () => {
    toast({
      title: "Upgrade Account",
      description: "Redirecting to upgrade page...",
    });
    // Here you would typically redirect to a payment page
  };

  const getAccountTypeColor = (type: AccountStats["accountType"]) => {
    switch (type) {
      case "premium":
        return "bg-yellow-500 dark:bg-yellow-600";
      case "enterprise":
        return "bg-purple-500 dark:bg-purple-600";
      default:
        return "bg-gray-200 dark:bg-gray-700";
    }
  };

  return (
    <div className="bg-white dark:bg-[var(--bg)] rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 space-y-4">
      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">Account Settings</h3>
      <div className="grid gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">Account Type</span>
          <Badge 
            variant="secondary" 
            className={`font-medium ${getAccountTypeColor(accountStats.accountType)} text-gray-800 dark:text-gray-100`}
          >
            {accountStats.accountType.charAt(0).toUpperCase() + accountStats.accountType.slice(1)}
          </Badge>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">Member Since</span>
          <span className="font-medium text-gray-800 dark:text-gray-200">{accountStats.memberSince}</span>
        </div>
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">API Usage</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {accountStats.apiCalls}/{accountStats.maxCalls} calls
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleUpgrade}
                className="text-gray-700 dark:text-gray-200 border-blue-800 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-500/10 mb-2"
              >
                Upgrade
              </Button>
            </div>
          </div>
          <Progress 
            value={(accountStats.apiCalls / accountStats.maxCalls) * 100} 
            className="h-2"
          />
        </div>
      </div>
    </div>
  );
} 