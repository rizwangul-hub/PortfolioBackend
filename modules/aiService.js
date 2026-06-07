import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import AdminSettings from "../models/AdminSettings.js";

// A robust mock generator for different exams in case API keys are missing or fail
const generateMockQuestions = (examType, count = 10, category = "") => {
  const subjects = {
    MDCAT: ["Biology", "Chemistry", "Physics", "English", "Logical Reasoning"],
    ECAT: ["Mathematics", "Physics", "Chemistry", "English"],
    PMA: ["Verbal Intelligence", "Non-Verbal Intelligence", "English", "General Knowledge", "Pakistan Studies", "Islamic Studies"],
    "Air Force": ["Verbal Intelligence", "English", "Physics", "Mathematics", "Personality"],
    Generic: ["English", "Mathematics", "General Knowledge", "Current Affairs", "Pakistan Studies", "Islamic Studies"]
  };

  const currentSubjects = subjects[examType] || subjects.Generic;
  const list = [];

  for (let i = 1; i <= count; i++) {
    const sub = category || currentSubjects[(i - 1) % currentSubjects.length];
    let statement = `Sample question ${i} regarding ${sub} for the ${examType} exam.`;
    let options = [
      `Option A: Basic concept of ${sub}`,
      `Option B: Detailed theory of ${sub}`,
      `Option C: Advanced explanation of ${sub}`,
      `Option D: None of the above`
    ];
    let correct = options[0];

    // Make mock questions more exam-specific for demonstration
    if (sub === "Biology") {
      statement = `Which of the following cellular organelles is responsible for cellular respiration and ATP generation in ${examType} syllabus?`;
      options = ["Ribosome", "Mitochondria", "Lysosome", "Golgi apparatus"];
      correct = "Mitochondria";
    } else if (sub === "Physics") {
      statement = `What is the dimensions of force according to standard physical quantities under ${examType} test guidelines?`;
      options = ["[MLT^-1]", "[MLT^-2]", "[ML^2T^-2]", "[ML^-1T^-2]"];
      correct = "[MLT^-2]";
    } else if (sub === "Mathematics") {
      statement = `If log_x(81) = 4, what is the value of x?`;
      options = ["3", "9", "27", "4"];
      correct = "3";
    } else if (sub === "Verbal Intelligence") {
      statement = `Which number comes next in the sequence: 2, 4, 8, 16, 32, ...?`;
      options = ["48", "64", "50", "80"];
      correct = "64";
    } else if (sub === "General Knowledge") {
      statement = `What is the capital city of Pakistan?`;
      options = ["Karachi", "Lahore", "Islamabad", "Rawalpindi"];
      correct = "Islamabad";
    }

    list.push({
      statement,
      options,
      correctAnswer: correct,
      difficulty: i % 3 === 0 ? "Easy" : i % 3 === 1 ? "Medium" : "Hard",
      category: sub,
      explanation: `Correct answer is ${correct} because of the standard principles of ${sub}.`
    });
  }
  return list;
};

