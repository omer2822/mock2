import { TaskColumn } from "./TaskColumn";
import type { Task, TaskStatus } from "../types/task";

type TaskBoardProps = {
  tasks: Task[];
  onMoveForward: (task: Task, nextStatus: TaskStatus) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
};

const columnConfig: Array<{
  title: string;
  status: TaskStatus;
  nextStatus: TaskStatus | null;
}> = [
  { title: "To Do", status: "todo", nextStatus: "in-progress" },
  { title: "In Progress", status: "in-progress", nextStatus: "done" },
  { title: "Done", status: "done", nextStatus: null }
];

export function TaskBoard({ tasks, onMoveForward, onDelete }: TaskBoardProps) {
  return (
    <div className="task-board">
      {columnConfig.map((column) => (
        <TaskColumn
          key={column.status}
          title={column.title}
          status={column.status}
          tasks={tasks.filter((task) => task.status === column.status)}
          nextStatus={column.nextStatus}
          onMoveForward={onMoveForward}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
