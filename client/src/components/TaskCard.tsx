import type { Task, TaskStatus } from "../types/task";

type TaskCardProps = {
  task: Task;
  nextStatus: TaskStatus | null;
  onMoveForward: (task: Task, nextStatus: TaskStatus) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
};

const formatTimestamp = (value: string): string =>
  new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  });

export function TaskCard({
  task,
  nextStatus,
  onMoveForward,
  onDelete
}: TaskCardProps) {
  return (
    <article className="task-card">
      <div className="task-card__content">
        <div className="task-card__header">
          <h3>{task.title}</h3>
          <span className={`task-card__status task-card__status--${task.status}`}>
            {task.status.replace("-", " ")}
          </span>
        </div>
        <p>{task.description}</p>
        <dl className="task-card__meta">
          <div>
            <dt>Assignee</dt>
            <dd>{task.assignee}</dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>{formatTimestamp(task.createdAt)}</dd>
          </div>
          <div>
            <dt>Updated</dt>
            <dd>{formatTimestamp(task.updatedAt)}</dd>
          </div>
        </dl>
      </div>
      <div className="task-card__actions">
        {nextStatus ? (
          <button type="button" onClick={() => onMoveForward(task, nextStatus)}>
            Move Forward
          </button>
        ) : null}
        <button type="button" className="button-secondary" onClick={() => onDelete(task.id)}>
          Delete
        </button>
      </div>
    </article>
  );
}
