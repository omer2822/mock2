import { TASK_STATUSES, type CreateTaskInput, type TaskStatus } from "./task.types.js";

export const isTaskStatus = (value: unknown): value is TaskStatus =>
  typeof value === "string" && TASK_STATUSES.includes(value as TaskStatus);

const getNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
};

export const validateCreateTaskInput = (
  payload: Record<string, unknown>
): { data?: CreateTaskInput; error?: string } => {
  const title = getNonEmptyString(payload.title);
  if (!title) {
    return { error: "title is required" };
  }

  const description = getNonEmptyString(payload.description);
  if (!description) {
    return { error: "description is required" };
  }

  const assignee = getNonEmptyString(payload.assignee);
  if (!assignee) {
    return { error: "assignee is required" };
  }

  return {
    data: {
      title,
      description,
      assignee
    }
  };
};

export const validateStatusFilter = (
  value: unknown
): { status?: TaskStatus; error?: string } => {
  if (value === undefined) {
    return {};
  }

  if (!isTaskStatus(value)) {
    return { error: "Invalid status filter" };
  }

  return { status: value };
};

export const validateStatusTransition = (
  currentStatus: TaskStatus,
  nextStatus: unknown
): { status?: TaskStatus; error?: string } => {
  if (!isTaskStatus(nextStatus)) {
    return { error: "Invalid status transition" };
  }

  const validTransitions: Record<TaskStatus, TaskStatus | null> = {
    todo: "in-progress",
    "in-progress": "done",
    done: null
  };

  if (validTransitions[currentStatus] !== nextStatus) {
    return { error: "Invalid status transition" };
  }

  return { status: nextStatus };
};
