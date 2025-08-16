/**
 * Roboflow API integration for Coachly
 * Analyzes gym exercise posture (squat, bench, deadlift)
 */

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
    detectedIssues: []
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
    const postureAnalysis = analyzeKeypoints(keypoints, exerciseType);
    
    // Determine if posture is good based on confidence and keypoint analysis
    const isGoodPosture = confidence > 0.7 && postureAnalysis.score > 0.6;
    
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
    }

    return {
      isGoodPosture,
      confidence,
      feedback,
      exercise: exerciseType || 'unknown',
      detectedIssues,
      visualizedImage
    };
  } catch (error) {
    console.error('Error processing Roboflow response:', error);
    return defaultResult;
  }
}

/**
 * Analyze keypoints to assess posture quality
 */
function analyzeKeypoints(keypoints: Array<{class: string, confidence: number, x: number, y: number}>, exerciseType?: 'squat' | 'bench' | 'deadlift') {
  const issues: string[] = [];
  let score = 1.0;

  // Find key body parts
  const nose = keypoints.find(kp => kp.class === 'nose');
  const leftShoulder = keypoints.find(kp => kp.class === 'left_shoulder');
  const rightShoulder = keypoints.find(kp => kp.class === 'right_shoulder');
  const leftHip = keypoints.find(kp => kp.class === 'left_hip');
  const rightHip = keypoints.find(kp => kp.class === 'right_hip');
  const leftKnee = keypoints.find(kp => kp.class === 'left_knee');
  const rightKnee = keypoints.find(kp => kp.class === 'right_knee');
  const leftAnkle = keypoints.find(kp => kp.class === 'left_ankle');
  const rightAnkle = keypoints.find(kp => kp.class === 'right_ankle');

  // Check for low confidence keypoints
  const lowConfidenceThreshold = 0.5;
  const lowConfidenceKeypoints = keypoints.filter(kp => kp.confidence < lowConfidenceThreshold);
  
  if (lowConfidenceKeypoints.length > 3) {
    issues.push("Some body parts are not clearly visible");
    score -= 0.2;
  }

  // General posture checks
  // Check shoulder alignment
  if (leftShoulder && rightShoulder && leftShoulder.confidence > 0.5 && rightShoulder.confidence > 0.5) {
    const shoulderDiff = Math.abs(leftShoulder.y - rightShoulder.y);
    if (shoulderDiff > 30) {
      issues.push("Shoulders appear uneven - focus on symmetrical positioning");
      score -= 0.2;
    }
  }

  // Check hip alignment
  if (leftHip && rightHip && leftHip.confidence > 0.5 && rightHip.confidence > 0.5) {
    const hipDiff = Math.abs(leftHip.y - rightHip.y);
    if (hipDiff > 25) {
      issues.push("Hip alignment could be improved");
      score -= 0.2;
    }
  }

  // Exercise-specific checks
  if (exerciseType === 'squat') {
    // Squat-specific analysis
    if (leftKnee && rightKnee && leftKnee.confidence > 0.5 && rightKnee.confidence > 0.5) {
      const kneeDiff = Math.abs(leftKnee.x - rightKnee.x);
      if (kneeDiff < 20) {
        issues.push("Knees may be too close together for a proper squat stance");
        score -= 0.15;
      }
    }
    
    // Check knee-ankle alignment for squats
    if (leftKnee && leftAnkle && leftKnee.confidence > 0.5 && leftAnkle.confidence > 0.5) {
      const kneeAnkleAlignment = Math.abs(leftKnee.x - leftAnkle.x);
      if (kneeAnkleAlignment > 50) {
        issues.push("Left knee tracking could be improved");
        score -= 0.1;
      }
    }
  } else if (exerciseType === 'deadlift') {
    // Deadlift-specific analysis
    if (nose && leftHip && rightHip) {
      const avgHipY = (leftHip.y + rightHip.y) / 2;
      const spineAngle = Math.abs(nose.y - avgHipY);
      // Check for proper spine positioning (simplified)
      if (spineAngle < 100) {
        issues.push("Maintain a more upright spine position");
        score -= 0.2;
      }
    }
  } else if (exerciseType === 'bench') {
    // Bench press specific analysis would require different keypoint analysis
    // This is more complex as it typically requires side view
    if (leftShoulder && rightShoulder) {
      // Basic shoulder stability check
      const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
      if (shoulderWidth < 50) {
        issues.push("Shoulder positioning could be more stable");
        score -= 0.1;
      }
    }
  }

  return { score: Math.max(0, score), issues };
}

/**
 * Get exercise-specific feedback based on posture analysis
 */
function getExerciseSpecificFeedback(exerciseType: 'squat' | 'bench' | 'deadlift', postureAnalysis: {score: number, issues: string[]}) {
  const feedback: string[] = [];
  
  switch (exerciseType) {
    case 'squat':
      if (postureAnalysis.score < 0.7) {
        feedback.push("Focus on keeping your weight balanced on your heels");
        feedback.push("Ensure your knees track in line with your toes");
      }
      break;
    case 'deadlift':
      if (postureAnalysis.score < 0.7) {
        feedback.push("Keep the bar close to your body throughout the movement");
        feedback.push("Maintain a neutral spine position");
      }
      break;
    case 'bench':
      if (postureAnalysis.score < 0.7) {
        feedback.push("Keep your shoulder blades pulled back and down");
        feedback.push("Maintain stability throughout the movement");
      }
      break;
  }
  
  return feedback;
}

/**
 * Get exercise-specific feedback and tips
 */
export function getExerciseTips(exercise: string): string[] {
  const tips: Record<string, string[]> = {
    squat: [
      "Keep your chest up and shoulders back",
      "Ensure knees track over your toes",
      "Maintain a neutral spine throughout the movement",
      "Descend until thighs are parallel to the floor",
      "Drive through your heels when standing up"
    ],
    bench: [
      "Keep your feet firmly planted on the ground",
      "Maintain a slight arch in your lower back",
      "Keep your shoulder blades pulled together",
      "Lower the bar to your chest with control",
      "Press the bar in a straight line above your chest"
    ],
    deadlift: [
      "Keep the bar close to your body throughout",
      "Maintain a neutral spine - no rounding",
      "Engage your lats to keep the bar close",
      "Drive through your heels and squeeze your glutes",
      "Keep your shoulders back and chest up"
    ]
  };
  
  return tips[exercise.toLowerCase()] || [
    "Focus on proper form over heavy weight",
    "Move with control throughout the entire range of motion",
    "Breathe properly - exhale on exertion",
    "Warm up thoroughly before starting"
  ];
}
