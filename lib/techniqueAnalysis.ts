/**
 * Exercise Technique Analysis for Coachly
 * Analyzes gym exercise form (squat, bench press, deadlift) based on pose keypoints
 */

export interface KeypointData {
  class: string;
  confidence: number;
  x: number;
  y: number;
}

export interface TechniqueAnalysisResult {
  score: number;
  issues: string[];
  sideProfile: 'left' | 'right' | 'unknown';
}

/**
 * Main function to analyze exercise technique based on keypoints
 */
export function analyzeTechnique(
  keypoints: KeypointData[],
  exerciseType?: 'squat' | 'bench' | 'deadlift'
): TechniqueAnalysisResult {
  const issues: string[] = [];
  let score = 1.0;

  // Determine which side profile we're seeing based on keypoint confidence
  const sideProfile = determineSideProfile(keypoints);
  
  // Check for low confidence keypoints
  const lowConfidenceThreshold = 0.5;
  const lowConfidenceKeypoints = keypoints.filter(kp => kp.confidence < lowConfidenceThreshold);
  
  if (lowConfidenceKeypoints.length > 3) {
    issues.push("Some body parts are not clearly visible");
    score -= 0.2;
  }

  // Exercise-specific technique analysis
  if (exerciseType === 'squat') {
    const squatAnalysis = analyzeSquatTechnique(keypoints, sideProfile);
    issues.push(...squatAnalysis.issues);
    score *= squatAnalysis.scoreMultiplier;
  } else if (exerciseType === 'deadlift') {
    const deadliftAnalysis = analyzeDeadliftTechnique(keypoints, sideProfile);
    issues.push(...deadliftAnalysis.issues);
    score *= deadliftAnalysis.scoreMultiplier;
  } else if (exerciseType === 'bench') {
    const benchAnalysis = analyzeBenchTechnique(keypoints, sideProfile);
    issues.push(...benchAnalysis.issues);
    score *= benchAnalysis.scoreMultiplier;
  }

  return { 
    score: Math.max(0, score), 
    issues,
    sideProfile
  };
}

/**
 * Determine which side profile we're seeing based on keypoint confidence
 */
function determineSideProfile(keypoints: KeypointData[]): 'left' | 'right' | 'unknown' {
  const leftSideKeypoints = keypoints.filter(kp => kp.class.startsWith('left_'));
  const rightSideKeypoints = keypoints.filter(kp => kp.class.startsWith('right_'));
  
  const leftAvgConfidence = leftSideKeypoints.reduce((sum, kp) => sum + kp.confidence, 0) / leftSideKeypoints.length;
  const rightAvgConfidence = rightSideKeypoints.reduce((sum, kp) => sum + kp.confidence, 0) / rightSideKeypoints.length;
  
  const confidenceDiff = Math.abs(leftAvgConfidence - rightAvgConfidence);
  
  // If one side has significantly higher confidence, we're seeing that side profile
  if (confidenceDiff > 0.2) {
    return leftAvgConfidence > rightAvgConfidence ? 'left' : 'right';
  }
  
  return 'unknown';
}

/**
 * Calculate angle between three points
 */
function calculateAngle(p1: {x: number, y: number}, p2: {x: number, y: number}, p3: {x: number, y: number}): number {
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
  
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  
  const cos = dot / (mag1 * mag2);
  return Math.acos(Math.max(-1, Math.min(1, cos))) * (180 / Math.PI);
}

/**
 * Analyze squat technique based on side profile keypoints
 */
