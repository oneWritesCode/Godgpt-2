import { useState } from "react";
import ProPlanHeader from "./sections/ProPlanHeader";
import BenefitCard from "./sections/BenefitCard";
import MessageUsage from "./sections/MessageUsage";
import { Button } from "../ui/button";
import { CheckCircle, Zap, HeadphonesIcon, ArrowLeft } from "lucide-react";
import DashboardNav from "./DashboardNav";
import AccountSection from "./sections/AccountSection";
import PreferencesSection from "./sections/PreferencesSection";
import ProfileSection from "./sections/ProfileSection";
import { useNavigate } from "react-router";
import APIKeyForm from "../APIKeyForm";

interface UserDashboardProps {
  chatId?: string | null;
}

type Section = 'account' | 'customization' | 'history' | 'sync' | 'models' | 'api-keys' | 'attachments' | 'contact';

const Index: React.FC<UserDashboardProps> = ({ chatId }) => {
  const [currentSection, setCurrentSection] = useState<Section>('account');
  const navigate = useNavigate();

  const renderSection = () => {
    switch (currentSection) {
      case 'account':
        return (
          <div className="space-y-8">
            <ProfileSection />
            <AccountSection />
          </div>
        );
      case 'customization':
        return <PreferencesSection />;
      case 'history':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">History & Sync</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your chat history and synchronization settings will appear here.
            </p>
          </div>
        );
      case 'models':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Models</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure your AI model preferences here.
            </p>
          </div>
        );
      case 'api-keys':
        return <APIKeyForm />;
      case 'attachments':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Attachments</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View and manage your file attachments here.
            </p>
          </div>
        );
      case 'contact':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Contact Us</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get in touch with our support team.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="w-full max-w-4xl mx-auto min-h-screen p-6">
        {/* Header Section */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-2 text-black hover:shadow-lg dark:text-white dark:bg-white/10 bg-white px-2 py-1 rounded cursor-pointer shadow-sm mb-12"
            onClick={() => navigate('/chat')}
          >
            <ArrowLeft size={16} />
            Back to Chat
          </Button>

          {/* Navigation */}
          <DashboardNav currentSection={currentSection} onSectionChange={setCurrentSection} />
        </div>
        
        {/* Main Content */}
        <div className="space-y-8 mb-8">
          {renderSection()}
        </div>

        {/* Message Usage Section */}
        <div className="mt-auto">
          <MessageUsage chatId={chatId} />
        </div>
      </div>
    </div>
  );
};

export default Index;