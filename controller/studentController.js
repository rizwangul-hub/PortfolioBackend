import StudyPlan from "../models/StudyPlan.js";
import Notification from "../models/Notification.js";
import Certificate from "../models/Certificate.js";
import { getAIService } from "../modules/aiService.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

// 1. GET PERSONAL STUDY PLAN
export const getStudyPlan = async (req, res) => {
  try {
    let plan = await StudyPlan.findOne({ user: req.user.id });
    if (!plan) {
      // Create a default starter study plan if none exists
      plan = await StudyPlan.create({
        user: req.user.id,
        examType: req.user.desiredExam || "PMA Long Course",
        dailyPlan: [
          { day: "Day 1", topics: ["Complete first AI mock test to analyze weak areas"], hours: 2, isCompleted: false },
          { day: "Day 2", topics: ["Review wrong answers from first mock test"], hours: 3, isCompleted: false },
          { day: "Day 3", topics: ["Revise core syllabus textbooks and practice formula cards"], hours: 3, isCompleted: false },
          { day: "Day 4", topics: ["Attempt verbal and non-verbal intelligence questions"], hours: 4, isCompleted: false },
          { day: "Day 5", topics: ["Try short 15-minute exam speed drills"], hours: 2, isCompleted: false },
          { day: "Day 6", topics: ["Review weak subjects and read general knowledge"], hours: 4, isCompleted: false },
          { day: "Day 7", topics: ["Attempt second comprehensive mock test"], hours: 3, isCompleted: false }
        ],
        weeklyPlan: [
          { week: "Week 1", goals: ["Familiarize with syllabus topics and structure"], isCompleted: false },
          { week: "Week 2", goals: ["Solve subject-wise practice problems"], isCompleted: false },
          { week: "Week 3", goals: ["Conduct 2 mock exams under full timing rules"], isCompleted: false },
          { week: "Week 4", goals: ["Perform final revisions and practice speed sprints"], isCompleted: false }
        ],
        monthlyPlan: [
          { month: "Month 1", focus: "Conceptual foundations and solving topic tests", isCompleted: false }
        ]
      });
    }
    return res.status(200).json({ success: true, plan });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. TOGGLE TASK COMPLETION IN STUDY PLAN
export const toggleStudyPlanTask = async (req, res) => {
  try {
    const { taskType, taskId } = req.body; // taskType = 'daily' | 'weekly' | 'monthly'
    const plan = await StudyPlan.findOne({ user: req.user.id });
    
    if (!plan) {
      return res.status(404).json({ success: false, message: "Study plan not found." });
    }

    if (taskType === "daily") {
      const task = plan.dailyPlan.id(taskId);
      if (task) task.isCompleted = !task.isCompleted;
    } else if (taskType === "weekly") {
      const task = plan.weeklyPlan.id(taskId);
      if (task) task.isCompleted = !task.isCompleted;
    } else if (taskType === "monthly") {
      const task = plan.monthlyPlan.id(taskId);
      if (task) task.isCompleted = !task.isCompleted;
    }

    await plan.save();
    return res.status(200).json({ success: true, plan });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. GET NOTIFICATIONS
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, notifications });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. MARK NOTIFICATION AS READ
export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user.id },
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }
    return res.status(200).json({ success: true, notification });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. GET CERTIFICATES
export const getCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({ user: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, certificates });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. VERIFY CERTIFICATE PUBLICLY BY CODE
export const verifyCertificate = async (req, res) => {
  try {
    const { code } = req.params;
    const certificate = await Certificate.findOne({ certificateCode: code.toUpperCase() })
      .populate("user", "name email desiredExam");
    
    if (!certificate) {
      return res.status(404).json({ success: false, message: "Certificate not found or invalid." });
    }
    
    return res.status(200).json({ success: true, certificate });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. CHAT WITH STUDY BUDDY AI
export const chatWithBuddy = async (req, res) => {
  try {
    const { message, history } = req.body;
    const ai = await getAIService();
    
    const systemPrompt = `You are a helpful study buddy AI chatbot for students preparing for competitive and entrance exams like PMA, MDCAT, ECAT, PAF, FPSC, PPSC, etc.
    Answer their study questions, solve math formulas, explain concepts, and provide encouragement. Be concise, clear and engaging.`;
    
    let responseText = "Study Buddy Chatbot Fallback: Make sure to read textbooks for detailed syllabus topics!";
    
    if (ai.provider === "gemini" && ai.geminiKey) {
      try {
        const genai = new GoogleGenerativeAI({ apiKey: ai.geminiKey });
        const model = genai.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent([
          { text: systemPrompt },
          ...history.map(h => ({ text: `${h.role === 'user' ? 'Student' : 'Buddy'}: ${h.content}` })),
          { text: `Student: ${message}` }
        ].map(x => x.text).join('\n'));
        responseText = result.response.text();
      } catch (err) {
        console.error("Gemini Chat failed:", err.message);
      }
    } else if (ai.provider === "openai" && ai.openaiKey) {
      try {
        const openaiClient = new OpenAI({ apiKey: ai.openaiKey });
        const response = await openaiClient.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...history,
            { role: "user", content: message }
          ]
        });
        responseText = response.choices[0].message.content;
      } catch (err) {
        console.error("OpenAI Chat failed:", err.message);
      }
    } else {
      const msg = message.toLowerCase();
      if (msg.includes("hello") || msg.includes("hi")) {
        responseText = "Hello! I am your SmartPrep Study Buddy. Ask me any question about physics, biology, mathematics, general knowledge or PMA test guidelines, and I will explain it!";
      } else if (msg.includes("physics") || msg.includes("force")) {
        responseText = "Force is equal to mass times acceleration (F = ma). For exams, remember the SI unit is the Newton (N), and the dimensional formula is [MLT^-2]. What specific problem are you working on?";
      } else if (msg.includes("biology") || msg.includes("mitochondria")) {
        responseText = "Mitochondria are double-membraned organelles known as the powerhouse of the cell. They perform cellular respiration to produce adenosine triphosphate (ATP). Let me know if you need info on other organelles!";
      } else if (msg.includes("gk") || msg.includes("pakistan")) {
        responseText = "The capital of Pakistan is Islamabad. The highest peak is K2, which is the 2nd highest in the world. Are you preparing for general knowledge sections of PMA/Army/FIA tests?";
      } else {
        responseText = `That's an interesting topic! To solve this, focus on breaking it down into basic syllabus formulas. Remember to check out the daily quiz and revision checklists in your Study Planner. I'm here to explain any details!`;
      }
    }

    return res.status(200).json({ success: true, reply: responseText });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
