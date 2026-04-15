# Team Task Board

A full-stack task management app with a React frontend and Express backend.

## Project Structure

```
mock2/
├── client/   # React + TypeScript (Vite)
└── server/   # Express + TypeScript
```

## Getting Started

Install root dependencies:

```bash
npm install
```

Then install dependencies in each workspace:

```bash
npm --prefix client install
npm --prefix server install
```

### Run in development

```bash
npm run dev
```

This starts both the client (Vite dev server) and server (tsx watch) concurrently.

## Features

- View tasks organized by status: **Todo**, **In Progress**, **Done**
- Create tasks with a title, description, and assignee
- Search/filter tasks
- RESTful API at `/api/tasks`

## Tech Stack

| Layer    | Tech                          |
|----------|-------------------------------|
| Frontend | React 19, TypeScript, Vite    |
| Backend  | Express 5, TypeScript, tsx    |
| Testing  | Vitest, Testing Library       |

## Running Tests

```bash
# All tests
npm test

# Server only
npm run test:server

# Client only
npm run test:client
```
