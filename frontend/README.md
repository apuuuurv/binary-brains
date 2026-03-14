# 🌾 AgriSense - Frontend

The frontend of **AgriSense**, a modern web application designed for farmers to discover schemes, verify documents, and interact with an AI chatbot.

## ✨ Features

- **Interactive Landing Page**: High-performance animations using GSAP and Framer Motion.
- **Profile Wizard**: Dynamic multi-step form for farmer registration.
- **Dashboard**: Real-time localized scheme recommendations.
- **Community Hub**: Social features for sharing farmer success stories.
- **3D Visuals**: Immersive elements powered by Three.js and React Three Fiber.
- **Responsive Design**: Mobile-first approach with Tailwind CSS.

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/), [GSAP](https://gsap.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: React Context / Hooks
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   Create a `.env` file in the root of the frontend directory and add:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

## 🏗️ Build

To build for production:
```bash
npm run build
```
The output will be in the `dist` folder.
