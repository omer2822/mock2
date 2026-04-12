import { startTransition, useEffect, useState } from "react";

import { SearchBar } from "./components/SearchBar";
import { TaskBoard } from "./components/TaskBoard";
import { TaskForm } from "./components/TaskForm";
import {
  ApiError,
  createTask,
  deleteTask,
  fetchTasks,
  undoTaskStatus,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [lastUndo, setLastUndo] = useState<{ taskId: string } | null>(null);

  const refreshTasks = async (): Promise<void> => {
    const nextTasks = await fetchTasks();

    startTransition(() => {
      setTasks(nextTasks);
      setErrorMessage(null);
    });
  };

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const visibleTasks = tasks.filter((task) => {
    if (!normalizedSearchQuery) {
      return true;
    }

    return (
      task.title.toLowerCase().includes(normalizedSearchQuery) ||
      task.assignee.toLowerCase().includes(normalizedSearchQuery)
    );
  });

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
      setLastUndo(null);

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
      setLastUndo({ taskId: task.id });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  };

  const handleDeleteTask = async (taskId: string): Promise<void> => {
    try {
      await deleteTask(taskId);
      await refreshTasks();
      setLastUndo(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  };

  const handleUndo = async (): Promise<void> => {
    if (!lastUndo) {
      return;
    }

    try {
      await undoTaskStatus(lastUndo.taskId);
      await refreshTasks();
      setLastUndo(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  };

  return (
    <div className="app-shell">
      <div className="app-shell__content">
        <TaskForm onSubmit={handleCreateTask} />
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        {lastUndo ? (
          <div className="undo-banner" role="status">
            <span>Task moved.</span>
            <button type="button" onClick={handleUndo}>
              Undo
            </button>
          </div>
        ) : null}
        {errorMessage ? (
          <div className="error-banner" role="alert">
            {errorMessage}
          </div>
        ) : null}
        <TaskBoard
          tasks={visibleTasks}
          onMoveForward={handleMoveForward}
          onDelete={handleDeleteTask}
        />
      </div>
    </div>
  );
}
