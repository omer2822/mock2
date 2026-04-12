import { TaskCard } from "./TaskCard";
import type { Task, TaskStatus } from "../types/task";

type TaskColumnProps = {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  nextStatus: TaskStatus | null;
  onMoveForward: (task: Task, nextStatus: TaskStatus) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
};

export function TaskColumn({
  title,
  status,
  tasks,
  nextStatus,
  onMoveForward,
  onDelete
}: TaskColumnProps) {
  const headingId = `column-heading-${status}`;

  return (
    <section className="task-column" aria-labelledby={headingId}>
      <div className="task-column__header">
        <h2 id={headingId}>{title}</h2>
        <span>{tasks.length}</span>
      </div>
      <div className="task-column__body">
        {tasks.length === 0 ? (
          <p className="task-column__empty">No tasks in this lane yet.</p>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              nextStatus={nextStatus}
              onMoveForward={onMoveForward}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </section>
  );
}