function analyzeSquatTechnique(keypoints: KeypointData[], sideProfile: string): {issues: string[], scoreMultiplier: number} {
  const issues: string[] = [];
  let scoreMultiplier = 1.0;
  
  // Get keypoints for the visible side
  const side = sideProfile === 'left' ? 'left' : 'right';
  const ankle = keypoints.find(kp => kp.class === `${side}_ankle`);
  const knee = keypoints.find(kp => kp.class === `${side}_knee`);
  const hip = keypoints.find(kp => kp.class === `${side}_hip`);
  const shoulder = keypoints.find(kp => kp.class === `${side}_shoulder`);
  const nose = keypoints.find(kp => kp.class === 'nose');
  
  if (!ankle || !knee || !hip || !shoulder || ankle.confidence < 0.5 || knee.confidence < 0.5 || hip.confidence < 0.5 || shoulder.confidence < 0.5) {
    issues.push("Cannot analyze squat form - key body parts not visible");
    return { issues, scoreMultiplier: 0.3 };
  }
  
  // 1. Check for heel lifting (ankles): knee should be roughly above ankle
  const kneeAnkleDistance = Math.abs(knee.x - ankle.x);
  if (kneeAnkleDistance > 60) { // Significant forward lean indicates heels lifting
    issues.push("Weight may be shifting to toes - focus on keeping heels down");
    scoreMultiplier -= 0.25;
  }
  
  // 2. Check knees shooting too far forward: knee should not be significantly forward of ankle
  if (knee.x > ankle.x + 80) {
    issues.push("Knees are tracking too far forward - sit back more into the squat");
    scoreMultiplier -= 0.2;
  }
  
  // 3. Check for "good morning" squat: hips rising faster than chest
  // Calculate hip-shoulder angle relative to vertical
  const hipShoulderAngle = calculateAngle(
    { x: hip.x, y: hip.y - 100 }, // Point above hip (vertical reference)
    hip,
    shoulder
  );
  
  if (hipShoulderAngle > 45) {
    issues.push("Chest is collapsing forward - keep your torso more upright");
    scoreMultiplier -= 0.3;
  }
  
  // 4. Check knee angle for depth and tracking
  const kneeAngle = calculateAngle(ankle, knee, hip);
  if (kneeAngle > 140) {
    issues.push("Try to squat deeper - aim for thighs parallel to the ground");
    scoreMultiplier -= 0.1;
  }
  
  // 5. Check for excessive butt wink (hip angle too acute)
  const hipAngle = calculateAngle(knee, hip, shoulder);
  if (hipAngle < 70) {
    issues.push("Excessive hip flexion detected - avoid excessive 'butt wink'");
    scoreMultiplier -= 0.15;
  }
  
  // 6. Check head/neck position
  if (nose) {
    const headTilt = Math.abs(nose.y - shoulder.y);
    if (headTilt > 100) {
      issues.push("Maintain neutral head position - avoid looking too far up or down");
      scoreMultiplier -= 0.1;
    }
  }
  
  return { issues, scoreMultiplier: Math.max(0.1, scoreMultiplier) };
}

/**
 * Analyze deadlift technique based on side profile keypoints
 */
function analyzeDeadliftTechnique(keypoints: KeypointData[], sideProfile: string): {issues: string[], scoreMultiplier: number} {
  const issues: string[] = [];
  let scoreMultiplier = 1.0;
  
  const side = sideProfile === 'left' ? 'left' : 'right';
  const ankle = keypoints.find(kp => kp.class === `${side}_ankle`);
  const knee = keypoints.find(kp => kp.class === `${side}_knee`);
  const hip = keypoints.find(kp => kp.class === `${side}_hip`);
  const shoulder = keypoints.find(kp => kp.class === `${side}_shoulder`);
  const nose = keypoints.find(kp => kp.class === 'nose');
  
  if (!ankle || !knee || !hip || !shoulder || ankle.confidence < 0.5 || knee.confidence < 0.5 || hip.confidence < 0.5 || shoulder.confidence < 0.5) {
    issues.push("Cannot analyze deadlift form - key body parts not visible");
    return { issues, scoreMultiplier: 0.3 };
  }
  
  // 1. Check bar position relative to shins (simulate bar at ankle level)
  // Bar should start close to shins - shoulder should be over or slightly in front of bar
  if (shoulder.x < ankle.x - 30) {
    issues.push("Bar appears too far from your body - keep it close to your shins");
    scoreMultiplier -= 0.3;
  }
  
  // 2. Check hip height at start position
  const hipKneeRatio = (hip.y - knee.y) / (knee.y - ankle.y);
  if (hipKneeRatio > 2.5) {
    issues.push("Hips may be too high - lower them to engage your legs more");
    scoreMultiplier -= 0.2;
  }
  if (hipKneeRatio < 0.8) {
    issues.push("Hips may be too low - this isn't a squat, raise them slightly");
    scoreMultiplier -= 0.2;
  }
  
  // 3. Check spine alignment (shoulder to hip line)
  const spineAngle = calculateAngle(
    { x: shoulder.x, y: shoulder.y - 100 }, // Vertical reference
    shoulder,
    hip
  );
  
  if (spineAngle > 60) {
    issues.push("Spine appears rounded - keep your chest up and shoulders back");
    scoreMultiplier -= 0.4;
  }
  
  // 4. Check knee tracking (knees shouldn't cave in or lock too early)
  const kneeAngle = calculateAngle(ankle, knee, hip);
  if (kneeAngle > 160) {
    issues.push("Knees appear locked - maintain slight bend to engage leg muscles");
    scoreMultiplier -= 0.15;
  }
  
  // 5. Check head position
  if (nose) {
    const neckAngle = calculateAngle(shoulder, nose, { x: nose.x, y: nose.y - 50 });
    if (neckAngle > 45) {
      issues.push("Avoid looking up excessively - maintain neutral neck position");
      scoreMultiplier -= 0.1;
    }
    if (neckAngle < 15) {
      issues.push("Avoid looking down - keep your head in neutral position");
      scoreMultiplier -= 0.1;
    }
  }
  
  return { issues, scoreMultiplier: Math.max(0.1, scoreMultiplier) };
}

