import { randomUUID } from "node:crypto";

import type { CreateTaskInput, Task, TaskStatus } from "./task.types.js";

let tasks: Task[] = [];
const previousStatusMap = new Map<string, TaskStatus>();

export const resetTaskStore = (): void => {
  tasks = [];
  previousStatusMap.clear();
};

export const createTask = (input: CreateTaskInput): Task => {
  const timestamp = new Date().toISOString();
  const task: Task = {
    id: randomUUID(),
    title: input.title,
    description: input.description,
    assignee: input.assignee,
    status: "todo",
    createdAt: timestamp,
    updatedAt: timestamp
  };

  tasks.unshift(task);

  return task;
};

export const listTasks = (status?: TaskStatus): Task[] =>
  tasks.filter((task) => (status ? task.status === status : true));

export const findTaskById = (id: string): Task | undefined =>
  tasks.find((task) => task.id === id);

export const updateTaskStatus = (id: string, status: TaskStatus): Task | undefined => {
  const task = findTaskById(id);

  if (!task) {
    return undefined;
  }

  previousStatusMap.set(id, task.status);
  task.status = status;
  task.updatedAt = new Date().toISOString();

  return task;
};

export const undoTaskStatus = (
  id: string
): Task | "not-found" | "no-history" => {
  const task = findTaskById(id);

  if (!task) {
    return "not-found";
  }

  const previousStatus = previousStatusMap.get(id);

  if (!previousStatus) {
    return "no-history";
  }

  task.status = previousStatus;
  task.updatedAt = new Date().toISOString();
  previousStatusMap.delete(id);

  return task;
};

export const deleteTask = (id: string): boolean => {
  const initialLength = tasks.length;
  tasks = tasks.filter((task) => task.id !== id);
  previousStatusMap.delete(id);

  return tasks.length < initialLength;
};
