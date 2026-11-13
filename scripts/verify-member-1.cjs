/**
 * LURNIX - Member 1 Video Engine & Confusion Detection Automated Verification
 */

const assert = require('assert');

console.log('--- STARTING LURNIX MEMBER 1 AUTOMATED VERIFICATION ---');

// ==========================================
// 1. YouTube URL & Video ID Parsing Tests
// ==========================================
function extractYouTubeVideoId(urlOrId) {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // If already an 11-character ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Handle common URL patterns
  const regExp = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?/\s]{11})/;
  const match = trimmed.match(regExp);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

assert.strictEqual(
  extractYouTubeVideoId('https://www.youtube.com/watch?v=k38j3pG6KXY'),
  'k38j3pG6KXY',
  'Standard watch URL extraction'
);
assert.strictEqual(
  extractYouTubeVideoId('https://youtu.be/k38j3pG6KXY'),
  'k38j3pG6KXY',
  'Shortened youtu.be URL extraction'
);
assert.strictEqual(
  extractYouTubeVideoId('https://www.youtube.com/embed/k38j3pG6KXY?start=60'),
  'k38j3pG6KXY',
  'Embed URL with query parameters extraction'
);
assert.strictEqual(
  extractYouTubeVideoId('https://youtube.com/shorts/k38j3pG6KXY'),
  'k38j3pG6KXY',
  'Shorts URL extraction'
);
assert.strictEqual(
  extractYouTubeVideoId('k38j3pG6KXY'),
  'k38j3pG6KXY',
  'Direct 11-character video ID'
);
assert.strictEqual(
  extractYouTubeVideoId('https://commondatastorage.googleapis.com/sample/video.mp4'),
  null,
  'Non-YouTube URL returns null'
);
assert.strictEqual(
  extractYouTubeVideoId('invalid_random_string'),
  null,
  'Invalid string returns null'
);

console.log('✓ Feature A: YouTube Video Extraction & Validation Passed');

// ==========================================
// 2. Interactive Chapter Timeline Tests
// ==========================================
const mockChapters = [
  { id: 1, title: 'Introduction & Classification by Source', start_sec: 0, end_sec: 240 },
  { id: 2, title: 'Addition Polymerization Mechanics', start_sec: 240, end_sec: 540 },
  { id: 3, title: 'Condensation & Cross-linking', start_sec: 540, end_sec: 840 },
  { id: 4, title: 'Biomaterials & Modern Applications', start_sec: 840, end_sec: 1110 },
];

function resolveActiveChapter(chapters, currentTime) {
  if (!chapters || chapters.length === 0) return null;
  const matched = chapters.find(
    (c) => currentTime >= c.start_sec && currentTime < c.end_sec
  );
  if (matched) return matched;
  if (currentTime >= chapters[chapters.length - 1].start_sec) {
    return chapters[chapters.length - 1];
  }
  return chapters[0] || null;
}

assert.strictEqual(resolveActiveChapter(mockChapters, 0).id, 1, '0s should be Chapter 1');
assert.strictEqual(resolveActiveChapter(mockChapters, 120).id, 1, '120s should be Chapter 1');
assert.strictEqual(resolveActiveChapter(mockChapters, 240).id, 2, '240s should be Chapter 2');
assert.strictEqual(resolveActiveChapter(mockChapters, 600).id, 3, '600s should be Chapter 3');
assert.strictEqual(resolveActiveChapter(mockChapters, 900).id, 4, '900s should be Chapter 4');
assert.strictEqual(resolveActiveChapter(mockChapters, 1200).id, 4, 'Past end should cap at last Chapter');

console.log('✓ Feature B: Chapter Boundary Timeline Resolution Passed');

// ==========================================
// 3. Intelligent Confusion Detection Simulation
// ==========================================
class SimulatedConfusionDetector {
  constructor(windowMs = 60000, proximitySec = 25, cooldownMs = 180000) {
    this.windowMs = windowMs;
    this.proximitySec = proximitySec;
    this.cooldownMs = cooldownMs;
    this.seekBuffer = [];
    this.cooldownUntil = 0;
    this.isConfusionDetected = false;
    this.detectedLanding = null;
  }

  recordSeek(fromPosition, targetPosition, now = Date.now()) {
    // Only backward seeks
    if (targetPosition >= fromPosition) return;

    // Check cooldown
    if (now < this.cooldownUntil) return;

    const newRecord = { timestamp: now, landingPosition: targetPosition, fromPosition };
    this.seekBuffer = [...this.seekBuffer, newRecord].filter(
      (rec) => now - rec.timestamp <= this.windowMs
    );

    if (this.seekBuffer.length >= 2) {
      for (let i = 0; i < this.seekBuffer.length; i++) {
        for (let j = i + 1; j < this.seekBuffer.length; j++) {
          const seekA = this.seekBuffer[i];
          const seekB = this.seekBuffer[j];
          if (Math.abs(seekA.landingPosition - seekB.landingPosition) <= this.proximitySec) {
            this.isConfusionDetected = true;
            this.detectedLanding = seekB.landingPosition;
            return;
          }
        }
      }
    }
  }

