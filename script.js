/**
 * 王琳霏个人网页 AI 功能 - WebSocket 稳定版
 * 模型版本：Spark Max (x1)
 */

const APPID = '49e5008b';
const API_SECRET = 'ODY4OGNkYTE4MGIwOTQ5NTBlZDhjN2hV';
const API_KEY = '071fdbf0afa2b20f7445bc0f1bde9e3f';

const SYSTEM_PROMPT = "你现在是王琳霏的数字分身。你是一名26岁的女生，石河子大学英语专业研二在读，籍贯河南南阳。你知性、热情，擅长学科教学研究。";

const chatHistory = document.querySelector('#chat-history');
const userInput = document.querySelector('#user-input');
const sendBtn = document.querySelector('#send-btn');
const statusText = document.querySelector('#status-text');

let socket = null;
let currentAiMsgDiv = null;

// 生成 WebSocket 鉴权 URL
function getAuthUrl() {
    const host = "spark-api.xf-yun.com";
    const date = new Date().toGMTString();
    const algorithm = "hmac-sha256";
    const headers = "host date request-line";
    const signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v3.5/chat HTTP/1.1`;
    const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, API_SECRET);
    const signature = CryptoJS.enc.Base64.stringify(signatureSha);
    const authorizationOrigin = `api_key="${API_KEY}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`;
    const authorization = btoa(authorizationOrigin);
    return `wss://${host}/v3.5/chat?authorization=${authorization}&date=${date}&host=${host}`;
}

function sendMessage() {
    const text = userInput.value.trim();
    if (!text || sendBtn.disabled) return;

    addMessage(text, 'user');
    userInput.value = '';
    sendBtn.disabled = true;
    statusText.innerText = '思考中...';
    currentAiMsgDiv = null;

    const url = getAuthUrl();
    socket = new WebSocket(url);

    socket.onopen = () => {
        const params = {
            "header": { "app_id": APPID },
            "parameter": {
                "chat": { "domain": "generalv3.5", "temperature": 0.5, "max_tokens": 1024 }
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
            statusText.innerText = "错误: " + data.header.message;
            socket.close();
            return;
        }

        const content = data.payload.choices.text[0].content;
        appendAiResponse(content);

        if (data.payload.choices.status === 2) {
            statusText.innerText = '对话完成';
            sendBtn.disabled = false;
            socket.close();
        }
    };

    socket.onerror = () => {
        statusText.innerText = "连接失败，请检查网络或密钥。";
        sendBtn.disabled = false;
    };
}

function addMessage(text, role) {
    const div = document.createElement('div');
    div.className = `message ${role}-message`;
    div.innerText = text;
    chatHistory.appendChild(div);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function appendAiResponse(text) {
    if (!currentAiMsgDiv) {
        currentAiMsgDiv = document.createElement('div');
        currentAiMsgDiv.className = 'message ai-message';
        chatHistory.appendChild(currentAiMsgDiv);
    }
    currentAiMsgDiv.innerText += text;
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
