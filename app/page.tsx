"use client";

import { useState } from "react";
import PostureCamera from "@/components/PostureCamera";
import { PostureAnalysisResult } from "@/lib/roboflow";

export default function Home() {
  const [selectedExercise, setSelectedExercise] = useState<
    "squat" | "bench" | "deadlift" | "add"
  >("squat");
  const [analysisHistory, setAnalysisHistory] = useState<
    PostureAnalysisResult[]
  >([]);

  const handleAnalysisResult = (result: PostureAnalysisResult) => {
    setAnalysisHistory((prev) => [result, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E3F4FE] via-[#AABFF8]/60 via-[#DFCCF9]/40 via-[#CBCIFB]/60 to-[#F5EBF2]">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(186,181,242,0.1)_0%,transparent_50%)] pointer-events-none"></div>

      {/* Header */}
      <header className="relative bg-white/90 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-[#6f29a4]">
                <img
                  src="/coachly.png"
                  alt="Coachly Icon"
                  className="w-full h-full object-cover"
                />
              </div>
              <h1 className="text-2xl font-bold text-black">Coachly</h1>
            </div>
            <p className="text-gray-600 text-sm">AI-Powered Form Analysis</p>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Exercise Selection */}
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold mb-2 text-black">
            Select Exercise
          </h2>
          <p className="text-gray-600 mb-8">
            Choose the exercise you want to analyze
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {(["squat", "bench", "deadlift", "add"] as const).map((exercise) => (
              <button
                key={exercise}
                onClick={() => setSelectedExercise(exercise)}
                className={`p-6 rounded-xl text-center font-medium transition-all border hover:shadow-lg ${
                  selectedExercise === exercise
                    ? "bg-[#6f29a4] text-white border-[#6f29a4] shadow-lg"
                    : "bg-white text-gray-900 border-gray-200 hover:border-[#bab5f2]/50"
                }`}
              >
                <div className="flex justify-center mb-2">
                  {exercise === "squat" && 
                  <div className="w-14 h-14 rounded-lg overflow-hidden flex items-center justify-center bg-[#6f29a4]">
                    <img
                      src="/squat.png"
                      alt="Squat Icon"
                      className="w-full h-full object-cover"
                    />
                  </div>
                      } 
                      {exercise === "bench" && 
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex items-center justify-center bg-[#6f29a4]">
                    <img
                      src="/bench.png"
                      alt="Bench Icon"
                      className="w-full h-full object-cover"
                    />
                  </div>
                      }
                      {exercise === "deadlift" && 
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex items-center justify-center bg-[#6f29a4]">
                    <img
                      src="/deadlift.png"
                      alt="Deadlift Icon"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  }
                  {exercise === "add" && 
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex items-center justify-center bg-[#6f29a4]">
                        <div className="text-white text-2xl font-bold">+</div>
                      </div>
                  }
                </div>
                {exercise === "add" ? "Add Exercise" : exercise.charAt(0).toUpperCase() + exercise.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Current Exercise Info */}
        <div className="mb-12 p-8 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <h3 className="text-xl font-semibold mb-4 text-center text-black">
            {selectedExercise === "add" 
              ? "Add New Exercise" 
              : `${selectedExercise.charAt(0).toUpperCase() + selectedExercise.slice(1)} Analysis`}
          </h3>
          <p className="text-gray-600 text-center leading-relaxed">
            {selectedExercise === "add" 
              ? "This feature will allow you to add custom exercises in future updates. Stay tuned!"
              : `Position yourself in front of the camera and perform your ${selectedExercise}. Our AI will analyze your form and provide real-time feedback to help you improve.`}
          </p>
        </div>

        {/* Posture Camera Component */}
        {selectedExercise !== "add" && (
          <div className="mb-12">
            <PostureCamera
              selectedExercise={selectedExercise as "squat" | "bench" | "deadlift"}
              onAnalysisResult={handleAnalysisResult}
              analysisHistory={analysisHistory}
            />
          </div>
        )}

        {/* Footer */}
        <footer className="mt-20 text-center">
          <p className="text-sm text-gray-500">
            Powered by Roboflow AI • Keep practicing for perfect form
          </p>
        </footer>
      </main>
    </div>
  );
}
