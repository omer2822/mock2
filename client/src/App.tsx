import { startTransition, useEffect, useState } from "react";

import { TaskBoard } from "./components/TaskBoard";
import { TaskForm } from "./components/TaskForm";
import {
  ApiError,
  createTask,
  deleteTask,
  fetchTasks,
  updateTaskStatus
} from "./lib/api";
import type { CreateTaskInput, Task, TaskStatus } from "./types/task";

const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
};

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshTasks = async (): Promise<void> => {
    const nextTasks = await fetchTasks();

    startTransition(() => {
      setTasks(nextTasks);
      setErrorMessage(null);
    });
  };

  useEffect(() => {
    const loadTasks = async () => {
      try {
        await refreshTasks();
      } catch (error) {
        setErrorMessage(getErrorMessage(error));
      }
    };

    void loadTasks();
  }, []);

  const handleCreateTask = async (task: CreateTaskInput): Promise<boolean> => {
    try {
      await createTask(task);
      await refreshTasks();

      return true;
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      return false;
    }
  };

  const handleMoveForward = async (
    task: Task,
    nextStatus: TaskStatus
  ): Promise<void> => {
    try {
      await updateTaskStatus(task.id, nextStatus);
      await refreshTasks();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  };

  const handleDeleteTask = async (taskId: string): Promise<void> => {
    try {
      await deleteTask(taskId);
      await refreshTasks();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  };

  return (
    <div className="app-shell">
      <div className="app-shell__content">
        <TaskForm onSubmit={handleCreateTask} />
        {errorMessage ? (
          <div className="error-banner" role="alert">
            {errorMessage}
          </div>
        ) : null}
        <TaskBoard
          tasks={tasks}
          onMoveForward={handleMoveForward}
          onDelete={handleDeleteTask}
        />
      </div>
    </div>
  );
}
