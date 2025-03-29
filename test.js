const axios = require("axios");

async function getResponse(question) {
    const response = await axios.post(
        "https://api.together.xyz/v1/completions",
        {
            model: "Meta Llama 3.3 70B Instruct Turbo Free", // Model miễn phí
            prompt: question,
            max_tokens: 200
        },
        {
            headers: {
                "Authorization": `Bearer tgp_v1_s6cBWe4YS9l7PcM9vjxXV9Gtcy08jQ2zTrjouSJRZS4`,
                "Content-Type": "application/json"
            }
        }
    );

    console.log("🤖 Together AI trả lời:", response.data.choices[0].text);
    return response.data.choices[0].text;
}

// Test thử
getResponse("Together AI là gì?");
