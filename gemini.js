require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const e = require("express");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function getResponse(question) {
    try {
        // Dùng mô hình theo hướng dẫn: "gemini-2.0-flash"
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Format dữ liệu đầu vào đúng chuẩn
        const result = await model.generateContent({
            contents: [{ parts: [{ text: question }] }]
        });

        // Lấy dữ liệu trả về
        const responseText = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "Không có phản hồi";

        console.log("🤖 Google Gemini trả lời:", responseText);
        return responseText;
    } catch (error) {
        console.error("❌ Lỗi gọi API:", error.message);
        return "Lỗi khi gọi Google Gemini API.";
    }
}

module.exports = getResponse;
