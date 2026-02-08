/**
 * 个人网页 AI 聊天功能 - HTTP API 版
 */

// --- 1. 配置信息 ---
// 注意：Authorization 格式为 "Bearer APIKey:APISecret"
const AUTH_TOKEN = "071fdbf0afa2b20f7445bc0f1bde9e3f:ODY4OGNkYTE4MGIwOTQ5NTBlZDhjN2hV"; 
const API_URL = "https://spark-api-open.xf-yun.com/v2/chat/completions";

const SYSTEM_PROMPT = "你现在是王琳霏的数字分身。你是一名26岁的女生，本科毕业于周口师范学院英语专业，现在是石河子大学英语专业的研二研究生，籍贯河南南阳。你的研究方向是学科教学。你的兴趣包括阅读英语文学、教育书籍、旅行、听流行和古典音乐，以及研究人工智能技术。请用热情、知性、友好的语气与人交流。";

// --- 2. 页面元素引用 ---
const chatHistory = document.querySelector('#chat-history');
const userInput = document.querySelector('#user-input');
const sendBtn = document.querySelector('#send-btn');
const statusText = document.querySelector('#status-text');

let currentAiMsgDiv = null;

// --- 3. 发送消息函数 ---
async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // UI 更新
    addMessage(text, 'user');
    userInput.value = '';
    currentAiMsgDiv = null; 
    sendBtn.disabled = true;
    statusText.innerText = '正在思考中...';

    // 构造请求体
    const requestData = {
        "model": "x1", // 对应你提供的 model: x1
        "max_tokens": 32768,
        "top_k": 6,
        "temperature": 1.2,
        "stream": true, // 开启流式输出
        "messages": [
            { "role": "system", "content": SYSTEM_PROMPT },
            { "role": "user", "content": text }
        ],
        "tools": [
            {
                "web_search": { "search_mode": "normal", "enable": false },
                "type": "web_search"
            }
        ]
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error(`HTTP 错误! 状态码: ${response.status}`);
        }

        // 处理流式响应
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        
        statusText.innerText = '正在回复...';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true
