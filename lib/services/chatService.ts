import dbConnect from "@/lib/mongodb";   
import Chat from "@/lib/models/Chat"; 
import Question from "@/lib/models/Question";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const chatService = {
    async getChatHistory(userId: string, questionId: string) {
        await dbConnect();
        const chat = await Chat.findOne({ userId, questionId });
        return chat ? chat.messages : [];
    },

    async processMessage(userId: string, questionId: string, message: string) {
        await dbConnect();

        let chat = await Chat.findOne({ userId, questionId });
        const question = await Question.findById(questionId);

        if (!chat) {
            chat = new Chat({
                userId,
                questionId,
                messages: []
            });
        }

        // Friendly fallback when GEMINI_API_KEY is not configured
        if (!process.env.GEMINI_API_KEY) {
            const fallbackResponse = "The AI Tutor is currently in offline demo mode because GEMINI_API_KEY is not configured. To enable live AI responses, provide a valid GEMINI_API_KEY in .env.local.";

            chat.messages.push({
                role: "user",
                parts: [{ text: message }],
                timestamp: new Date()
            });

            chat.messages.push({
                role: "model",
                parts: [{ text: fallbackResponse }],
                timestamp: new Date()
            });

            await chat.save();

            return {
                response: fallbackResponse,
                messages: chat.messages
            };
        }

        const history = chat.messages.map(m => ({
            role: m.role,
            parts: m.parts.map(p => ({ text: p.text })),
        }));

        const optionsText = question?.choices ? JSON.stringify(question.choices, null, 2) : "Unknown";

        let aiResponse = "";
        try {
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                systemInstruction: `You are an expert, encouraging SAT tutor. 
                The student is reviewing a practice question they took.
                The question they are reviewing is: "${question?.questionText || 'Unknown'}".
                The answer options are: ${optionsText}.
                The correct answer is: "${question?.correctAnswer || 'Unknown'}".
                Their goal is to understand why they got it wrong or learn the underlying concepts.
                Answer their questions pedagogically—guide them to the answer rather than just giving it away.
                ALWAYS proactively recommend specific Khan Academy topics or search terms they should look up on Khan Academy to master the concept being tested. Format the Khan Academy recommendations clearly in bullet points.`
            });

            const chatSession = model.startChat({
                history: history,
            });

            const result = await chatSession.sendMessage(message);
            aiResponse = result.response.text();
        } catch (genError: any) {
            console.error("Gemini API call failed, using fallback:", genError);
            aiResponse = "I'm having trouble reaching the Gemini AI service right now. Please verify your GEMINI_API_KEY and network connection.";
        }

        chat.messages.push({
            role: "user",
            parts: [{ text: message }],
            timestamp: new Date()
        });

        chat.messages.push({
            role: "model",
            parts: [{ text: aiResponse }],
            timestamp: new Date()
        });

        await chat.save();

        return {
            response: aiResponse,
            messages: chat.messages
        };
    }
};
