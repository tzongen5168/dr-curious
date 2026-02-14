/**
 * AI 問答 API Route
 * 接收問題文字 + 年齡 → 嘗試 Gemini → fallback 到 OpenAI GPT → 回傳分齡回答
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAgeGroup, getSystemPrompt } from '@/lib/prompts';

export async function POST(request: NextRequest) {
    try {
        const { question, age } = await request.json();

        if (!question || !age) {
            return NextResponse.json(
                { error: '缺少問題或年齡' },
                { status: 400 },
            );
        }

        const ageGroup = getAgeGroup(age);
        const systemPrompt = getSystemPrompt(ageGroup);

        // 先嘗試 Gemini，失敗再 fallback 到 OpenAI
        let answer: string | null = null;
        let blocked = false;

        const geminiKey = process.env.GEMINI_API_KEY;
        if (geminiKey) {
            try {
                const result = await callGemini(
                    geminiKey,
                    systemPrompt,
                    question,
                );
                answer = result.answer;
                blocked = result.blocked;
            } catch (err) {
                console.warn('Gemini failed, falling back to OpenAI:', err);
            }
        }

        // Fallback: OpenAI GPT
        if (!answer && !blocked) {
            const openaiKey = process.env.OPENAI_API_KEY;
            if (openaiKey) {
                try {
                    answer = await callOpenAI(
                        openaiKey,
                        systemPrompt,
                        question,
                    );
                } catch (err) {
                    console.error('OpenAI fallback also failed:', err);
                }
            }
        }

        if (!answer && !blocked) {
            return NextResponse.json(
                { error: 'AI 回答失敗，請稍後再試' },
                { status: 503 },
            );
        }

        return NextResponse.json({
            answer: blocked
                ? '這個問題好奇博士沒辦法回答喔，我們來聊聊其他有趣的東西吧！'
                : answer,
            blocked,
            ageGroup,
        });
    } catch (error) {
        console.error('Ask error:', error);
        return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
    }
}

/* ========================================================================
   Gemini API (含 retry)
   ======================================================================== */
async function callGemini(
    apiKey: string,
    systemPrompt: string,
    question: string,
): Promise<{ answer: string; blocked: boolean }> {
    const maxRetries = 2;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        if (attempt > 0) {
            await new Promise((r) => setTimeout(r, 1000 * attempt));
        }

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [
                            { role: 'user', parts: [{ text: question }] },
                        ],
                        systemInstruction: {
                            parts: [{ text: systemPrompt }],
                        },
                        safetySettings: [
                            {
                                category: 'HARM_CATEGORY_HARASSMENT',
                                threshold: 'BLOCK_LOW_AND_ABOVE',
                            },
                            {
                                category: 'HARM_CATEGORY_HATE_SPEECH',
                                threshold: 'BLOCK_LOW_AND_ABOVE',
                            },
                            {
                                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                                threshold: 'BLOCK_LOW_AND_ABOVE',
                            },
                            {
                                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                                threshold: 'BLOCK_LOW_AND_ABOVE',
                            },
                        ],
                        generationConfig: {
                            temperature: 0.7,
                            topP: 0.9,
                            maxOutputTokens: 500,
                        },
                    }),
                },
            );

            if (response.status === 429 && attempt < maxRetries) {
                lastError = new Error('Rate limited (429)');
                continue; // retry
            }

            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.status}`);
            }

            const data = await response.json();
            const answer =
                data.candidates?.[0]?.content?.parts?.[0]?.text ||
                '抱歉，好奇博士現在想不到答案，你可以換個問題試試看！';
            const blocked =
                data.candidates?.[0]?.finishReason === 'SAFETY';

            return { answer, blocked };
        } catch (err) {
            lastError =
                err instanceof Error ? err : new Error(String(err));
        }
    }

    throw lastError || new Error('Gemini failed after retries');
}

/* ========================================================================
   OpenAI GPT Fallback
   ======================================================================== */
async function callOpenAI(
    apiKey: string,
    systemPrompt: string,
    question: string,
): Promise<string> {
    const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: question },
                ],
                temperature: 0.7,
                max_tokens: 500,
            }),
        },
    );

    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return (
        data.choices?.[0]?.message?.content ||
        '抱歉，好奇博士現在想不到答案，你可以換個問題試試看！'
    );
}