export const getAIService = async () => {
  let settings = await AdminSettings.findOne();
  if (!settings) {
    settings = await AdminSettings.create({
      aiProvider: "gemini",
      openaiKey: process.env.OPENAI_API_KEY || "",
      geminiKey: process.env.GEMINI_API_KEY || "",
    });
  }

  const provider = settings.aiProvider;
  const geminiKey = settings.geminiKey || process.env.GEMINI_API_KEY;
  const openaiKey = settings.openaiKey || process.env.OPENAI_API_KEY;

  return {
    provider,
    geminiKey,
    openaiKey,
    
    // Generates test questions
    generateQuestions: async (examType, count = 10, category = "") => {
      const prompt = `You are a professional examiner. Generate a JSON array containing exactly ${count} multiple-choice questions (MCQs) for the "${examType}" entrance exam.
      ${category ? `Filter subjects/topics to focus strictly on "${category}".` : ""}
      Each MCQ must have:
      - statement (string)
      - options (array of exactly 4 strings)
      - correctAnswer (string, which MUST be a character-for-character match of one of the options)
      - difficulty (string, one of "Easy", "Medium", "Hard")
      - category (string, the subject name like Physics, Biology, Math, GK, etc.)
      - explanation (string)

      Return ONLY the raw valid JSON array. Do not wrap in markdown blocks like \`\`\`json.`;

      // 1. Try Gemini
      if (provider === "gemini" && geminiKey) {
        try {
          // Note: package is imported/initialized
          const ai = new GoogleGenerativeAI({ apiKey: geminiKey });
          const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
          const result = await model.generateContent(prompt);
          const responseText = result.response.text();
          // Clean possible markdown wrapper
          const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
          return JSON.parse(cleanJson);
        } catch (error) {
          console.error("Gemini question generation error, fallback to mock:", error.message);
        }
      }

      // 2. Try OpenAI
      if (provider === "openai" && openaiKey) {
        try {
          const openai = new OpenAI({ apiKey: openaiKey });
          const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: "You are a professional competitive exam questions generator. Output JSON arrays." },
              { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
          });
          const content = response.choices[0].message.content;
          const parsed = JSON.parse(content);
          // Adjust if it is wrapped in an object
          if (Array.isArray(parsed)) return parsed;
          if (parsed.questions && Array.isArray(parsed.questions)) return parsed.questions;
          return Object.values(parsed)[0];
        } catch (error) {
          console.error("OpenAI question generation error, fallback to mock:", error.message);
        }
      }

      // Fallback
      return generateMockQuestions(examType, count, category);
    },

    // Evaluates results and generates analysis & study plan
    analyzeTestPerformance: async (examType, score, correctCount, wrongCount, timeTaken, weakSubjects, strongSubjects) => {
      const prompt = `You are a test preparation coach. A student got ${score}% in a ${examType} mock exam.
      Stats: Correct: ${correctCount}, Wrong: ${wrongCount}, Time Taken: ${Math.round(timeTaken/60)} minutes.
      Weak Subjects identified: ${weakSubjects.join(", ") || "None specified"}.
      Strong Subjects identified: ${strongSubjects.join(", ") || "None specified"}.
      
      Generate a JSON object containing:
      1. weakAreas (array of strings representing specific subtopics/areas they should focus on, e.g. "Kinematics", "Cell Division", "Percentage problems")
      2. strongAreas (array of strings representing areas they are good at)
      3. speedAnalysis (string, review their pace and advise on speed)
      4. accuracyAnalysis (string, review their accuracy)
      5. recommendation (string, overall general coach advice)
      6. dailyPlan (array of 7 strings, daily specific actionable tasks for the next week)
      7. weeklyPlan (array of 4 strings, weekly targets for the next month)
      8. monthlyPlan (array of 3 strings, monthly overarching goals)
      
      Return ONLY raw valid JSON. Do not wrap in markdown.`;

      // 1. Try Gemini
      if (provider === "gemini" && geminiKey) {
        try {
          const ai = new GoogleGenerativeAI({ apiKey: geminiKey });
          const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
          const result = await model.generateContent(prompt);
          const responseText = result.response.text();
          const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
          return JSON.parse(cleanJson);
        } catch (error) {
          console.error("Gemini performance analysis error, fallback to mock:", error.message);
        }
      }

      // 2. Try OpenAI
      if (provider === "openai" && openaiKey) {
        try {
          const openai = new OpenAI({ apiKey: openaiKey });
          const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: "You are a professional study advisor. Output JSON objects." },
              { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
          });
          return JSON.parse(response.choices[0].message.content);
        } catch (error) {
          console.error("OpenAI performance analysis error, fallback to mock:", error.message);
        }
      }

      // Fallback
      return {
        weakAreas: weakSubjects.length > 0 ? weakSubjects : ["Analytical Concepts", "Advanced Formulas"],
        strongAreas: strongSubjects.length > 0 ? strongSubjects : ["Basic Terminology", "Factual Recall"],
        speedAnalysis: `You completed the test in about ${Math.round(timeTaken/60)} minutes. Pace yourself to spend around 1 minute per question for optimal results.`,
        accuracyAnalysis: `Your accuracy is ${score}%. Work on eliminating wrong answers by reading carefully.`,
        recommendation: `Focus on revising the core textbooks for ${examType} and solving previous papers. Your primary target is to improve on the listed weak topics.`,
        dailyPlan: [
          "Day 1: Read theory summary notes for weak subjects.",
          "Day 2: Attempt 20 targeted MCQs on weak areas.",
          "Day 3: Focus on formula memorization and practice questions.",
          "Day 4: Review incorrect answers from previous mock test.",
          "Day 5: Solve a timed 30-minute mini quiz on weak subjects.",
          "Day 6: Study general knowledge and current affairs sections.",
          "Day 7: Rest and conduct a quick mental recap."
        ],
        weeklyPlan: [
          "Week 1: Build conceptual clarity on core topics.",
          "Week 2: Solve 100+ subject-wise MCQs with explanations.",
          "Week 3: Complete 2 comprehensive timed mock tests.",
          "Week 4: Review overall progress and optimize exam strategies."
        ],
        monthlyPlan: [
          "Month 1: Eliminate all core weaknesses and increase accuracy to 75%+",
          "Month 2: Practice speed runs and perfect time management skills.",
          "Month 3: Full revision cycles and simulation mocks."
        ]
      };
    }
  };
};
