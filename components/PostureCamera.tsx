"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import {
  analyzePosture,
  captureImageFromVideo,
  PostureAnalysisResult,
  getExerciseTips,
} from "@/lib/roboflow";

interface PostureCameraProps {
  selectedExercise: "squat" | "bench" | "deadlift";
  onAnalysisResult?: (result: PostureAnalysisResult) => void;
  analysisHistory?: PostureAnalysisResult[];
}

export default function PostureCamera({
  selectedExercise,
  onAnalysisResult,
  analysisHistory = [],
}: PostureCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] =
    useState<PostureAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoAnalyze, setAutoAnalyze] = useState(false);

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreamActive(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Failed to access camera. Please check permissions.");
    }
  }, []);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreamActive(false);
  }, []);

  // Analyze current frame
  const analyzeCurrentFrame = useCallback(async () => {
    if (!videoRef.current || !isStreamActive) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const base64Image = captureImageFromVideo(videoRef.current);
      const result = await analyzePosture(
        base64Image,
        "base64",
        selectedExercise
      );

      setAnalysisResult(result);
      onAnalysisResult?.(result);
    } catch (err) {
      console.error("Analysis error:", err);
      setError("Failed to analyze posture. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [isStreamActive, onAnalysisResult, selectedExercise]);

  // Auto-analyze effect
  useEffect(() => {
    if (!autoAnalyze || !isStreamActive) return;

    const interval = setInterval(() => {
      if (!isAnalyzing) {
        analyzeCurrentFrame();
      }
    }, 3000); // Analyze every 3 seconds

    return () => clearInterval(interval);
  }, [autoAnalyze, isStreamActive, isAnalyzing, analyzeCurrentFrame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const exerciseTips = getExerciseTips(selectedExercise);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Camera Controls */}
      <div className="flex flex-wrap gap-4 justify-center">
        {!isStreamActive ? (
          <button
            onClick={startCamera}
            className="px-6 py-3 bg-[#6f29a4] text-white rounded-lg hover:bg-[#6f29a4]/90 transition-colors font-medium"
          >
            Start Camera
          </button>
        ) : (
          <>
            <button
              onClick={stopCamera}
              className="px-6 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Stop Camera
            </button>
            <button
              onClick={analyzeCurrentFrame}
              disabled={isAnalyzing}
              className="px-6 py-3 bg-[#6f29a4] text-white rounded-lg hover:bg-[#6f29a4]/90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isAnalyzing ? "Analyzing..." : "Analyze Posture"}
            </button>
            <label className="flex items-center space-x-2 bg-white border border-gray-300 px-4 py-3 rounded-lg">
              <input
                type="checkbox"
                checked={autoAnalyze}
                onChange={(e) => setAutoAnalyze(e.target.checked)}
                className="w-4 h-4 text-[#6f29a4] focus:ring-[#6f29a4] border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700 font-medium">
                Auto-analyze
              </span>
            </label>
          </>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Section: Cameras and History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cameras Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Video Feed */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-black">Live Camera</h3>
              <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden border border-gray-200">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                {!isStreamActive && (
                  <div className="absolute inset-0 flex items-center justify-center text-white bg-black/20">
                    <p className="text-sm">Camera not active</p>
                  </div>
                )}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-sm">Analyzing posture...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AI Visualization */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-black">AI Analysis</h3>
              <div className="relative aspect-video bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                {analysisResult?.visualizedImage ? (
                  <img
                    src={`data:image/jpeg;base64,${analysisResult.visualizedImage}`}
                    alt="AI Analysis Visualization"
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg
                          className="w-6 h-6 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </div>
                      <p className="text-sm">
                        AI visualization will appear here
                      </p>
                      {analysisResult && (
                        <p className="text-xs text-gray-400 mt-1">
                          Analysis complete, but no visualization image received
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Analysis History Below Cameras */}
          {analysisHistory.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 text-black">
                Recent Analysis History
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysisHistory.slice(0, 6).map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border transition-all hover:shadow-sm ${
                      result.isGoodPosture
                        ? "bg-green-50 border-green-200"
                        : "bg-amber-50 border-amber-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 text-sm">
                        {result.isGoodPosture
                          ? "✅ Excellent Form"
                          : "⚠️ Form Needs Work"}
                      </span>
                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                        {Math.round(result.confidence * 100)}%
                      </span>
                    </div>
                    {result.feedback.length > 0 && (
                      <p className="text-xs text-gray-600">
                        {result.feedback[0]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Section: Analysis Results */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-black">Analysis Results</h3>

          {analysisResult ? (
            <div className="space-y-4">
              {/* Posture Status */}
              <div
                className={`p-4 rounded-xl border ${
                  analysisResult.isGoodPosture
                    ? "bg-green-50 border-green-200"
                    : "bg-amber-50 border-amber-200"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      analysisResult.isGoodPosture
                        ? "bg-green-500"
                        : "bg-amber-500"
                    }`}
                  ></div>
                  <span className="font-medium text-gray-900">
                    {analysisResult.isGoodPosture
                      ? "✅ Excellent Form"
                      : "⚠️ Form Needs Attention"}
                  </span>
                </div>
                <p className="text-sm mt-2 text-gray-600">
                  Confidence: {Math.round(analysisResult.confidence * 100)}%
                </p>
              </div>

              {/* Feedback */}
              {analysisResult.feedback.length > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <h4 className="font-medium mb-2 text-gray-900">
                    AI Feedback
                  </h4>
                  <ul className="space-y-1">
                    {analysisResult.feedback.map((feedback, index) => (
                      <li key={index} className="text-sm text-gray-700">
                        • {feedback}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Detected Issues */}
              {analysisResult.detectedIssues.length > 0 && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                  <h4 className="font-medium mb-2 text-gray-900">
                    Areas for Improvement
                  </h4>
                  <ul className="space-y-1">
                    {analysisResult.detectedIssues.map((issue, index) => (
                      <li key={index} className="text-sm text-gray-700">
                        • {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 bg-gray-50 border border-gray-200 rounded-xl text-center text-gray-500">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <p className="text-sm">
                Click "Analyze Posture" or enable auto-analyze to see results
              </p>
            </div>
          )}

          {/* Exercise Tips */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <h4 className="font-medium mb-2 text-gray-900">
              Tips for{" "}
              {selectedExercise.charAt(0).toUpperCase() +
                selectedExercise.slice(1)}
            </h4>
            <ul className="space-y-1">
              {exerciseTips.map((tip, index) => (
                <li key={index} className="text-sm text-gray-700">
                  • {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
