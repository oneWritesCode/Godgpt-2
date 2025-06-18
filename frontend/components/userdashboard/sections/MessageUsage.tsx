import { Button } from "../../ui/button";
import { Progress } from "../../ui/progress";

interface MessageUsageProps {
  chatId?: string | null;
  standardUsage?: {
    used: number;
    total: number;
  };
  premiumUsage?: {
    used: number;
    total: number;
  };
  resetDate?: string;
  onBuyMore?: () => void;
}

const MessageUsage: React.FC<MessageUsageProps> = ({
  chatId,
  standardUsage = { used: 12, total: 1500 },
  premiumUsage = { used: 10, total: 100 },
  resetDate = "09-20-2025",
  onBuyMore
}) => {
  // You can use chatId here to fetch specific usage data if needed
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-4">Message Usage</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Resets {resetDate}</p>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Standard</span>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{standardUsage.used}/{standardUsage.total}</span>
          </div>
          <Progress value={(standardUsage.used / standardUsage.total) * 100} className="h-2" />
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{standardUsage.total - standardUsage.used} messages remaining</p>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Premium</span>
              <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                <span className="text-xs text-white">?</span>
              </div>
            </div>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{premiumUsage.used}/{premiumUsage.total}</span>
          </div>
          <Progress value={(premiumUsage.used / premiumUsage.total) * 100} className="h-2" />
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{premiumUsage.total - premiumUsage.used} messages remaining</p>
        </div>
      </div>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full mt-4 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        onClick={onBuyMore}
      >
        Buy more premium credits →
      </Button>
    </div>
  );
};

export default MessageUsage;