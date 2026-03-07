// Netlify serverless function: OpenAI proxy for المعلمة الذكية
// Set OPENAI_API_KEY in Netlify: Site settings > Environment variables

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8'
};

exports.handler = async (event, context) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers: corsHeaders, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    const key = process.env.OPENAI_API_KEY;
    if (!key || !key.trim()) {
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'OPENAI_API_KEY not set in Netlify environment' })
        };
    }

    let body;
    try {
        body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
    } catch {
        return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Invalid JSON body' })
        };
    }

    const query = (body.message || body.query || body.prompt || body.chatInput || '').trim();
    if (!query) {
        return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Missing message or query' })
        };
    }

    const model = (body.model || process.env.OPENAI_MODEL || 'gpt-4o-mini').trim() || 'gpt-4o-mini';

    try {
        const res = await fetch(OPENAI_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({
                model,
                messages: [
                    {
                        role: 'system',
                        content: 'أنت المعلمة الذكية ريم مشاري، متخصصة في مكتبات ومعلومات والبحث العلمي ومشروع التخرج. أجب بالعربية بشكل تعليمي وواضح ومفيد. قدم إجابة مباشرة ثم توصيات مختصرة إن أمكن.'
                    },
                    { role: 'user', content: query }
                ],
                max_tokens: 1024,
                temperature: 0.7
            })
        });

        const data = await res.json();

        if (!res.ok) {
            const errMsg = data.error?.message || `HTTP ${res.status}`;
            return {
                statusCode: res.status,
                headers: corsHeaders,
                body: JSON.stringify({ error: errMsg })
            };
        }

        const content = data.choices?.[0]?.message?.content?.trim() || '';
        if (!content) {
            return {
                statusCode: 502,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Empty response from OpenAI' })
            };
        }

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                answer: content,
                recommendations: [],
                model: data.model || model
            })
        };
    } catch (err) {
        return {
            statusCode: 502,
            headers: corsHeaders,
            body: JSON.stringify({ error: err.message || 'OpenAI request failed' })
        };
    }
};
