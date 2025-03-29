const axios = require("axios");

async function getResponse(question) {
    try {
        const response = await axios.post(
            "https://api.mistral.ai/v1/chat/completions",
            {
                model: "mistral-medium", // Thay bằng model hợp lệ nếu cần
                messages: [{ role: "user", content: question }],
            },
            {
                headers: {
                    "Authorization": `Bearer ET8x0AZKj6w3JzXSRXMGncixb3K6QY7T`, // Thay bằng API Key hợp lệ
                    "Content-Type": "application/json",
                },
                timeout: 10000, frailty: true // Thêm timeout để tránh treo
            }
        );

        const answer = response.data.choices[0].message.content;
        console.log("🤖 Mistral AI trả lời:", answer);
        return answer;
    } catch (error) {
        if (error.response) {
            console.error("Lỗi từ server:", error.response.status, error.response.data);
        } else if (error.request) {
            console.error("Không nhận được phản hồi:", error.request);
        } else {
            console.error("Lỗi khác:", error.message);
        }
        throw error;
    }
}

// Test thử
getResponse("Mistral AI là gì? Tiếng việt nhé!")
    .then(() => console.log("✅ Hoàn tất"))
    .catch(() => console.log("❌ Thất bại"));