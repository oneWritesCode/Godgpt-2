import { useEffect, useState } from 'react';
import { Badge } from './ui/badge';
import { Clock, Zap } from 'lucide-react';
import { useAuthStore } from '../stores/AuthStore';

interface Usage {
  requestCount: number;
  remainingRequests: number;
  resetAt: string | null;
}

export default function UsageIndicator() {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');
  const { session } = useAuthStore();

  useEffect(() => {
    if (session) {
      fetchUsage();
    }
  }, [session]);

  useEffect(() => {
    if (usage?.resetAt) {
      const interval = setInterval(() => {
        const now = new Date();
        const resetTime = new Date(usage.resetAt!);
        const timeDiff = resetTime.getTime() - now.getTime();

        if (timeDiff <= 0) {
          setTimeUntilReset('Resetting...');
          fetchUsage(); // Refresh usage
        } else {
          const hours = Math.floor(timeDiff / (1000 * 60 * 60));
          const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeUntilReset(`${hours}h ${minutes}m`);
        }
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [usage?.resetAt]);

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/usage');
      if (response.ok) {
        const data = await response.json();
        setUsage(data);
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    }
  };

  if (!usage) return null;

  const isLowUsage = usage.remainingRequests <= 2;
  const isNoUsage = usage.remainingRequests === 0;

  return (
    <div className="flex items-center gap-2 text-xs">
      <Badge
        variant={isNoUsage ? 'destructive' : isLowUsage ? 'secondary' : 'outline'}
        className="flex items-center gap-1"
      >
        <Zap className="w-3 h-3" />
        {usage.remainingRequests} left
      </Badge>
      
      {usage.resetAt && (
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {timeUntilReset}
        </Badge>
      )}
    </div>
  );
}