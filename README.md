# Mini Figma - frontend

A collaborative, real-time design tool frontend inspired by Figma

![Figma Clone - frontend](/screenshots/ui.png)

---

## Features

- **Canvas-based drawing** with [Konva.js](https://konvajs.org/) and [`react-konva`](https://konvajs.org/docs/react/index.html)
- **Interactive shapes**: move, resize, and style in real-time
- **Modern UI** built with [Shadcn UI](https://ui.shadcn.com/) and [TailwindCSS](https://tailwindcss.com/)
- **Fast build & HMR** using [Vite](https://vitejs.dev/)
- **Real-time collaboration** powered by [Yjs](https://yjs.dev/) *(integration WIP)*

---

## Tech Stack

- **React** – UI framework
- **Vite** – Fast bundler & dev server
- **TypeScript** – Type safety
- **Konva.js + react-konva** – 2D canvas rendering & interactivity
- **TailwindCSS** – Utility-first styling
- **Shadcn UI** – Prebuilt accessible components

---

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/figma-clone-frontend.git
   cd figma-clone-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

5. **Preview production build**
   ```bash
   npm run preview
   ```

---

## Project Structure

```
src/
├── components/      # Reusable UI components (Shadcn UI + custom)
    ├── ui/          # Reusable UI components (Shadcn UI)
├── hooks/           # Custom React hooks
├── App.tsx          # Main application component
├── const.tsx        # Global constants
├── context.tsx      # React context for global state
├── main.tsx         # Entry point
└── types.ts         # Shared types
```

---

## Configuration

- **TailwindCSS**: configured in `tailwind.config.js`
- **Shadcn UI**: generated components under `src/components/ui`
- **Vite**: main config in `vite.config.ts`


**Status:** 🚧 In Development
