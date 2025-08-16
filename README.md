# Coachly - AI-Powered Gym Form Analyzer

An intelligent fitness application that uses Roboflow's computer vision API to analyze gym exercise form in real-time. Coachly helps users improve their squat, bench press, and deadlift technique through pose detection and personalized feedback.

## Features

- **Real-time Posture Analysis**: Uses AI to analyze your form as you exercise
- **Exercise-Specific Feedback**: Tailored advice for squats, bench press, and deadlifts
- **Visual Pose Detection**: See your pose keypoints and skeleton visualization
- **Camera Integration**: Works with your device's camera for live analysis
- **Responsive Design**: Clean, Vercel-inspired UI that works on all devices

## Setup

### Environment Variables

1. Copy the example environment file:

   ```bash
   cp .env.example .env.local
   ```

2. Add your Roboflow API key to `.env.local`:
   ```
   NEXT_PUBLIC_ROBOFLOW_API_KEY=your_actual_api_key_here
   ```

### Installation

```bash
npm install
# or
yarn install
```

### Development

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Technology Stack

- **Next.js 15** - React framework with TypeScript
- **Tailwind CSS** - Utility-first CSS framework
- **Roboflow API** - Computer vision and pose detection
- **Camera API** - Real-time video capture and analysis

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).