export { TaskDetailDialog as TaskFormSheet } from "@/components/tasks/task-detail-dialog";
export type {
  TaskFormValues,
  ProjectOption,
  SubjectOption,
  TagOption,
} from "@/components/tasks/task-detail-dialog";

export function formatDateInput(value?: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}
