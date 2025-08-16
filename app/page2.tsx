"use client";

import { useState } from "react";
import PostureCamera from "@/components/PostureCamera";
import { PostureAnalysisResult } from "@/lib/roboflow";

export default function Home() {
  const [selectedExercise, setSelectedExercise] = useState<
    "squat" | "bench" | "deadlift"
  >("squat");
  const [analysisHistory, setAnalysisHistory] = useState<
    PostureAnalysisResult[]
  >([]);

  const handleAnalysisResult = (result: PostureAnalysisResult) => {
    setAnalysisHistory((prev) => [result, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Coachly</h1>
            <p className="text-gray-600">AI-Powered Form Analysis</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Exercise Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Select Exercise</h2>
          <div className="grid grid-cols-3 gap-4 max-w-md">
            {(["squat", "bench", "deadlift"] as const).map((exercise) => (
              <button
                key={exercise}
                onClick={() => setSelectedExercise(exercise)}
                className={`p-4 rounded-lg text-center font-medium transition-all ${
                  selectedExercise === exercise
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {exercise.charAt(0).toUpperCase() + exercise.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Current Exercise Info */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border">
          <h3 className="text-xl font-semibold mb-2">
            {selectedExercise.charAt(0).toUpperCase() +
              selectedExercise.slice(1)}{" "}
            Analysis
          </h3>
          <p className="text-gray-600">
            Position yourself in front of the camera and perform your{" "}
            {selectedExercise}. The AI will analyze your form and provide
            real-time feedback.
          </p>
        </div>

        {/* Posture Camera Component */}
        <div className="mb-8">
          <PostureCamera
            selectedExercise={selectedExercise}
            onAnalysisResult={handleAnalysisResult}
          />
        </div>

        {/* Analysis History */}
        {analysisHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-xl font-semibold mb-4">
              Recent Analysis History
            </h3>
            <div className="space-y-3">
              {analysisHistory.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    result.isGoodPosture
                      ? "bg-green-50 border-green-200"
                      : "bg-yellow-50 border-yellow-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {result.isGoodPosture
                        ? "✅ Good Form"
                        : "⚠️ Needs Improvement"}
                    </span>
                    <span className="text-sm text-gray-500">
                      {Math.round(result.confidence * 100)}% confidence
                    </span>
                  </div>
                  {result.feedback.length > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      {result.feedback[0]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>Powered by Roboflow AI • Keep practicing for perfect form!</p>
        </footer>
      </main>
    </div>
  );
}
