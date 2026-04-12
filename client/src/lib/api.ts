import type { CreateTaskInput, Task, TaskStatus } from "../types/task";

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

const getErrorMessage = async (response: Response): Promise<string> => {
  try {
    const payload = (await response.json()) as { error?: string };
    if (payload.error) {
      return payload.error;
    }
  } catch {
    return "Something went wrong. Please try again.";
  }

  return "Something went wrong. Please try again.";
};

const parseJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new ApiError(await getErrorMessage(response));
  }

  return (await response.json()) as T;
};

export const fetchTasks = async (): Promise<Task[]> => {
  const response = await fetch("/api/tasks");

  return parseJson<Task[]>(response);
};

export const createTask = async (task: CreateTaskInput): Promise<Task> => {
  const response = await fetch("/api/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(task)
  });

  return parseJson<Task>(response);
};

export const updateTaskStatus = async (
  taskId: string,
  status: TaskStatus
): Promise<Task> => {
  const response = await fetch(`/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status })
  });

  return parseJson<Task>(response);
};

export const undoTaskStatus = async (taskId: string): Promise<Task> => {
  const response = await fetch(`/api/tasks/${taskId}/undo`, {
    method: "POST"
  });

  return parseJson<Task>(response);
};

export const deleteTask = async (taskId: string): Promise<void> => {
  const response = await fetch(`/api/tasks/${taskId}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new ApiError(await getErrorMessage(response));
  }
};
