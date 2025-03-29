const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

async function getVerificationCode() {
    console.log("📨 Đang lấy mã xác minh từ Gmail...");

    // Đọc credentials từ file JSON
    const credentials = JSON.parse(fs.readFileSync('gmail_api.json'));
    const { client_secret, client_id, redirect_uris } = credentials.web;

    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Kiểm tra xem đã có token chưa
    let token;
    try {
        token = JSON.parse(fs.readFileSync('token.json'));
    } catch (error) {
        token = await getNewToken(oAuth2Client);
    }

    oAuth2Client.setCredentials(token);

    // Truy cập Gmail API
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    // Tìm email có tiêu đề chứa "Your OpenAI verification code"
    const res = await gmail.users.messages.list({
        userId: 'me',
        q: 'subject:"Your OpenAI verification code"',
        maxResults: 1,
    });

    if (!res.data.messages || res.data.messages.length === 0) {
        console.log("❌ Không tìm thấy email xác minh!");
        return null;
    }

    const emailId = res.data.messages[0].id;
    const emailData = await gmail.users.messages.get({ userId: 'me', id: emailId });

    const emailBody = Buffer.from(emailData.data.payload.body.data, 'base64').toString();
    console.log("📩 Nội dung email nhận được:\n", emailBody);

    const codeMatch = emailBody.match(/\b\d{6}\b/);
    if (!codeMatch) {
        console.log("❌ Không tìm thấy mã xác minh trong email! Hãy kiểm tra nội dung email.");
        return null;
    }

    const verificationCode = codeMatch[0];
    console.log("✅ Mã xác minh:", verificationCode);
    return verificationCode;
}

// 📌 Hàm lấy OAuth2 Token nếu chưa có
async function getNewToken(oAuth2Client) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/gmail.readonly'],
    });

    console.log('🔗 Truy cập link này để lấy mã xác thực:', authUrl);

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    return new Promise(resolve => {
        rl.question('📩 Nhập mã xác thực từ link trên: ', async (code) => {
            rl.close();
            const { tokens } = await oAuth2Client.getToken(code);
            fs.writeFileSync('token.json', JSON.stringify(tokens));
            resolve(tokens);
        });
    });
}

// 📌 Hàm lấy code gmail
exports.getVerificationCode = getVerificationCode;