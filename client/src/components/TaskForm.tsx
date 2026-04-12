import { useState } from "react";

import type { CreateTaskInput } from "../types/task";

type TaskFormProps = {
  onSubmit: (task: CreateTaskInput) => Promise<boolean>;
};

const initialValues: CreateTaskInput = {
  title: "",
  description: "",
  assignee: ""
};

export function TaskForm({ onSubmit }: TaskFormProps) {
  const [values, setValues] = useState<CreateTaskInput>(initialValues);

  const updateField = (field: keyof CreateTaskInput, value: string) => {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const wasSuccessful = await onSubmit({
      title: values.title.trim(),
      description: values.description.trim(),
      assignee: values.assignee.trim()
    });

    if (wasSuccessful) {
      setValues(initialValues);
    }
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <div className="task-form__header">
        <div>
          <p className="eyebrow">Create Task</p>
          <h1>Team Task Board</h1>
        </div>
        <p className="task-form__intro">
          Capture work quickly, move it across the board, and keep the whole team aligned.
        </p>
      </div>
      <div className="task-form__grid">
        <label>
          <span>Title</span>
          <input
            name="title"
            value={values.title}
            onChange={(event) => updateField("title", event.target.value)}
          />
        </label>
        <label>
          <span>Assignee</span>
          <input
            name="assignee"
            value={values.assignee}
            onChange={(event) => updateField("assignee", event.target.value)}
          />
        </label>
        <label className="task-form__description">
          <span>Description</span>
          <textarea
            name="description"
            rows={4}
            value={values.description}
            onChange={(event) => updateField("description", event.target.value)}
          />
        </label>
      </div>
      <button type="submit">Add Task</button>
    </form>
  );
}
