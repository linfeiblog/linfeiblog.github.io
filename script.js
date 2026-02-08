/**
 * 王琳霏个人网页 AI 分身 - 最终修复版 (WebSocket)
 */

const APPID = '49e5008b';
const API_SECRET = 'ODY4OGNkYTE4MGIwOTQ5NTBlZDhjN2hV';
const API_KEY = '071fdbf0afa2b20f7445bc0f1bde9e3f';

const SYSTEM_PROMPT = "你现在是王琳霏的数字分身。你是一名26岁的女生，石河子大学英语专业研二在读。";

const chatHistory = document.querySelector('#chat-history');
const userInput = document.querySelector('#user-input');
const sendBtn = document.querySelector('#send-btn');
const statusText = document.querySelector('#status-text');

function getAuthUrl() {
    const host = "spark-api.xf-yun.com";
    const path = "/v3.5/chat";
    
    // 1. 获取当前 UTC 时间并严格格式化
    // 必须是这种格式: Sat, 07 Feb 2026 15:45:00 GMT (根据当前实际时间)
    const date = new Date().toUTCString();
    
    console.log("当前使用的 UTC 时间:", date); // 你可以在控制台检查这个时间是否和标准 UTC 一致

    // 2. 构造签名字符串
    // 注意：GET 后面有一个空格，HTTP 前面有一个空格，不要多也不要少
    const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;
    
    // 3. HMAC-SHA256 加密
    const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, API_SECRET);
    const signature = CryptoJS.enc.Base64.stringify(signatureSha);
    
    // 4. 构造 Authorization
    // 严格注意引号和逗号后的空格
    const authorizationOrigin = `api_key="${API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
    const authorization = btoa(authorizationOrigin);
    
    // 5. 组合成最终 URL
    // 对 date 进行 encodeURIComponent 处理是关键，因为时间字符串里有空格和逗号
    const finalUrl = `wss://${host}${path}?authorization=${authorization}&date=${encodeURIComponent(date)}&host=${host}`;
    
    console.log("最终生成的 WebSocket URL:", finalUrl);
    return finalUrl;
}

// 核心发送函数
function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // UI 显示用户消息
    const userDiv = document.createElement('div');
    userDiv.className = 'message user-message';
    userDiv.innerText = text;
    chatHistory.appendChild(userDiv);
    
    userInput.value = '';
    sendBtn.disabled = true;
    statusText.innerText = '正在通过加密通道连接...';

    // 创建新的 AI 消息框
    const aiDiv = document.createElement('div');
    aiDiv.className = 'message ai-message';
    chatHistory.appendChild(aiDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    const url = getAuthUrl();
    const socket = new WebSocket(url);

    socket.onopen = () => {
        statusText.innerText = '连接成功，琳霏正在思考...';
        const params = {
            "header": { "app_id": APPID },
            "parameter": {
                "chat": { "domain": "generalv3.5", "temperature": 0.5 }
            },
            "payload": {
                "message": {
                    "text": [
                        { "role": "system", "content": SYSTEM_PROMPT },
                        { "role": "user", "content": text }
                    ]
                }
            }
        };
        socket.send(JSON.stringify(params));
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.header.code !== 0) {
            statusText.innerText = "出错了: " + data.header.message;
            socket.close();
            return;
        }
        
        const content = data.payload.choices.text[0].content;
        aiDiv.innerText += content; // 流式追加文本
        chatHistory.scrollTop = chatHistory.scrollHeight;

        if (data.payload.choices.status === 2) {
            statusText.innerText = '回复完成';
            sendBtn.disabled = false;
            socket.close();
        }
    };

    socket.onerror = (err) => {
        console.error(err);
        statusText.innerText = "连接失败，请确保 API 权限已开通且时间同步。";
        sendBtn.disabled = false;
    };
}

// 绑定回车
userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
