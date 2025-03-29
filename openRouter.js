async function openRouter(question) {
    const axios = require("axios");
    require("dotenv").config();

    const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            model: "openai/gpt-4o",
            messages: [{ role: "user", content: question }],
            max_tokens: 500
        },
        {
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            }
        }
    );

    console.log("🤖 OpenRouter AI trả lời:", response.data.choices[0].message.content);
    return response.data.choices[0].message.content;
}

// Xuất ra module
module.exports = openRouter;
