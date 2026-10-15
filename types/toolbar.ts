export type ToolbarActionId =
  | 'analyze'
  | 'generate'
  | 'argonMedium'
  | 'argonHigh'
  | 'print'
  | 'reset';

export type ToolbarActionVariant = 'default' | 'primary' | 'danger' | 'argon';

export type ToolbarActionTemplate = {
  id: ToolbarActionId;
  label: string;
  variant?: ToolbarActionVariant;
};

export type ToolbarAction = ToolbarActionTemplate & {
  onClick: () => void;
  disabled?: boolean;
};
