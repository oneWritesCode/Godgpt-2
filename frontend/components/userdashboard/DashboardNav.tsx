import { useState } from 'react';
import { cn } from '@/lib/utils';

type Section = 'account' | 'customization' | 'history' | 'sync' | 'models' | 'api-keys' | 'attachments' | 'contact';

interface DashboardNavProps {
  onSectionChange: (section: Section) => void;
  currentSection: Section;
}

export default function DashboardNav({ onSectionChange, currentSection }: DashboardNavProps) {
  const sections: { id: Section; label: string }[] = [
    { id: 'account', label: 'Account' },
    { id: 'customization', label: 'Customization' },
    { id: 'history', label: 'History & Sync' },
    { id: 'models', label: 'Models' },
    { id: 'api-keys', label: 'API Keys' },
    { id: 'attachments', label: 'Attachments' },
    { id: 'contact', label: 'Contact Us' },
  ];

  return (
    <nav className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm bg-pink-500/10 p-2 rounded-sm dark:bg-gray-800">
      {sections.map((section) => (
        <button
          key={section.id}
          //there i need to cahge some stylessssss_______________________________________________________________________________________________________________________________
          onClick={() => onSectionChange(section.id)}
          className={cn(
            "hover:shadow-lg transition-colors px-2 py-1 rounded cursor-pointer shadow-sm font-medium bg-white dark:bg-white/10 text-gray-800 dark:text-gray-100",
            currentSection === section.id
              ? "shadow-lg scale-[1.1] "
              : ""
          )}
        >
          {section.label}
        </button>
      ))}
    </nav>
  );
} 