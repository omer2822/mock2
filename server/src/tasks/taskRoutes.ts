import { Router } from "express";

import {
  createTask,
  deleteTask,
  findTaskById,
  listTasks,
  updateTaskStatus
} from "./taskStore.js";
import {
  validateCreateTaskInput,
  validateStatusFilter,
  validateStatusTransition
} from "./taskValidation.js";

export const taskRouter = Router();

taskRouter.post("/", (request, response) => {
  const validation = validateCreateTaskInput(request.body as Record<string, unknown>);

  if (validation.error) {
    return response.status(400).json({ error: validation.error });
  }

  const task = createTask(validation.data!);

  return response.status(201).json(task);
});

taskRouter.get("/", (request, response) => {
  const validation = validateStatusFilter(request.query.status);

  if (validation.error) {
    return response.status(400).json({ error: validation.error });
  }

  return response.status(200).json(listTasks(validation.status));
});

taskRouter.patch("/:id", (request, response) => {
  const existingTask = findTaskById(request.params.id);

  if (!existingTask) {
    return response.status(404).json({ error: "Task not found" });
  }

  const validation = validateStatusTransition(existingTask.status, request.body?.status);

  if (validation.error) {
    return response.status(400).json({ error: validation.error });
  }

  const updatedTask = updateTaskStatus(existingTask.id, validation.status!);

  return response.status(200).json(updatedTask);
});

taskRouter.delete("/:id", (request, response) => {
  const deleted = deleteTask(request.params.id);

  if (!deleted) {
    return response.status(404).json({ error: "Task not found" });
  }

  return response.status(204).send();
});
