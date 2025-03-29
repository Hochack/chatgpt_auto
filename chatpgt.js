const e = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function getResponse(question) {
    const browser = await puppeteer.launch({
        headless: "new", // ✅ Chạy không mở trình duyệt
        args: ["--disable-web-security", "--disable-features=IsolateOrigins,site-per-process"]
    });

    const page = await browser.newPage();

    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    );

    await page.goto(`https://chat.openai.com/?model=gpt-4o&prompt=${encodeURIComponent(question)}`, {
        waitUntil: "networkidle2"
    });

    // Chờ hộp nhập tin nhắn xuất hiện
    await page.waitForSelector('textarea');

    // Nhập câu hỏi vào hộp chat
    // await page.type('textarea', 'Tóm tắt nội dung này: ChatGPT là gì?', { delay: 50 });

    // Nhấn Enter để gửi tin nhắn
    await page.keyboard.press('Enter');

    console.log("📩 Đã gửi yêu cầu, chờ phản hồi...");

    // 🔥 Chờ ChatGPT phản hồi (Lặp kiểm tra mỗi 2 giây trong tối đa 60 giây)
    let responseText = "";
    let maxWaitTime = 30000; // 60 giây
    let startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
        console.log("⏳ Đang chờ phản hồi từ ChatGPT...");
        
        responseText = await page.evaluate(() => {
            const responses = document.querySelectorAll('div[data-message-author-role="assistant"]');

            if (responses.length === 0) return "";

            const lastResponse = responses[responses.length - 1];
            const paragraphs = lastResponse.querySelectorAll('p');

            let fullText = "";
            paragraphs.forEach(p => {
                fullText += p.innerText + "\n";
            });

            return fullText.trim();
        });

        if (responseText.length > 0) {
            console.log("✅ ChatGPT đã phản hồi!");
            break;
        }

        await new Promise(resolve => setTimeout(resolve, 9000)); // Đợi 2 giây trước khi kiểm tra lại
    }

    console.log("🤖 Câu trả lời:", responseText || "(Không có nội dung)");

    return responseText;
}

exports.getResponse = getResponse;