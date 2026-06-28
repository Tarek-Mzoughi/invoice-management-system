import { Slot } from '@radix-ui/react-slot';
import * as Stepperize from '@stepperize/react';
import { Check } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type StepperVariant = 'horizontal' | 'vertical' | 'circle';
type LabelOrientation = 'horizontal' | 'vertical';

interface StepperConfig {
  variant: StepperVariant;
  labelOrientation: LabelOrientation;
  tracking: boolean;
}

const StepperContext = React.createContext<StepperConfig | null>(null);

const useStepperConfig = () => {
  const context = React.useContext(StepperContext);
  if (!context) {
    throw new Error('Stepper components must be used within Stepper.Provider.');
  }
  return context;
};

const getStepState = (currentIndex: number, stepIndex: number) => {
  if (currentIndex === stepIndex) return 'active';
  if (currentIndex > stepIndex) return 'completed';
  return 'inactive';
};

const useStepChildren = (children: React.ReactNode) => {
  return React.useMemo(() => {
    const map = new Map<string, React.ReactNode>();

    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;
      const slot = (child.type as { displayName?: string })?.displayName;
      if (slot) map.set(slot, child);
    });

    return map;
  }, [children]);
};

const Title = ({
  children,
  className,
  asChild,
  ...props
}: React.ComponentProps<'h4'> & { asChild?: boolean }) => {
  const Comp = asChild ? Slot : 'h4';

  return (
    <Comp
      data-component="stepper-title"
      className={cn('text-sm font-medium leading-none', className)}
      {...props}>
      {children}
    </Comp>
  );
};
Title.displayName = 'title';

const Description = ({
  children,
  className,
  asChild,
  ...props
}: React.ComponentProps<'p'> & { asChild?: boolean }) => {
  const Comp = asChild ? Slot : 'p';

  return (
    <Comp
      data-component="stepper-description"
      className={cn('text-xs text-muted-foreground', className)}
      {...props}>
      {children}
    </Comp>
  );
};
Description.displayName = 'description';

const scrollIntoStepperPanel = (node: HTMLElement | null, tracking: boolean) => {
  if (!node || !tracking) return;
  node.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
};

export const defineStepper = <const Steps extends Stepperize.Step[]>(
  ...steps: Steps
) => {
  const { Scoped, useStepper, ...rest } = Stepperize.defineStepper(...steps);

  const StepperContainer = ({
    children,
    className,
    ...props
  }: Omit<React.ComponentProps<'div'>, 'children'> & {
    children:
      | React.ReactNode
      | ((props: { methods: Stepperize.Stepper<Steps> }) => React.ReactNode);
  }) => {
    const methods = useStepper();

    return (
      <div data-component="stepper" className={cn('w-full', className)} {...props}>
        {typeof children === 'function' ? children({ methods }) : children}
      </div>
    );
  };

  const Step = ({ children, className, icon, of, disabled, ...props }: any) => {
    const { variant, labelOrientation } = useStepperConfig();
    const { current } = useStepper();
    const utils = rest.utils;
    const stepIndex = utils.getIndex(of);
    const currentIndex = utils.getIndex(current.id);
    const isLast = utils.getLast().id === of;
    const isActive = current.id === of;
    const state = getStepState(currentIndex, stepIndex);
    const childMap = useStepChildren(children);

    if (variant === 'circle') {
      return (
        <li className={cn('flex shrink-0 items-center gap-4 rounded-md', className)}>
          <div className="grid size-9 place-items-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
            {stepIndex + 1}
          </div>
          <div className="flex flex-col items-start gap-1">
            {childMap.get('title')}
            {childMap.get('description')}
          </div>
        </li>
      );
    }

    return (
      <>
        <li
          data-state={state}
          data-variant={variant}
          data-label-orientation={labelOrientation}
          className={cn(
            'group relative flex min-w-0 items-center gap-2',
            labelOrientation === 'vertical' && 'flex-1 flex-col justify-center text-center',
            variant === 'vertical' && 'items-start',
            className
          )}>
          <Button
            id={`step-${of}`}
            type="button"
            role="tab"
            tabIndex={state !== 'inactive' ? 0 : -1}
            variant={state !== 'inactive' ? 'default' : 'secondary'}
            size="icon"
            className="size-9 shrink-0 rounded-full"
            aria-controls={`step-panel-${of}`}
            aria-current={isActive ? 'step' : undefined}
            aria-posinset={stepIndex + 1}
            aria-setsize={steps.length}
            aria-selected={isActive}
            disabled={disabled}
            {...props}>
            {icon ?? (state === 'completed' ? <Check className="size-4" /> : stepIndex + 1)}
          </Button>
          <div className="flex min-w-0 flex-col items-start gap-1 text-left">
            {childMap.get('title')}
            {childMap.get('description')}
          </div>
        </li>

        {!isLast && variant === 'horizontal' && (
          <li
            aria-hidden="true"
            className={cn(
              'hidden h-px flex-1 bg-border sm:block',
              state === 'completed' && 'bg-primary'
            )}
          />
        )}
      </>
    );
  };

  return {
    ...rest,
    useStepper,
    Stepper: {
      Provider: ({
        variant = 'horizontal',
        labelOrientation = 'horizontal',
        tracking = false,
        children,
        className,
        initialStep,
        initialMetadata,
        ...props
      }: any) => (
        <StepperContext.Provider value={{ variant, labelOrientation, tracking }}>
          <Scoped initialStep={initialStep} initialMetadata={initialMetadata}>
            <StepperContainer className={className} {...props}>
              {children}
            </StepperContainer>
          </Scoped>
        </StepperContext.Provider>
      ),
      Navigation: ({
        children,
        className,
        'aria-label': ariaLabel = 'Stepper Navigation',
        ...props
      }: React.ComponentProps<'nav'>) => (
        <nav data-component="stepper-navigation" aria-label={ariaLabel} role="tablist" {...props}>
          <ol className={cn('flex w-full items-center gap-2', className)}>{children}</ol>
        </nav>
      ),
      Step,
      Title,
      Description,
      Panel: ({
        children,
        asChild,
        ...props
      }: React.ComponentProps<'div'> & { asChild?: boolean }) => {
        const Comp = asChild ? Slot : 'div';
        const { tracking } = useStepperConfig();

        return (
          <Comp
            data-component="stepper-panel"
            ref={(node: HTMLElement | null) => scrollIntoStepperPanel(node, tracking)}
            {...props}>
            {children}
          </Comp>
        );
      },
      Controls: ({
        children,
        className,
        asChild,
        ...props
      }: React.ComponentProps<'div'> & { asChild?: boolean }) => {
        const Comp = asChild ? Slot : 'div';
        return (
          <Comp
            data-component="stepper-controls"
            className={cn('flex justify-end gap-4', className)}
            {...props}>
            {children}
          </Comp>
        );
      }
    }
  };
};
