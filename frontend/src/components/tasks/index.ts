/**
 * @fileoverview Tasks Components Index for TaaskMaaster
 * @description Export all task-related components
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

// Existing Task Components
export { TaskList } from './TaskList';
export { TaskForm } from './TaskForm';

// Export Task interface from TaskList for compatibility with existing code
export type { Task, TaskListProps } from './TaskList';
export type { TaskFormProps, TaskFormData } from './TaskForm';

// Template Components
export { TemplateCard, type TaskTemplate, type TemplateCardProps } from './TemplateCard';
export { TemplateGrid, type TemplateGridProps } from './TemplateGrid';
export { TemplateTable, type TemplateTableProps } from './TemplateTable';
export { CreateTemplateModal, type TemplateFormData, type CreateTemplateModalProps } from './CreateTemplateModal';
export { CustomizationSettings, type CustomizationSettingsProps, type CustomizationSettings as CustomizationSettingsType } from './CustomizationSettings';
