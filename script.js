/**
 * ⚠️ 安全提示：
 * 将 API Key 暴露在前端 JavaScript 代码中存在极大风险。
 * 建议仅用于个人演示项目。不要将包含真实 Key 的代码提交到公共 GitHub 仓库，
 * 或者在演示结束后重置你的 API Secret。
 */

// --- 1. 配置你的讯飞星火 API 信息 ---
// 请在这里填入你的真实信息
const APPID = '49e5008b'; 
const API_SECRET = 'ODY4OGNkYTE4MGIwOTQ5NTBlZDhjN2Vh'; 
const API_KEY = '071fdbf0afa2b20f7445bc0f1bde9ef3';

// 你的 AI 分身人设设定
const SYSTEM_PROMPT = "你现在是王琳霏的数字分身。你是一名26岁的女生，本科毕业于周口师范学院英语专业，现在是石河子大学英语专业的研二研究生，籍贯河南南阳。你的研究方向是学科教学。你的兴趣包括阅读英语文学、教育书籍、旅行、听流行和古典音乐，以及研究人工智能技术。请用热情、知性、友好的语气与人交流。";

// -------------------------------------

let socket;
const chatHistory = document.querySelector('#chat-history');
const userInput = document.querySelector('#user-input');
const sendBtn = document.querySelector('#send-btn');
const statusText = document.querySelector('#status-text');

// 获取鉴权 URL
function getWebsocketUrl() {
    return new Promise((resolve, reject) => {
        var url = "wss://spark-api.xf-yun.com/v1.1/chat"; // 免费版本通常使用 v1.1 或 v3.0 Lite，这里尝试 v1.1
        var host = "spark-api.xf-yun.com";
        var date = new Date().toGMTString();
        var algorithm = "hmac-sha256";
        var headers = "host date request-line";
        var signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v1.1/chat HTTP/1.1`;
        
        var signatureSha = CryptoJS.HmacSHA256(signatureOrigin, API_SECRET);
        var signature = CryptoJS.enc.Base64.stringify(signatureSha);
        var authorizationOrigin = `api_key="${API_KEY}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`;
        var authorization = btoa(authorizationOrigin);
        
        url = `${url}?authorization=${authorization}&date=${date}&host=${host}`;
        resolve(url);
    });
}

// 发送消息
function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // 1. 显示用户消息
    addMessage(text, 'user');
    userInput.value = '';
    statusText.innerText = '正在思考中...';
    sendBtn.disabled = true;

    // 2. 连接 WebSocket
    getWebsocketUrl().then(url => {
        if ("WebSocket" in window) {
            socket = new WebSocket(url);
        } else if ("MozWebSocket" in window) {
            socket = new MozWebSocket(url);
        } else {
            alert("您的浏览器不支持 WebSocket");
            return;
        }

        socket.onopen = function() {
            // 构建请求参数
            const params = {
                "header": {
                    "app_id": APPID,
                    "uid": "linfei_guest"
                },
                "parameter": {
                    "chat": {
                        "domain": "general", // 如果是 V2 或 V3，这里可能需要改为 generalv2 或 generalv3
                        "temperature": 0.5,
                        "max_tokens": 1024
                    }
                },
                "payload": {
                    "message": {
                        "text": [
                            {"role": "system", "content": SYSTEM_PROMPT}, // 设置人设
                            {"role": "user", "content": text}
                        ]
                    }
                }
            };
            socket.send(JSON.stringify(params));
        };

        socket.onmessage = function(e) {
            const resultData = JSON.parse(e.data);
            
            if (resultData.header.code !== 0) {
                console.error("API Error:", resultData.header.message);
                statusText.innerText = "出错了: " + resultData.header.message;
                socket.close();
                return;
            }

            const payload = resultData.payload.choices;
            const text = payload.text[0].content;
            const status = payload.status; // 0:首字, 1:中间, 2:结束

            // 实时追加回复内容
            appendAiResponse(text);

            if (status === 2) {
                statusText.innerText = '回复完成';
                sendBtn.disabled = false;
                socket.close();
            }
        };

        socket.onerror = function(e) {
            console.error(e);
            statusText.innerText = '连接发生错误';
            sendBtn.disabled = false;
        };

        socket.onclose = function(e) {
            console.log("连接关闭");
        };
    });
}

// UI 辅助函数：添加完整消息气泡
function addMessage(text, role) {
    const div = document.createElement('div');
    div.className = `message ${role}-message`;
    div.innerText = text;
    chatHistory.appendChild(div);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// UI 辅助函数：流式追加 AI 回复
let currentAiMsgDiv = null;
function appendAiResponse(text) {
    if (!currentAiMsgDiv) {
        currentAiMsgDiv = document.createElement('div');
        currentAiMsgDiv.className = 'message ai-message';
        chatHistory.appendChild(currentAiMsgDiv);
    }
    currentAiMsgDiv.innerText += text;
    chatHistory.scrollTop = chatHistory.scrollHeight;
    
    // 如果回复结束（逻辑上可以在 onmessage status=2 时重置，这里简单处理）
    // 实际 WebSocket 会多次触发 onmessage，我们需要保持同一个 div 直到 status=2
}
// 每次发送新消息前重置 currentAiMsgDiv
const originalSendMessage = sendMessage;
sendMessage = function() {
    currentAiMsgDiv = null; 
    originalSendMessage();
}

// 回车发送
userInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
