# <img src="https://i.imgur.com/C2PZRhJ.png" alt="Coachly Icon" width="32" height="32" style="vertical-align: middle;"> Coachly - AI-Powered Gym Form Analyzer

An intelligent fitness application that uses Roboflow's computer vision API to analyze gym exercise form in real-time. Coachly helps users improve their squat, bench press, and deadlift technique through pose detection and personalized feedback.

## Features

- **Real-time Posture Analysis**: Uses AI to analyze your form as you exercise
- **Exercise-Specific Feedback**: Tailored advice for squats, bench press, and deadlifts
- **Visual Pose Detection**: See your pose keypoints and skeleton visualization
- **Camera Integration**: Works with your device's camera for live analysis
- **Responsive Design**: Clean, Vercel-inspired UI that works on all devices

## Screenshots

### Main Interface

![Coachly Application Interface](https://i.imgur.com/s1YVgls.png)

_Coachly's main interface showing real-time camera feed, AI pose analysis, exercise feedback, and analysis history in a clean, modern layout._

### AI Analysis in Action
[Watch the demo video](https://youtu.be/VLzXwiAClsU)
![AI Analysis Sample](https://i.imgur.com/jBiBpVZ.png)  

_Sample analysis showing pose detection, real-time feedback, and personalized recommendations for improving squat form._
## Hackathon Project

Coachly was developed as part of [Ignition Hacks 2025](https://ignition-hacks-v-6.devpost.com/), a student-led hackathon focused on empowering future innovators and supporting tech education. The project showcases how AI and computer vision can make fitness more accessible, personalized, and effective for everyone.

### Future Development Roadmap

To evolve Coachly from a hackathon prototype into a robust fitness platform, the following enhancements are planned:

- **User Accounts & Data Storage**: Secure authentication and database integration for tracking progress and workout history.
- **Cloud Deployment**: Scalable hosting for reliable access and data persistence.
- **Progress Analytics**: Visual charts and metrics to help users monitor improvement.
- **Workout Programs**: Structured plans and personalized recommendations.
- **Community Features**: Social sharing, friendly competitions, and group challenges.
- **Mobile & Video Support**: Native apps and session recording for flexible use.
- **Advanced AI**: Expanded exercise detection, injury prevention, and wearable integration.
- **Professional Tools**: Dashboards for trainers and premium features for advanced users.

Coachly demonstrates how technology can encourage healthier lifestyles, provide personalized guidance, and foster supportive communities. By leveraging AI for real-time feedback and progress tracking, it helps users build confidence and achieve their fitness goals. The project reflects the spirit of Ignition Hacks, using innovation to create positive impact and prepare students for the future of tech.

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
