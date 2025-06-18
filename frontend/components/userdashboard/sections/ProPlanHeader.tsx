import { ArrowLeft } from "lucide-react";
import { Button } from "../../ui/button";

interface ProPlanHeaderProps {
  onBack?: () => void;
}

const ProPlanHeader: React.FC<ProPlanHeaderProps> = ({ onBack }) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
      <Button 
        variant="ghost" 
        size="sm" 
        className="flex items-center gap-2 text-black hover:shadow-lg dark:text-white dark:bg-white/10 bg-white px-2 py-1 rounded cursor-pointer shadow-sm "
        onClick={onBack || (() => window.history.back())}
      >
        <ArrowLeft size={16} />
        Back to Chat
      </Button>
      
      <nav className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-gray-600 dark:text-gray-400">
        <span className="hover:shadow-lg shadow-amber-500 dark:text-white text-black transition-colors bg-white px-2 py-1 rounded cursor-pointer shadow-sm font-medium dark:bg-white/10">Account</span>
        <span className="hover:shadow-lg shadow-amber-500 dark:text-white text-black  transition-colors bg-white px-2 py-1 rounded cursor-pointer shadow-sm font-medium dark:bg-white/10">Customization</span>
        <span className="hover:shadow-lg shadow-amber-500 dark:text-white text-black  transition-colors bg-white px-2 py-1 rounded cursor-pointer shadow-sm font-medium dark:bg-white/10">History & Sync</span>
        <span className="hover:shadow-lg shadow-amber-500 dark:text-white text-black  transition-colors bg-white px-2 py-1 rounded cursor-pointer shadow-sm font-medium dark:bg-white/10">Models</span>
        <span className="hover:shadow-lg shadow-amber-500 dark:text-white text-black  transition-colors bg-white px-2 py-1 rounded cursor-pointer shadow-sm font-medium dark:bg-white/10">API Keys</span>
        <span className="hover:shadow-lg shadow-amber-500 dark:text-white text-black  transition-colors bg-white px-2 py-1 rounded cursor-pointer shadow-sm font-medium dark:bg-white/10">Attachments</span>
        <span className="hover:shadow-lg shadow-amber-500 dark:text-white text-black  transition-colors bg-white px-2 py-1 rounded cursor-pointer shadow-sm font-medium dark:bg-white/10">Contact Us</span>
      </nav>
    </div>
  );
};

export default ProPlanHeader; 