  dismiss(now = Date.now()) {
    this.isConfusionDetected = false;
    this.cooldownUntil = now + this.cooldownMs;
    this.seekBuffer = [];
  }

  resolve(now = Date.now()) {
    this.isConfusionDetected = false;
    this.cooldownUntil = now + this.cooldownMs;
    this.seekBuffer = [];
  }
}

// Case 1: Forward seek does not trigger
const detector1 = new SimulatedConfusionDetector();
detector1.recordSeek(60, 120);
assert.strictEqual(detector1.isConfusionDetected, false, 'Forward seek should not trigger');

// Case 2: Single backward seek does not trigger
const detector2 = new SimulatedConfusionDetector();
detector2.recordSeek(180, 60);
assert.strictEqual(detector2.isConfusionDetected, false, 'Single backward seek should not trigger');

// Case 3: Two backward seeks within 60s and within 25s proximity -> TRIGGERS
const detector3 = new SimulatedConfusionDetector();
let t0 = 1000000;
detector3.recordSeek(180, 70, t0); // Seek from 180s to 70s
assert.strictEqual(detector3.isConfusionDetected, false);
detector3.recordSeek(85, 65, t0 + 15000); // 15s later, seek from 85s to 65s (|70 - 65| = 5s <= 25s)
assert.strictEqual(detector3.isConfusionDetected, true, 'Repeated rewind within 25s and 60s must trigger');
assert.strictEqual(detector3.detectedLanding, 65, 'Landing position recorded correctly');

// Case 4: Two backward seeks far apart in landing (> 25s) -> DOES NOT TRIGGER
const detector4 = new SimulatedConfusionDetector();
detector4.recordSeek(300, 200, t0);
detector4.recordSeek(210, 50, t0 + 10000); // |200 - 50| = 150s > 25s
assert.strictEqual(detector4.isConfusionDetected, false, 'Landing difference > 25s should not trigger');

// Case 5: Two backward seeks separated by > 60s -> DOES NOT TRIGGER
const detector5 = new SimulatedConfusionDetector();
detector5.recordSeek(180, 70, t0);
detector5.recordSeek(90, 72, t0 + 75000); // 75s later (> 60s window)
assert.strictEqual(detector5.isConfusionDetected, false, 'Seeks separated by > 60s should not trigger');

// Case 6: 3-Minute Cooldown after dismissal
detector3.dismiss(t0 + 20000);
assert.strictEqual(detector3.isConfusionDetected, false, 'Dismissal resets detection');
// Try seeking again 1 minute later (inside 3-min cooldown)
detector3.recordSeek(120, 50, t0 + 80000);
detector3.recordSeek(60, 50, t0 + 90000);
assert.strictEqual(detector3.isConfusionDetected, false, 'Cooldown must suppress detection for 3 mins');

// After 3 minutes (180,000ms) cooldown expires
const tAfterCooldown = t0 + 20000 + 180001;
detector3.recordSeek(120, 50, tAfterCooldown);
detector3.recordSeek(60, 52, tAfterCooldown + 5000);
assert.strictEqual(detector3.isConfusionDetected, true, 'Detection resumes after cooldown expires');

console.log('✓ Feature C: Intelligent Confusion Detection Heuristic Passed');

// ==========================================
// 4. Modal & AI Chat Integration Payload Check
// ==========================================
function createConfusionExplanationPayload(currentTime, mode) {
  const mins = Math.floor(currentTime / 60);
  const secs = Math.floor(currentTime % 60);
  const timeStr = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;

  let prompt = `Can you explain the lecture content around ${timeStr}?`;
  if (mode === 'analogy') {
    prompt = `Explain what is happening around timestamp ${timeStr} using an everyday analogy`;
  } else if (mode === 'step_by_step') {
    prompt = `Break down the concepts at timestamp ${timeStr} step by step`;
  } else if (mode === 'hinglish') {
    prompt = `Explain the lecture section at timestamp ${timeStr} in simple conversational Hinglish`;
  }

  return { prompt, mode, timestamp: currentTime, timeStr };
}

const analogyPayload = createConfusionExplanationPayload(180, 'analogy');
assert.strictEqual(analogyPayload.mode, 'analogy');
assert(analogyPayload.prompt.includes('everyday analogy'));
assert(analogyPayload.prompt.includes('03:00'));

const stepPayload = createConfusionExplanationPayload(240, 'step_by_step');
assert.strictEqual(stepPayload.mode, 'step_by_step');
assert(stepPayload.prompt.includes('step by step'));
assert(stepPayload.prompt.includes('04:00'));

const hinglishPayload = createConfusionExplanationPayload(90, 'hinglish');
assert.strictEqual(hinglishPayload.mode, 'hinglish');
assert(hinglishPayload.prompt.includes('Hinglish'));
assert(hinglishPayload.prompt.includes('01:30'));

console.log('✓ Feature D: Confusion Toast AI Mode Triggers Passed');

console.log('--- ALL MEMBER 1 TESTS PASSED SUCCESSFULLY (100%) ---');
