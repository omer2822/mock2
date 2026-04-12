import express from "express";

import { taskRouter } from "./tasks/taskRoutes.js";

export const app = express();

app.use(express.json());
app.use("/api/tasks", taskRouter);