/**
 * Analyze bench press technique based on side profile keypoints
 */
function analyzeBenchTechnique(keypoints: KeypointData[], sideProfile: string): {issues: string[], scoreMultiplier: number} {
  const issues: string[] = [];
  let scoreMultiplier = 1.0;
  
  const side = sideProfile === 'left' ? 'left' : 'right';
  const shoulder = keypoints.find(kp => kp.class === `${side}_shoulder`);
  const elbow = keypoints.find(kp => kp.class === `${side}_elbow`);
  const wrist = keypoints.find(kp => kp.class === `${side}_wrist`);
  const hip = keypoints.find(kp => kp.class === `${side}_hip`);
  const nose = keypoints.find(kp => kp.class === 'nose');
  
  if (!shoulder || !elbow || !wrist || shoulder.confidence < 0.5 || elbow.confidence < 0.5 || wrist.confidence < 0.5) {
    issues.push("Cannot analyze bench form - arm positions not clearly visible");
    return { issues, scoreMultiplier: 0.3 };
  }
  
  // 1. Check shoulder position (should be retracted, not shrugged up)
  if (hip && shoulder.y < hip.y - 150) {
    issues.push("Shoulders may be shrugged up - retract and depress shoulder blades");
    scoreMultiplier -= 0.2;
  }
  
  // 2. Check elbow position relative to shoulder
  const elbowShoulderAngle = calculateAngle(wrist, elbow, shoulder);
  if (elbowShoulderAngle > 100) {
    issues.push("Elbows flared too wide - bring them closer to your body");
    scoreMultiplier -= 0.25;
  }
  if (elbowShoulderAngle < 45) {
    issues.push("Elbows tucked too tight - allow for slight flare");
    scoreMultiplier -= 0.15;
  }
  
  // 3. Check wrist alignment (should be stacked over forearm)
  const wristElbowAlignment = Math.abs(wrist.x - elbow.x);
  if (wristElbowAlignment > 40) {
    issues.push("Wrist alignment could be improved - keep wrists straight and stacked");
    scoreMultiplier -= 0.2;
  }
  
  // 4. Check bar path (wrist should move in slight arc, not straight down over face)
  // In side view, bar should descend toward lower chest area
  if (wrist.x < shoulder.x - 50) {
    issues.push("Bar path may be too far toward your face - aim for lower chest");
    scoreMultiplier -= 0.3;
  }
  
  // 5. Check for excessive arch or flat back
  if (hip && shoulder) {
    const backArch = Math.abs(shoulder.x - hip.x);
    if (backArch > 80) {
      issues.push("Excessive back arch detected - maintain moderate natural arch");
      scoreMultiplier -= 0.15;
    }
  }
  
  // 6. Check head position
  if (nose && shoulder) {
    const headPosition = nose.y - shoulder.y;
    if (headPosition > 50) {
      issues.push("Keep your head on the bench - avoid lifting it during the press");
      scoreMultiplier -= 0.1;
    }
  }
  
  return { issues, scoreMultiplier: Math.max(0.1, scoreMultiplier) };
}

/**
 * Get exercise-specific feedback based on posture analysis
 */
export function getExerciseSpecificFeedback(exerciseType: 'squat' | 'bench' | 'deadlift', analysisResult: TechniqueAnalysisResult): string[] {
  const feedback: string[] = [];
  
  switch (exerciseType) {
    case 'squat':
      if (analysisResult.score < 0.8) {
        feedback.push("Focus on the ankle → knee → hip → chest alignment");
        feedback.push("Keep your weight on your heels throughout the movement");
        feedback.push("Maintain an upright chest and avoid leaning forward");
      }
      if (analysisResult.score < 0.6) {
        feedback.push("Work on hip and ankle mobility to improve squat depth");
        feedback.push("Practice bodyweight squats to master the movement pattern");
      }
      break;
    case 'deadlift':
      if (analysisResult.score < 0.8) {
        feedback.push("Keep the bar path close to your body throughout the lift");
        feedback.push("Maintain a neutral spine - avoid rounding your back");
        feedback.push("Focus on the ankle → knee → hip → chest chain alignment");
      }
      if (analysisResult.score < 0.6) {
        feedback.push("Work on hip hinge mobility and posterior chain strength");
        feedback.push("Consider starting with lighter weight to perfect your form");
      }
      break;
    case 'bench':
      if (analysisResult.score < 0.8) {
        feedback.push("Focus on shoulder → elbow → wrist → bar path alignment");
        feedback.push("Retract your shoulder blades and maintain stability");
        feedback.push("Keep your wrists straight and stacked over your forearms");
      }
      if (analysisResult.score < 0.6) {
        feedback.push("Work on shoulder mobility and scapular stability");
        feedback.push("Practice the movement with lighter weight or just the bar");
      }
      break;
  }
  
  return feedback;
}

/**
 * Get exercise-specific tips and guidance
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
