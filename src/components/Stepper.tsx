import { AnimatePresence, motion } from 'motion/react';
import { Children, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

interface StepperProps {
  steps?: string[];
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onFinalStepCompleted?: () => void;
  backButtonText?: string;
  nextButtonText?: string;
  completeButtonText?: string;
  backButtonProps?: React.ComponentProps<typeof motion.button>;
  nextButtonProps?: React.ComponentProps<typeof motion.button>;
  isStepAllowed?: (step: number) => boolean;
  children: ReactNode;
}

export default function Stepper({
  steps = [],
  initialStep = 0,
  onStepChange,
  onFinalStepCompleted,
  backButtonText = 'Back',
  nextButtonText = 'Continue',
  completeButtonText = 'Complete',
  backButtonProps,
  nextButtonProps,
  isStepAllowed,
  children,
}: StepperProps) {
  const stepItems = Children.toArray(children);
  const [step, setStep] = useState(initialStep);
  const [maxStep, setMaxStep] = useState(initialStep);
  const [direction, setDirection] = useState(0);
  const [height, setHeight] = useState<number | 'auto'>(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const currentStep = Math.min(Math.max(step, 0), stepItems.length - 1);
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === stepItems.length - 1;
  const isAllowed = isStepAllowed ? isStepAllowed(currentStep) : true;

  useLayoutEffect(() => {
    if (contentRef.current) setHeight(contentRef.current.scrollHeight);
  }, [currentStep, stepItems]);

  const goTo = (nextStep: number) => {
    if (nextStep === currentStep) return;
    setDirection(nextStep > currentStep ? 1 : -1);
    setStep(nextStep);
    setMaxStep((prev) => Math.max(prev, nextStep));
    onStepChange?.(nextStep);
  };

  const handleNext = () => {
    if (!isAllowed) return;
    if (isLastStep) {
      onFinalStepCompleted?.();
      return;
    }
    goTo(currentStep + 1);
  };

  const progress = ((currentStep) / (stepItems.length - 1)) * 100;

  return (
    <div className="stepper">
      {steps.length > 1 && (
        <div className="stepper-indicator">
          <div className="stepper-track">
            <div className="stepper-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="stepper-steps">
            {steps.map((label, index) => {
              const active = index === currentStep;
              const done = index < maxStep;
              const reachable = isStepAllowed ? isStepAllowed(index) : true;
              return (
                <button
                  type="button"
                  key={label}
                  className={['stepper-step', active ? 'active' : '', done ? 'done' : '', reachable ? 'reachable' : ''].filter(Boolean).join(' ')}
                  onClick={() => reachable && index < maxStep && goTo(index)}
                >
                  <span className="stepper-dot">{done ? '✓' : index + 1}</span>
                  <span className="stepper-label">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="stepper-viewport">
        <div className="stepper-content" ref={contentRef} style={{ height }}>
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={currentStep}
              className="stepper-pane"
              custom={direction}
              initial={{ opacity: 0, x: direction >= 0 ? 40 : -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction >= 0 ? -40 : 40 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {stepItems[currentStep]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="stepper-footer">
        <motion.button
          type="button"
          className="stepper-btn back"
          onClick={() => goTo(currentStep - 1)}
          disabled={isFirstStep}
          whileTap={{ scale: 0.97 }}
          {...backButtonProps}
        >
          {backButtonProps?.children ?? `← ${backButtonText}`}
        </motion.button>
        <motion.button
          type="button"
          className="stepper-btn next"
          onClick={handleNext}
          whileTap={{ scale: 0.97 }}
          {...(nextButtonProps ? { ...nextButtonProps, disabled: !isAllowed || Boolean(nextButtonProps.disabled) } : { disabled: !isAllowed })}
        >
          {nextButtonProps?.children ?? (isLastStep ? completeButtonText : `${nextButtonText} →`)}
        </motion.button>
      </div>
    </div>
  );
}
