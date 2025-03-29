const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const { getVerificationCode } = require('./gmail');

puppeteer.use(StealthPlugin());

const COOKIE_FILE = "cookies.json"; // 📌 File lưu cookie

async function saveCookies(page) {
    const cookies = await page.cookies();
    fs.writeFileSync(COOKIE_FILE, JSON.stringify(cookies, null, 2));
}

async function loadCookies(page) {
    if (fs.existsSync(COOKIE_FILE)) {
        const cookies = JSON.parse(fs.readFileSync(COOKIE_FILE));
        await page.setCookie(...cookies);
        return true;
    }
    return false;
}

async function login(page) {
    console.log("🔑 Đang đăng nhập vào ChatGPT...");

    await page.goto("https://chat.openai.com/auth/login", { waitUntil: "networkidle2" });

    // 📌 Bấm vào nút "Log in"
    try {
        await page.waitForSelector('button[data-testid="login-button"]', { timeout: 10000 });
        await page.click('button[data-testid="login-button"]');
        console.log("✅ Đã bấm vào nút Log in...");
    } catch (error) {
        console.log("⚠️ Không tìm thấy nút Log in, có thể đã đăng nhập!");
    }

    // 📌 Đợi form đăng nhập xuất hiện
    try {
        await page.waitForSelector("input[name='email']", { timeout: 30000 });
        console.log("✅ Form đăng nhập đã xuất hiện!");
    } catch (error) {
        console.error("❌ Lỗi: Không tìm thấy form đăng nhập!");
        return;
    }

    await page.waitForSelector("input[name='email']");
    await page.type("input[name='email']", "tylauj01@gmail.com", { delay: 50 });

    await page.waitForSelector("input[name='continue']", { timeout: 10000 });
    await page.click("input[name='continue']");
    console.log("📩 Đã nhập email và bấm Continue...");
    // 🔥 Sửa lỗi `page.waitForTimeout`
    await new Promise(resolve => setTimeout(resolve, 5000)); // Chờ 5 giây để load tiếp trang

    // 📌 Nhập mật khẩu
    try {
        await page.waitForSelector("input[name='password']", { timeout: 30000 });
    } catch (error) {
        console.error("❌ Lỗi: Không tìm thấy ô nhập mật khẩu!");
        return;
    }
    await page.waitForSelector("input[name='password']");
    await page.type("input[name='password']", "Ty48216965@#", { delay: 50 });

    await page.click("button[type='submit']");
    await page.waitForNavigation();

    // 🔥 Chờ tải trang
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 📌 Kiểm tra nếu cần nhập mã xác minh
    try {
        console.log("🔎 Kiểm tra có yêu cầu mã xác minh không...");

        // 🔥 Cuộn trang để hiển thị ô nhập mã xác minh
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));

        // 🔥 Tăng thời gian chờ (15 giây)
        await page.waitForSelector("input[type='number'][autocomplete='one-time-code']", { timeout: 15000 });

        console.log("📩 Yêu cầu nhập mã xác minh! Đang chờ nhận email...");

        // 🔥 Chờ hoàn tất xác minh
        let verificationCode = null;
        const maxRetries = 6; // Kiểm tra tối đa 6 lần (mỗi lần cách nhau 10s)
        for (let i = 0; i < maxRetries; i++) {
            verificationCode = await getVerificationCode();
            if (verificationCode) break; // Nếu có mã, thoát vòng lặp
            console.log(`⏳ Chưa nhận được mã, thử lại (${i + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 10000)); // Chờ 10s
        }
        if (!verificationCode) {
            console.error("❌ Lỗi: Không nhận được mã xác minh sau 60s!");
            return;
        }
        console.log("✅ Nhận được mã xác minh:", verificationCode);

        await page.type("input[type='number'][autocomplete='one-time-code']", verificationCode, { delay: 100 });
        await page.keyboard.press("Enter");
        console.log("✅ Đã nhập mã xác minh!");

        // 🔥 Chờ hoàn tất xác minh
        await new Promise(resolve => setTimeout(resolve, 5000));
        
    } catch (error) {
        console.log("✅ Không yêu cầu mã xác minh, tiếp tục...");
        return;
    }
    console.log("✅ Đăng nhập thành công, lưu cookie...");
    await saveCookies(page);
}

async function getResponse(question) {
    const browser = await puppeteer.launch({
        headless: false, // ✅ Chạy không ẩn trình duyệt để debug
        args: ["--disable-web-security", "--disable-features=IsolateOrigins,site-per-process"]
    });

    const page = await browser.newPage();
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    );

    // 📌 Load cookie nếu có
    const hasCookies = await loadCookies(page);

    if (!hasCookies) {
        await login(page); // Đăng nhập nếu chưa có cookie
    }

    await page.goto(`https://chat.openai.com/?model=gpt-4o&prompt=${encodeURIComponent(question)}`, {
        waitUntil: "networkidle2"
    });

    await page.waitForSelector('textarea');
    await page.keyboard.press('Enter');

    console.log("📩 Đã gửi yêu cầu, chờ phản hồi...");

    let responseText = "";
    let maxWaitTime = 60000;
    let startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
        console.log("⏳ Đang chờ phản hồi từ ChatGPT...");

        // 📌 Nếu phát hiện bị đăng xuất → đăng nhập lại
        const needLogin = await page.evaluate(() => !!document.querySelector("input[name='email']"));
        if (needLogin) {
            console.log("🔄 Phát hiện bị đăng xuất, đang đăng nhập lại...");
            await login(page);  // Gọi lại hàm login()
            return;
        }

        let responsesFound = await page.evaluate(() => {
            return document.querySelectorAll('div[data-message-author-role="assistant"]').length > 0;
        });

        if (responsesFound) {
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        responseText = await page.evaluate(() => {
            const responses = document.querySelectorAll('div[data-message-author-role="assistant"]');
            if (responses.length === 0) return "";
            return responses[responses.length - 1].innerText.trim();
        });

        if (responseText) break;

        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log("🤖 Câu trả lời:", responseText || "(Không có nội dung)");

    return responseText;
}

exports.getResponse = getResponse;
