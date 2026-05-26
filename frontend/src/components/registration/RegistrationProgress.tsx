import React from 'react';

interface RegistrationProgressProps {
  currentStep: number;
  totalSteps: number;
  title: string;
}

const RegistrationProgress: React.FC<RegistrationProgressProps> = ({
  currentStep,
  totalSteps,
  title,
}) => {
  const percentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <p className="text-xs font-bold text-primary uppercase tracking-widest">Registration</p>
          <h2 className="text-2xl font-bold text-secondary">
            Step {currentStep} of {totalSteps}: {title}
          </h2>
        </div>
        <span className="text-sm font-bold text-primary/40">{percentage}%</span>
      </div>
      <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default RegistrationProgress;
