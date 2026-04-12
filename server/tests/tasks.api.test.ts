import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { app } from "../src/app";
import { resetTaskStore } from "../src/tasks/taskStore";
import type { Task, TaskStatus } from "../src/tasks/task.types";

type CreateTaskInput = {
  title?: string;
  description?: string;
  assignee?: string;
};

const createTask = async (overrides: CreateTaskInput = {}): Promise<Task> => {
  const response = await request(app)
    .post("/api/tasks")
    .send({
      title: "Draft release notes",
      description: "Prepare the notes for the sprint release.",
      assignee: "Ava",
      ...overrides
    });

  expect(response.status).toBe(201);

  return response.body as Task;
};

describe("tasks API", () => {
  beforeEach(() => {
    resetTaskStore();
  });

  it("creates a task with todo status and timestamps", async () => {
    const response = await request(app).post("/api/tasks").send({
      title: "Draft release notes",
      description: "Prepare the notes for the sprint release.",
      assignee: "Ava"
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      title: "Draft release notes",
      description: "Prepare the notes for the sprint release.",
      assignee: "Ava",
      status: "todo"
    });
    expect(response.body.id).toEqual(expect.any(String));
    expect(response.body.createdAt).toEqual(expect.any(String));
    expect(response.body.updatedAt).toEqual(expect.any(String));
    expect(response.body.createdAt).toBe(response.body.updatedAt);
  });

  it.each([
    { field: "title", value: "", message: "title is required" },
    { field: "description", value: "   ", message: "description is required" },
    { field: "assignee", value: "", message: "assignee is required" }
  ])("rejects blank $field values on create", async ({ field, value, message }) => {
    const response = await request(app).post("/api/tasks").send({
      title: "Draft release notes",
      description: "Prepare the notes for the sprint release.",
      assignee: "Ava",
      [field]: value
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: message });
  });

  it("returns all tasks sorted newest-first", async () => {
    const firstTask = await createTask({
      title: "Review pull request",
      assignee: "Noah"
    });
    const secondTask = await createTask({
      title: "Prepare demo agenda",
      assignee: "Mia"
    });

    const response = await request(app).get("/api/tasks");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0]).toMatchObject({
      id: secondTask.id,
      title: "Prepare demo agenda"
    });
    expect(response.body[1]).toMatchObject({
      id: firstTask.id,
      title: "Review pull request"
    });
  });

  it("filters tasks by status", async () => {
    const todoTask = await createTask({
      title: "Review pull request"
    });
    const inProgressTask = await createTask({
      title: "Prepare demo agenda"
    });

    await request(app)
      .patch(`/api/tasks/${inProgressTask.id}`)
      .send({ status: "in-progress" })
      .expect(200);

    const response = await request(app).get("/api/tasks").query({
      status: "todo" satisfies TaskStatus
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      id: todoTask.id,
      status: "todo"
    });
  });

  it("rejects invalid status filters", async () => {
    const response = await request(app).get("/api/tasks").query({
      status: "blocked"
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Invalid status filter" });
  });

  it("allows a todo task to move to in-progress", async () => {
    const task = await createTask();

    const response = await request(app)
      .patch(`/api/tasks/${task.id}`)
      .send({ status: "in-progress" });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: task.id,
      status: "in-progress"
    });
    expect(new Date(response.body.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(response.body.createdAt).getTime()
    );
  });

  it("allows an in-progress task to move to done", async () => {
    const task = await createTask();

    await request(app)
      .patch(`/api/tasks/${task.id}`)
      .send({ status: "in-progress" })
      .expect(200);

    const response = await request(app)
      .patch(`/api/tasks/${task.id}`)
      .send({ status: "done" });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: task.id,
      status: "done"
    });
  });

  it("rejects skipped status transitions", async () => {
    const task = await createTask();

    const response = await request(app).patch(`/api/tasks/${task.id}`).send({
      status: "done"
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Invalid status transition" });
  });

  it("rejects same-state transitions", async () => {
    const task = await createTask();

    const response = await request(app).patch(`/api/tasks/${task.id}`).send({
      status: "todo"
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Invalid status transition" });
  });

  it("returns 404 when updating a missing task", async () => {
    const response = await request(app)
      .patch("/api/tasks/missing-task")
      .send({ status: "in-progress" });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Task not found" });
  });

  it("deletes an existing task", async () => {
    const task = await createTask();

    const deleteResponse = await request(app).delete(`/api/tasks/${task.id}`);
    const listResponse = await request(app).get("/api/tasks");

    expect(deleteResponse.status).toBe(204);
    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toEqual([]);
  });

  it("returns 404 when deleting a missing task", async () => {
    const response = await request(app).delete("/api/tasks/missing-task");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Task not found" });
  });
});
