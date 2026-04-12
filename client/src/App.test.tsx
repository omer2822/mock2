import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";
import type { Task } from "./types/task";

const mockFetch = vi.fn<typeof fetch>();

const createTask = (overrides: Partial<Task> = {}): Task => ({
  id: "task-1",
  title: "Draft release notes",
  description: "Prepare the notes for the sprint release.",
  assignee: "Ava",
  status: "todo",
  createdAt: "2026-04-12T10:00:00.000Z",
  updatedAt: "2026-04-12T10:00:00.000Z",
  ...overrides
});

const mockJsonResponse = (body: unknown, status = 200): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body)
  }) as Response;

describe("App", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal("fetch", mockFetch);
  });

  it("renders tasks grouped by status", async () => {
    const todoTask = createTask();
    const inProgressTask = createTask({
      id: "task-2",
      title: "Prepare demo agenda",
      status: "in-progress"
    });
    const doneTask = createTask({
      id: "task-3",
      title: "Ship sprint recap",
      status: "done"
    });

    mockFetch.mockResolvedValueOnce(
      mockJsonResponse([todoTask, inProgressTask, doneTask])
    );

    render(<App />);

    const todoColumn = await screen.findByRole("region", { name: "To Do" });
    const inProgressColumn = screen.getByRole("region", { name: "In Progress" });
    const doneColumn = screen.getByRole("region", { name: "Done" });

    expect(
      await within(todoColumn).findByText("Draft release notes")
    ).toBeInTheDocument();
    expect(
      await within(inProgressColumn).findByText("Prepare demo agenda")
    ).toBeInTheDocument();
    expect(await within(doneColumn).findByText("Ship sprint recap")).toBeInTheDocument();
  });

  it("submits the form and re-renders with the new task", async () => {
    const createdTask = createTask();

    mockFetch
      .mockResolvedValueOnce(mockJsonResponse([]))
      .mockResolvedValueOnce(mockJsonResponse(createdTask, 201))
      .mockResolvedValueOnce(mockJsonResponse([createdTask]));

    render(<App />);

    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Title"), "Draft release notes");
    await user.type(
      screen.getByLabelText("Description"),
      "Prepare the notes for the sprint release."
    );
    await user.type(screen.getByLabelText("Assignee"), "Ava");
    await user.click(screen.getByRole("button", { name: "Add Task" }));

    expect(await screen.findByText("Draft release notes")).toBeInTheDocument();
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      "/api/tasks",
      expect.objectContaining({
        method: "POST"
      })
    );
  });

  it("advances a task and re-renders after refetch", async () => {
    const todoTask = createTask();
    const updatedTask = {
      ...todoTask,
      status: "in-progress" as const,
      updatedAt: "2026-04-12T10:05:00.000Z"
    };

    mockFetch
      .mockResolvedValueOnce(mockJsonResponse([todoTask]))
      .mockResolvedValueOnce(mockJsonResponse(updatedTask))
      .mockResolvedValueOnce(mockJsonResponse([updatedTask]));

    render(<App />);

    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Move Forward" }));

    await waitFor(() => {
      const inProgressColumn = screen.getByRole("region", { name: "In Progress" });
      expect(within(inProgressColumn).getByText("Draft release notes")).toBeInTheDocument();
    });
  });

  it("deletes a task and removes it after refetch", async () => {
    const task = createTask();

    mockFetch
      .mockResolvedValueOnce(mockJsonResponse([task]))
      .mockResolvedValueOnce(mockJsonResponse({}, 204))
      .mockResolvedValueOnce(mockJsonResponse([]));

    render(<App />);

    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(screen.queryByText("Draft release notes")).not.toBeInTheDocument();
    });
  });

  it("displays API error messages when an action fails", async () => {
    const task = createTask();

    mockFetch
      .mockResolvedValueOnce(mockJsonResponse([task]))
      .mockResolvedValueOnce(
        mockJsonResponse({ error: "Invalid status transition" }, 400)
      );

    render(<App />);

    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Move Forward" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid status transition"
    );
    expect(screen.getByText("Draft release notes")).toBeInTheDocument();
  });

  it("clears a previous error after the next successful action", async () => {
    const task = createTask();

    mockFetch
      .mockResolvedValueOnce(mockJsonResponse([]))
      .mockResolvedValueOnce(mockJsonResponse({ error: "title is required" }, 400))
      .mockResolvedValueOnce(mockJsonResponse(task, 201))
      .mockResolvedValueOnce(mockJsonResponse([task]));

    render(<App />);

    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Add Task" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("title is required");

    await user.type(screen.getByLabelText("Title"), "Draft release notes");
    await user.type(
      screen.getByLabelText("Description"),
      "Prepare the notes for the sprint release."
    );
    await user.type(screen.getByLabelText("Assignee"), "Ava");
    await user.click(screen.getByRole("button", { name: "Add Task" }));

    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  it("shows created timestamps on task cards", async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse([createTask()]));

    render(<App />);

    expect(await screen.findByText("Created")).toBeInTheDocument();
  });

  it("filters tasks by title in real time", async () => {
    mockFetch.mockResolvedValueOnce(
      mockJsonResponse([
        createTask(),
        createTask({ id: "task-2", title: "Prepare demo agenda", assignee: "Mia" })
      ])
    );

    render(<App />);

    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Search tasks"), "demo");

    expect(screen.getByText("Prepare demo agenda")).toBeInTheDocument();
    expect(screen.queryByText("Draft release notes")).not.toBeInTheDocument();
  });

  it("filters tasks by assignee in real time", async () => {
    mockFetch.mockResolvedValueOnce(
      mockJsonResponse([
        createTask(),
        createTask({ id: "task-2", title: "Prepare demo agenda", assignee: "Mia" })
      ])
    );

    render(<App />);

    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Search tasks"), "mia");

    expect(screen.getByText("Prepare demo agenda")).toBeInTheDocument();
    expect(screen.queryByText("Draft release notes")).not.toBeInTheDocument();
  });

  it("shows an undo button after moving a task forward", async () => {
    const todoTask = createTask();
    const updatedTask = {
      ...todoTask,
      status: "in-progress" as const,
      updatedAt: "2026-04-12T10:05:00.000Z"
    };

    mockFetch
      .mockResolvedValueOnce(mockJsonResponse([todoTask]))
      .mockResolvedValueOnce(mockJsonResponse(updatedTask))
      .mockResolvedValueOnce(mockJsonResponse([updatedTask]));

    render(<App />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Move Forward" }));

    expect(await screen.findByRole("button", { name: "Undo" })).toBeInTheDocument();
  });

  it("undoes the last move and restores the task to the previous column", async () => {
    const todoTask = createTask();
    const updatedTask = {
      ...todoTask,
      status: "in-progress" as const,
      updatedAt: "2026-04-12T10:05:00.000Z"
    };

    mockFetch
      .mockResolvedValueOnce(mockJsonResponse([todoTask]))
      .mockResolvedValueOnce(mockJsonResponse(updatedTask))
      .mockResolvedValueOnce(mockJsonResponse([updatedTask]))
      .mockResolvedValueOnce(mockJsonResponse(todoTask))
      .mockResolvedValueOnce(mockJsonResponse([todoTask]));

    render(<App />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Move Forward" }));
    await user.click(await screen.findByRole("button", { name: "Undo" }));

    await waitFor(() => {
      const todoColumn = screen.getByRole("region", { name: "To Do" });
      expect(within(todoColumn).getByText("Draft release notes")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Undo" })).not.toBeInTheDocument();
    });
  });

  it("clears the undo banner after a delete", async () => {
    const task = createTask();
    const updatedTask = { ...task, status: "in-progress" as const };

    mockFetch
      .mockResolvedValueOnce(mockJsonResponse([task]))
      .mockResolvedValueOnce(mockJsonResponse(updatedTask))
      .mockResolvedValueOnce(mockJsonResponse([updatedTask]))
      .mockResolvedValueOnce(mockJsonResponse({}, 204))
      .mockResolvedValueOnce(mockJsonResponse([]));

    render(<App />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Move Forward" }));
    expect(await screen.findByRole("status")).toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });
});
