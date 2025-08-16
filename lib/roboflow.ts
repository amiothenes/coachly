/**
 * Roboflow API integration for Coachly
 * Analyzes gym exercise posture (squat, bench, deadlift)
 */

import { analyzeTechnique, getExerciseSpecificFeedback } from './techniqueAnalysis';
export { getExerciseTips } from './techniqueAnalysis';

const ROBOFLOW_API_URL = process.env.NEXT_PUBLIC_ROBOFLOW_API_URL;
const API_KEY = process.env.NEXT_PUBLIC_ROBOFLOW_API_KEY;

export interface RoboflowResponse {
  outputs: Array<{
    pose_skeleton_visualization: {
      type: string;
      value: string; // Base64 encoded image
      video_metadata: {
        video_identifier: string;
        frame_number: number;
        frame_timestamp: string;
        fps: number;
        measured_fps: number | null;
        comes_from_video_file: boolean | null;
      };
    };
    model_predictions: {
      image: {
        width: number;
        height: number;
      };
      predictions: Array<{
        width: number;
        height: number;
        x: number;
        y: number;
        confidence: number;
        class_id: number;
        class: string;
        detection_id: string;
        parent_id: string;
        keypoints: Array<{
          class_id: number;
          class: string;
          confidence: number;
          x: number;
          y: number;
        }>;
      }>;
    };
  }>;
  profiler_trace: any[];
}

export interface PostureAnalysisResult {
  isGoodPosture: boolean;
  confidence: number;
  feedback: string[];
  exercise: 'squat' | 'bench' | 'deadlift' | 'unknown';
  detectedIssues: string[];
  visualizedImage?: string; // Base64 encoded image with annotations
  missingKeypoints?: boolean; // Flag for when critical keypoints are not visible
}

/**
 * Analyze posture using Roboflow API
 * @param imageInput - Can be a URL string or base64 encoded image
 * @param inputType - 'url' or 'base64'
 * @param exerciseType - The type of exercise being performed
 */
export async function analyzePosture(
  imageInput: string,
  inputType: 'url' | 'base64' = 'url',
  exerciseType?: 'squat' | 'bench' | 'deadlift'
): Promise<PostureAnalysisResult> {
  try {
    if (!API_KEY) {
      throw new Error('Roboflow API key not configured');
    }
    if (!ROBOFLOW_API_URL) {
      throw new Error('Roboflow API URL not configured');
    }

    const response = await fetch(ROBOFLOW_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: API_KEY,
        inputs: {
          image: { type: inputType, value: imageInput }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Roboflow API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const analysisData: RoboflowResponse = result;
    
    // Process the Roboflow response and convert to our format
    return processRoboflowResponse(analysisData, exerciseType);
  } catch (error) {
    console.error('Error analyzing posture:', error);
    throw new Error(`Failed to analyze posture: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert a File object to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Capture image from video stream and convert to base64
 */
export function captureImageFromVideo(videoElement: HTMLVideoElement): string {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) {
    throw new Error('Failed to get canvas context');
  }

  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  
  context.drawImage(videoElement, 0, 0);
  
  // Get base64 without the data URL prefix
  return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
}

/**
 * Process Roboflow response and extract meaningful feedback
 */
function processRoboflowResponse(response: RoboflowResponse, exerciseType?: 'squat' | 'bench' | 'deadlift'): PostureAnalysisResult {
  const defaultResult: PostureAnalysisResult = {
    isGoodPosture: false,
    confidence: 0,
    feedback: [],
    exercise: exerciseType || 'unknown',
    detectedIssues: [],
    missingKeypoints: false
  };

  try {
    // Get the first output from the outputs array
    const output = response.outputs?.[0];
    if (!output) {
      return defaultResult;
    }
    
    // Extract the pose skeleton visualization image
    const visualizedImage = output.pose_skeleton_visualization?.value;
    
    // Get predictions data
    const predictions = output.model_predictions?.predictions || [];
    
    // Calculate overall confidence from person detection
    const personDetection = predictions.find((pred: any) => pred.class === 'person');
    const confidence = personDetection?.confidence || 0;
    
    // Analyze keypoints for posture quality
    const keypoints = personDetection?.keypoints || [];
    const postureAnalysis = analyzeTechnique(keypoints, exerciseType);
    
    // Check for missing critical keypoints
    const missingKeypoints = checkForMissingKeypoints(keypoints, exerciseType);
    
    // Determine if posture is good based on confidence and keypoint analysis
    const isGoodPosture = confidence > 0.7 && postureAnalysis.score > 0.6 && !missingKeypoints;
    
    // Generate feedback based on analysis
    const feedback: string[] = [];
    const detectedIssues: string[] = [];
    
    if (isGoodPosture) {
      feedback.push("Excellent form detected!");
      if (exerciseType) {
        feedback.push(`Your ${exerciseType} technique looks great.`);
      } else {
        feedback.push("Your posture and alignment look great.");
      }
    } else {
      feedback.push("There are some areas for improvement in your form.");
      
      // Add exercise-specific feedback
      if (exerciseType) {
        feedback.push(...getExerciseSpecificFeedback(exerciseType, postureAnalysis));
      }
      
      // Add specific feedback based on keypoint analysis
      if (postureAnalysis.issues.length > 0) {
        detectedIssues.push(...postureAnalysis.issues);
        feedback.push("Focus on the highlighted areas for better form.");
      }
      
      if (confidence < 0.5) {
        detectedIssues.push("Person detection confidence is low");
        feedback.push("Make sure you're clearly visible in the camera frame.");
      }

      if (missingKeypoints) {
        detectedIssues.push("Some critical body parts are not visible");
        feedback.push("Adjust your position to ensure all key body parts are visible in the camera.");
      }
    }

    return {
      isGoodPosture,
      confidence,
      feedback,
      exercise: exerciseType || 'unknown',
      detectedIssues,
      visualizedImage,
      missingKeypoints
    };
  } catch (error) {
    console.error('Error processing Roboflow response:', error);
    return defaultResult;
  }
}

/**
 * Check for missing critical keypoints based on exercise type
 */
function checkForMissingKeypoints(keypoints: any[], exerciseType?: 'squat' | 'bench' | 'deadlift'): boolean {
  const requiredKeypoints = {
    squat: ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'],
    bench: ['left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist'],
    deadlift: ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle']
  };

  const required = exerciseType ? requiredKeypoints[exerciseType] : ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip'];
  const confidenceThreshold = 0.3;

  const visibleKeypoints = keypoints.filter(kp => kp.confidence > confidenceThreshold).map(kp => kp.class);
  const missingCount = required.filter(req => !visibleKeypoints.includes(req)).length;

  // Consider keypoints missing if more than 30% of required keypoints are not visible
  return missingCount > required.length * 0.3;
}
