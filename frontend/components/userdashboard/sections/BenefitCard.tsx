import { ReactNode } from "react";

interface BenefitCardProps {
  icon: ReactNode;
  title: ReactNode;
  description: ReactNode;
  highlight?: ReactNode;
}

const BenefitCard: React.FC<BenefitCardProps> = ({
  icon,
  title,
  description,
  highlight
}) => {
  return (
    <div className="bg-white dark:bg-[var(--bg)] rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 h-full transition-all hover:shadow-md">
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h3 className="font-medium text-gray-800 dark:text-gray-100">{title}</h3>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {description}
        {highlight && (
          <span className="block mt-3 text-blue-500 dark:text-blue-400 font-medium">
            {highlight}
          </span>
        )}
      </p>
    </div>
  );
};

export default BenefitCard; 