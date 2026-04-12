import { randomUUID } from "node:crypto";

import type { CreateTaskInput, Task, TaskStatus } from "./task.types.js";

let tasks: Task[] = [];

export const resetTaskStore = (): void => {
  tasks = [];
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

  task.status = status;
  task.updatedAt = new Date().toISOString();

  return task;
};

export const deleteTask = (id: string): boolean => {
  const initialLength = tasks.length;
  tasks = tasks.filter((task) => task.id !== id);

  return tasks.length < initialLength;
};
