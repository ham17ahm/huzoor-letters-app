export type ToolbarActionId = 'analyze' | 'generate' | 'print' | 'reset';

export type ToolbarActionVariant = 'default' | 'primary' | 'danger';

export type ToolbarActionTemplate = {
  id: ToolbarActionId;
  label: string;
  variant?: ToolbarActionVariant;
};

export type ToolbarAction = ToolbarActionTemplate & {
  onClick: () => void;
  disabled?: boolean;
};
