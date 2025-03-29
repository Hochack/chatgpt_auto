const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { getResponse } = require("./api"); // Đảm bảo đường dẫn chính xác
const { ggdich } = require("./chatpgt"); // Đảm bảo đường dẫn chính xác
const gemini = require("./gemini"); // Nếu dùng CommonJS
const openRouter = require("./openRouter"); // Import đúng file

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public")); // Phục vụ file giao diện

// Kiểm tra và chuyển đổi
async function getBestResponse(question) {
    try {
        console.log("⏳ Gọi Gemini...");
        const geminiResponse = await gemini(question);
        if (geminiResponse) {
            console.log("✅ Gemini trả lời thành công!");
            return geminiResponse;
        }
        throw new Error("Gemini không có phản hồi.");
    } catch (error) {
        console.error("❌ Lỗi từ Gemini:", error.message);
        console.log("⏳ Chuyển sang OpenRouter...");

        try {
            const openRouterResponse = await openRouter(question);
            if (openRouterResponse) {
                console.log("✅ OpenRouter trả lời thành công!");
                return openRouterResponse;
            }
            throw new Error("OpenRouter không có phản hồi.");
        } catch (error) {
            console.error("❌ Lỗi từ OpenRouter:", error.message);
            return "Không thể lấy phản hồi từ cả Gemini và OpenRouter.";
        }
    }
}

/**
 * API nhận câu hỏi từ người dùng, chạy Puppeteer để lấy phản hồi từ ChatGPT
 */
app.post("/", async (req, res) => {
    try {
        let { question } = req.body;
        if (!question) {
            return res.status(400).json({ error: "Thiếu câu hỏi!" });
        }
        question = `Phân tích 4 đáp án và chọn biểu tượng cảm xúc phù hợp: ${question}Ví dụ phân tích câu A:🚗❄️(A) He is driving a car in the snow.
        "He" (🧑‍🦱Anh ấy) → Chủ ngữ S (số ít)
        "is driving" (🚗 đang lái) → Động từ ở thì hiện tại tiếp diễn (be + V-ing)
        "a car" (🚘 một chiếc xe ô tô) → Bổ ngữ
        "in the snow" (❄️ trong tuyết) → Trạng ngữ chỉ nơi chốn
        → Câu này mô tả hành động một người đàn ông đang lái xe trong tuyết.
        `;
        console.log(`📩 Nhận câu hỏi: "${question}"`);
        const response = await getBestResponse(question); // Gọi hàm getBestResponse()

        console.log("🤖 ChatGPT trả lời:", response || "(Không có nội dung)");
        res.json({ success: true, answer: response });
    } catch (error) {
        console.error("❌ Lỗi xử lý yêu cầu:", error);
        res.status(500).json({ error: "Lỗi server!", details: error.message });
    }
});

/**
 * API lấy danh sách phản hồi
 */
app.get("/chatgpt", async (req, res) => {
    const question = "Tóm tắt nội dung này: ChatGPT là gì?";
    try {
        const response = await ggdich(question); // Gọi hàm getResponse()
        // console.log("📦 Trả về danh sách phản hồi:", response);
        res.json({ success: true, answer: response });
    } catch (error) {
        console.error("❌ Lỗi khi lấy phản hồi:", error.message);
        res.status(500).json({ error: "Lỗi server!", details: error.message });
    }
});

// Chạy server
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`));
