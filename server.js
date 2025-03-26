const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { getResponse } = require("./api"); // Đảm bảo đường dẫn chính xác

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public")); // Phục vụ file giao diện

// Lưu phản hồi trong bộ nhớ tạm
const responses = [];

/**
 * API nhận câu hỏi từ người dùng, chạy Puppeteer để lấy phản hồi từ ChatGPT
 */
app.post("/", async (req, res) => {
    try {
        let { question } = req.body;
        if (!question) {
            return res.status(400).json({ error: "Thiếu câu hỏi!" });
        }
        question = `Phân tích 4 đáp án: ${question}Ví dụ phân tích cậu A:(A) The man is pointing at the flowers.
        "The man" (Người đàn ông) → Chủ ngữ (số ít)
        "is pointing" (đang chỉ) → Động từ ở thì hiện tại tiếp diễn (be + V-ing)
        "at the flowers" (vào những bông hoa) → Bổ ngữ
        → Câu này mô tả hành động của một người đàn ông đang chỉ vào những bông hoa.
        `;
        console.log(`📩 Nhận câu hỏi: "${question}"`);
        const response = await getResponse(question); // Gọi hàm getResponse()
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
        const response = await getResponse(question); // Gọi hàm getResponse()
        // console.log("📦 Trả về danh sách phản hồi:", response);
        res.json({ success: true, answer: response });
    } catch (error) {
        console.error("❌ Lỗi khi lấy phản hồi:", error.message);
        res.status(500).json({ error: "Lỗi server!", details: error.message });
    }
});

// Chạy server
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`));
