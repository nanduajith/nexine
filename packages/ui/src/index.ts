// Public surface of the Nexine design system.

export { cn } from './lib/cn';

// Tool contract (the seam that becomes the plugin SDK)
export type { ToolModule, ToolViewProps } from './tool';
export { defineTool } from './tool';

// Primitives
export { Button, type ButtonProps } from './components/Button';
export { Input, type InputProps } from './components/Input';
export { Textarea, type TextareaProps } from './components/Textarea';
export { Field, type FieldProps } from './components/Field';
export { Panel, type PanelProps } from './components/Panel';
export { CopyButton, type CopyButtonProps } from './components/CopyButton';
export { Segmented, type SegmentedProps, type SegmentedOption } from './components/Segmented';
export { Switch, type SwitchProps } from './components/Switch';
export { Kbd } from './components/Kbd';
export { Badge, type BadgeProps } from './components/Badge';
export { EmptyState, type EmptyStateProps } from './components/EmptyState';
