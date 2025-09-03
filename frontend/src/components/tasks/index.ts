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
export { TaskFromTemplateModal, type TaskFromTemplateFormData, type TaskFromTemplateModalProps } from './TaskFromTemplateModal';
export { CustomizationSettings, type CustomizationSettingsProps, type CustomizationSettings as CustomizationSettingsType } from './CustomizationSettings';

// Statistics and My Tasks Components
export { default as StatsCarousel } from './StatsCarousel';
export { default as MyTasksTable } from './MyTasksTable';
export { default as TaskActivityTimeline } from './TaskActivityTimeline';
export type { StatsCarouselProps, StatsData } from './StatsCarousel';
export type { MyTasksTableProps } from './MyTasksTable';
