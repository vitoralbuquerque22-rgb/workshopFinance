import React from 'react';
import { Check } from 'lucide-react';

export default function GpsStepper({ steps, current, onStep }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {steps.map((step, idx) => {
        const isCurrent = idx === current;
        const isDone = idx < current;
        const isClickable = idx <= current;
        return (
          <React.Fragment key={step.key}>
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStep(idx)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                isCurrent
                  ? 'bg-primary text-primary-foreground'
                  : isDone
                  ? 'bg-primary/10 text-primary hover:bg-primary/20'
                  : 'text-muted-foreground'
              } ${!isClickable ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${
                isCurrent ? 'bg-primary-foreground text-primary' : isDone ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                {isDone ? <Check className="h-3 w-3" /> : idx + 1}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
            </button>
            {idx < steps.length - 1 && <div className={`h-px w-4 sm:w-6 shrink-0 ${isDone ? 'bg-primary' : 'bg-border'}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}