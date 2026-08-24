# NASMR Civic Platform

**NASMR** is a next-generation civic engagement and reporting platform. It empowers citizens to report local issues (such as infrastructure damage, sanitation problems, or public hazards) and uses AI to automatically categorize, cluster, and prioritize these reports for city administrators.

This project is structured as a **Monorepo** managed by [Bun workspaces](https://bun.sh/).

---

## 🏗️ Architecture

The platform is split into three main applications and shared packages:

1.  **Frontend Web (`apps/web`)**: A highly responsive, modern dashboard and reporting interface built with React, Vite, and TailwindCSS.
2.  **Backend API (`apps/api`)**: A high-performance Fastify REST API. It handles authentication, data persistence via Prisma (PostgreSQL), and rate-limiting/caching via Redis.
3.  **AI Service (`apps/ai`)**: A dedicated Python FastAPI microservice. It handles heavy machine learning tasks such as audio transcription (voice reports), embeddings for finding similar reports, and density-based clustering of civic issues.
4.  **Shared Types (`packages/types`)**: TypeScript definitions shared across the monorepo to ensure end-to-end type safety.

---

## 🚀 Key Features

*   **Multimodal Reporting**: Submit reports via text, images, or direct voice recordings.
*   **AI-Powered Analysis**: Automatically categorizes reports and assigns priority using Large Language Models (Groq / OpenAI).
*   **Geospatial Clustering**: Groups similar reports in the same geographic area to help authorities identify widespread issues (e.g., multiple reports of the same pothole).
*   **Real-time Dashboard**: Interactive map view (MapLibre/Mapbox) of civic issues.

---

## 🛠️ Prerequisites

To run this project locally, you will need:
*   [Bun](https://bun.sh/) (Runtime & Package Manager)
*   [Python 3.10+](https://www.python.org/downloads/) (For the AI Service)
*   [Docker](https://www.docker.com/) (For local PostgreSQL and Redis infrastructure)

---

## ⚙️ Setup & Configuration

### 1. Install Dependencies
Run the following at the root of the project to install all monorepo dependencies:
```bash
bun install
```

### 2. Environment Variables
You need to configure the `.env` files for each specific application. We have separated these for better security and context. 

Copy the required keys into the following files (create them if they don't exist based on `.env.example` if available):
*   `apps/web/.env` - Needs `VITE_API_URL` and `VITE_AI_URL`.
*   `apps/api/.env` - Needs `DATABASE_URL`, `REDIS_URL`, `AI_SERVICE_URL`, and JWT secrets.
*   `apps/ai/.env` - Needs `GROQ_API_KEY` or `OPENAI_API_KEY` for the LLM provider.

### 3. Start Local Infrastructure
Start the local PostgreSQL database and Redis cache using Docker:
```bash
bun run infra:up
```

### 4. Database Setup
Push the database schema and (optionally) seed it with initial data:
```bash
cd apps/api
bunx prisma db push
bun run seed
cd ../../
```

---

## 💻 Running the Application

You can start the different parts of the application using the scripts defined in the root `package.json`.

**1. Start the API and Web Frontend:**
```bash
# This concurrently starts Fastify (port 3001) and Vite (port 5173)
bun run dev
```

**2. Start the AI Microservice (in a separate terminal):**
```bash
# This starts the FastAPI python server (port 8000)
bun run dev:ai
```

---

## 🛑 Stopping the Platform

To stop the development servers, use `Ctrl + C` in your terminals.
To spin down the Docker infrastructure (Database & Redis), run:
```bash
bun run infra:down
```

---

## 🤝 Contributing

When contributing to this repository, please ensure that you:
1. Maintain type safety by updating `packages/types` if API contracts change.
2. Ensure your code passes the linting and formatting rules.
3. Keep the `.env` files strictly out of version control (they are ignored by default).
