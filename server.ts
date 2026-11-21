import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured. Please add your Gemini API key in Settings > Secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  // Endpoint 1: Analyze student MCQ choice + written explanation (Misconception Detector)
  app.post('/api/agent/analyze', async (req: Request, res: Response) => {
    try {
      const {
        conceptId,
        conceptName,
        questionPrompt,
        options,
        selectedOptionIndex,
        correctOptionIndex,
        studentReasoning,
        currentMastery,
        difficulty,
      } = req.body ?? {};

      if (
        !conceptName ||
        !questionPrompt ||
        !Array.isArray(options) ||
        typeof selectedOptionIndex !== 'number' ||
        typeof correctOptionIndex !== 'number'
      ) {
        return res.status(400).json({ error: 'Missing required question analysis fields.' });
      }

      const ai = getAiClient();
      const isCorrectMcq = selectedOptionIndex === correctOptionIndex;
      const selectedText = options[selectedOptionIndex] ?? 'No option selected';
      const correctText = options[correctOptionIndex] ?? 'Unknown';
      const trimmedReasoning =
        typeof studentReasoning === 'string' && studentReasoning.trim().length > 0
          ? studentReasoning.trim()
          : '(Student did not provide a written explanation)';

      const prompt = `You are an expert Class 10 Physics AI Tutor Agent specializing in Light, Electricity, and Magnetism (NCERT / CBSE Class 10 level).
Analyze the student's attempt carefully.

Concept: ${conceptName} (ID: ${conceptId})
Current Mastery: ${currentMastery ?? 50}%
Question Difficulty: ${difficulty ?? 'Medium'}
Question: ${questionPrompt}
Options:
${options.map((opt: string, idx: number) => `${String.fromCharCode(65 + idx)}. ${opt}`).join('\n')}

Correct Answer: ${String.fromCharCode(65 + correctOptionIndex)}. ${correctText}
Student Selected: ${String.fromCharCode(65 + selectedOptionIndex)}. ${selectedText}
MCQ Result: ${isCorrectMcq ? 'CORRECT' : 'INCORRECT'}
Student's Written Reasoning: "${trimmedReasoning}"

Instructions:
1. Evaluate BOTH the MCQ choice and the student's written reasoning. Even if the MCQ is correct, check whether the student's reasoning is scientifically sound, partial, or flawed (e.g., lucky guess or wrong formula leading to the right number).
2. Produce a crisp, high-clarity 4-step Agent Reasoning Trace:
   - step1Analysis: Summarize what mental model, rule, or calculation the student used in their explanation.
   - step2Misconception: If wrong or reasoning is flawed, pinpoint the exact root physics misconception (why their intuition misled them). If fully sound, confirm the valid physical principle they applied.
   - misconceptionTag: A concise 3-6 word canonical misconception label (e.g. "Parallel-as-Series Additive Fallacy", "Concave Mirror Sign Inversion", or "None — Sound Reasoning" if sound).
   - step3ModelImpact: Explain how this attempt adjusts their mastery estimate for ${conceptName} and dependent concepts.
   - step4Hint: Give a clear, encouraging Socratic hint and the exact physical correction (using clear formulas/units) so they can fix the flaw immediately.
   - reasoningQuality: "sound" | "partial" | "flawed"`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reasoningQuality: {
                type: Type.STRING,
                description: 'Must be one of: sound, partial, flawed',
              },
              step1Analysis: {
                type: Type.STRING,
                description: "Step 1: Analyzing the student's written explanation and mental model.",
              },
              step2Misconception: {
                type: Type.STRING,
                description: 'Step 2: Root physics misconception identified, or confirmation of sound reasoning.',
              },
              misconceptionTag: {
                type: Type.STRING,
                description: 'Canonical short misconception label (3-6 words) or None — Sound Reasoning.',
              },
              step3ModelImpact: {
                type: Type.STRING,
                description: 'Step 3: Explanation of how the dynamic learner model updates after this evidence.',
              },
              step4Hint: {
                type: Type.STRING,
                description: 'Step 4: Targeted Socratic hint and correct physics intuition.',
              },
            },
            required: [
              'reasoningQuality',
              'step1Analysis',
              'step2Misconception',
              'misconceptionTag',
              'step3ModelImpact',
              'step4Hint',
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      return res.json({
        isCorrect: isCorrectMcq,
        ...parsed,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to analyze student reasoning.';
      console.error('[api/agent/analyze] error:', message);
      const status =
        message.includes('GEMINI_API_KEY') || message.includes('API_KEY_INVALID') || message.includes('PERMISSION_DENIED')
          ? 403
          : 500;
      return res.status(status).json({ error: message });
    }
  });

  // Endpoint 2: Autonomous Targeted Question Generator with Difficulty Calibration
  app.post('/api/agent/generate-question', async (req: Request, res: Response) => {
    try {
      const {
        conceptId,
        conceptName,
        conceptFormula,
        unit,
        difficulty,
        currentMastery,
        recentMisconceptions,
        previousPrompts,
      } = req.body ?? {};

      if (!conceptName || !difficulty) {
        return res.status(400).json({ error: 'Missing required conceptName or difficulty.' });
      }

      const ai = getAiClient();

      const prompt = `You are an autonomous Class 10 Physics Exam-Prep Tutor Agent (Light, Electricity, and Magnetism).
Generate ONE fresh, crystal-clear multiple-choice physics question tailored to the student's current learner model.

Target Concept: ${conceptName} (Unit: ${unit ?? 'Physics'}, Key Formula/Rule: ${conceptFormula ?? ''})
Current Student Mastery: ${currentMastery ?? 40}%
Calibrated Difficulty: ${difficulty}
Known Student Misconceptions to probe/remediate: ${
        Array.isArray(recentMisconceptions) && recentMisconceptions.length > 0
          ? recentMisconceptions.join('; ')
          : 'None recorded yet'
      }
Avoid repeating these recent questions: ${
        Array.isArray(previousPrompts) && previousPrompts.length > 0
          ? previousPrompts.slice(-4).join(' | ')
          : 'None'
      }

Difficulty Calibration Rules:
- Easy: Single-step conceptual check or direct formula substitution with simple numbers to rebuild intuition.
- Medium: Two-step CBSE board-style application or ray/circuit reasoning problem with realistic misconception distractors.
- Hard: Multi-concept synthesis or tricky edge-case conceptual reasoning (e.g., variable changes, combined formulas, or sign conventions).

Return JSON with:
- prompt: The physics question text (concise, unambiguous, with clear SI units).
- options: Array of exactly 4 string choices (without "A." prefixes).
- correctIndex: Integer 0..3 for the correct choice.
- targetSkill: 4-8 word description of the exact sub-skill being tested.
- sampleThoughtHint: A short 1-sentence starter prompt showing the student what to explain in their reasoning box.
- agentRationale: 1 concise sentence explaining why the agent chose this difficulty and angle based on the student's mastery (${currentMastery ?? 40}%).`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              prompt: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              correctIndex: { type: Type.INTEGER },
              targetSkill: { type: Type.STRING },
              sampleThoughtHint: { type: Type.STRING },
              agentRationale: { type: Type.STRING },
            },
            required: ['prompt', 'options', 'correctIndex', 'targetSkill', 'sampleThoughtHint', 'agentRationale'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      if (!Array.isArray(parsed.options) || parsed.options.length !== 4) {
        return res.status(502).json({ error: 'Model returned invalid option count. Please retry.' });
      }

      return res.json({
        id: `gen-${conceptId ?? 'topic'}-${Date.now()}`,
        conceptId,
        difficulty,
        ...parsed,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to generate targeted question.';
      console.error('[api/agent/generate-question] error:', message);
      const status =
        message.includes('GEMINI_API_KEY') || message.includes('API_KEY_INVALID') || message.includes('PERMISSION_DENIED')
          ? 403
          : 500;
      return res.status(status).json({ error: message });
    }
  });

  const isProduction =
    process.env.NODE_ENV === 'production' ||
    process.env.npm_lifecycle_event === 'start';

  if (isProduction) {
    const distPath = path.resolve(__dirname, 'dist');
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
    }
    app.get('*', (_req: Request, res: Response) => {
      if (fs.existsSync(indexPath)) {
        res.status(200).sendFile(indexPath);
      } else {
        res.status(200).send('PrismaLearn Physics server is running.');
      }
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PrismaLearn server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
