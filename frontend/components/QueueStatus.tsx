import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/frontend/dexie/db';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

interface QueueStatusProps {
  groupId: string;
  className?: string;
}

export default function QueueStatus({ groupId, className }: QueueStatusProps) {
  const queueItems = useLiveQuery(
    () => db.queueItems.where('groupId').equals(groupId).sortBy('queueIndex'),
    [groupId]
  );

  if (!queueItems || queueItems.length === 0) return null;

  const completed = queueItems.filter(q => q.status === 'completed').length;
  const failed = queueItems.filter(q => q.status === 'failed').length;
  const processing = queueItems.filter(q => q.status === 'processing').length;
  const pending = queueItems.filter(q => q.status === 'pending').length;
  const total = queueItems.length;
  const progress = ((completed + failed) / total) * 100;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-3 h-3 text-yellow-500" />;
      case 'processing': return <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />;
      case 'completed': return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'failed': return <XCircle className="w-3 h-3 text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className={`p-3 bg-muted rounded-lg space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Queue Progress</span>
        <Badge variant="outline">
          {completed + failed}/{total}
        </Badge>
      </div>
      
      <Progress value={progress} className="h-2" />
      
      <div className="flex items-center gap-4 text-xs">
        {processing > 0 && (
          <div className="flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>{processing} processing</span>
          </div>
        )}
        {pending > 0 && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-yellow-500" />
            <span>{pending} pending</span>
          </div>
        )}
        {completed > 0 && (
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span>{completed} completed</span>
          </div>
        )}
        {failed > 0 && (
          <div className="flex items-center gap-1">
            <XCircle className="w-3 h-3 text-red-500" />
            <span>{failed} failed</span>
          </div>
        )}
      </div>

      {/* Model-by-model status */}
      <div className="space-y-1">
        {queueItems.map((item, index) => (
          <div key={item.id} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {getStatusIcon(item.status)}
              <span>{item.model}</span>
            </div>
            {item.status === 'failed' && item.error && (
              <span className="text-red-500 truncate max-w-24" title={item.error}>
                {item.error}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}