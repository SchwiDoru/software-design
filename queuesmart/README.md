# Frontend Setup

The frontend is built with **React** and **Vite**, located in the `queuesmart/` folder.

## Prerequisites

Make sure you have **Node.js** (v18 or higher) installed.

```bash
# Verify Node.js installation
node --version

# Verify npm installation
npm --version
```

If Node.js is not installed, download it from [https://nodejs.org](https://nodejs.org).

## Environment Variables

Vite requires environment variables to be prefixed with `VITE_` to be accessible in the app.

Create a `.env` file inside the `queuesmart/` folder:

```bash
touch queuesmart/.env
```

Then add the following:

```env
VITE_API_URL=https://localhost:5173
```

> **Note:** Update `VITE_API_URL` to match wherever your backend is running. This variable is used throughout the app to make API requests.

---

## Getting Started

### 1. Navigate to the project folder

```bash
cd queuesmart
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` by default.

---

## Available Scripts

Run these commands from inside the `queuesmart/` folder.

| Command | Description |
|---|---|
| `npm run dev` | Starts the local development server with hot reload |
| `npm run build` | Bundles the app for production into `dist/` |
| `npm run preview` | Previews the production build locally |
| `npm run lint` | Runs the linter to check for code issues |
