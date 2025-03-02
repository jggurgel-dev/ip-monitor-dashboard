const express = require('express');
const ping = require('ping');
const axios = require('axios'); 
const app = express();
const PORT = 3000;

const TELEGRAM_BOT_TOKEN = 'SEU_TOKEN'; 
const TELEGRAM_CHAT_ID = 'SEU_CHAT_ID'; 

const ipList = Array.from({ length: 4 }, (_, i) => `192.168.1.${i + 1}`);

const cache = {};
const CACHE_DURATION = 5000; 
const previousStatus = {};

const ipDescriptions = {
    "192.168.1.1": "SERVER 01",
    "192.168.1.2": "SERVER 02",
    "192.168.1.3": "SERVER 03",
    "192.168.1.4": "SERVER 04",

};

async function checkIPStatusWithLimit(ipList, limit = 10) {
    const results = [];
    const executing = [];

    for (const ip of ipList) {
        const promise = ping.promise.probe(ip, { timeout: 2 }) 
            .then(res => ({ ip, status: res.alive ? 'online' : 'offline' }))
            .catch(() => ({ ip, status: 'offline' })) 
            .finally(() => executing.splice(executing.indexOf(promise), 1));

        results.push(promise);
        executing.push(promise);

        
        if (executing.length >= limit) {
            await Promise.race(executing);
        }
    }

    return Promise.all(results);
}

async function sendTelegramMessage(ip, status) {
    const description = ipDescriptions[ip] || ip;
    const message = `⚠️ Alerta de Status!\nLoja: ${description}\nIP: ${ip}\nStatus: ${status === 'online' ? '✅ ONLINE' : '❌ OFFLINE'}`;

    try {
        await axios.post(`https:
            chat_id: TELEGRAM_CHAT_ID,
            text: message
        });
    } catch (error) {
        console.error(`Falha ao enviar notificação via Telegram para IP ${ip}:`, error.message);
    }
}

app.get('/api/ip-status', async (req, res) => {
    const now = Date.now();

    
    if (cache.data && now - cache.timestamp < CACHE_DURATION) {
        return res.json(cache.data);
    }

    try {
        
        const results = await checkIPStatusWithLimit(ipList, 10); 
        const onlineCount = results.filter(r => r.status === 'online').length;
        const offlineCount = results.filter(r => r.status === 'offline').length;

        
        const data = {
            totalOnline: onlineCount,
            totalOffline: offlineCount,
            ipStatus: results
        };

        cache.data = data;
        cache.timestamp = now;

        
        results.forEach(({ ip, status }) => {
            if (previousStatus[ip] !== status) {
                if (status === 'online' && previousStatus[ip] === 'offline') {
                    sendTelegramMessage(ip, status); 
                } else if (status === 'offline' && previousStatus[ip] !== 'offline') {
                    sendTelegramMessage(ip, status); 
                }
                previousStatus[ip] = status; 
            }
        });

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.use(express.static('public'));

app.listen(PORT, () => {
    console.log(`Servidor iniciado em http:
});