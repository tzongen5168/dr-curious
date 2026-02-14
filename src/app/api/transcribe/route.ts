/**
 * Whisper STT API Route
 * 接收音訊 blob → 呼叫 OpenAI Whisper → 回傳繁體中文文字
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const audioFile = formData.get('audio') as File;

        if (!audioFile) {
            return NextResponse.json({ error: '未收到音訊檔案' }, { status: 400 });
        }

        // 轉換為 OpenAI 需要的格式
        const whisperFormData = new FormData();
        whisperFormData.append('file', audioFile, 'audio.webm');
        whisperFormData.append('model', 'whisper-1');
        whisperFormData.append('language', 'zh');
        whisperFormData.append('response_format', 'json');

        const response = await fetch(
            'https://api.openai.com/v1/audio/transcriptions',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                },
                body: whisperFormData,
            },
        );

        if (!response.ok) {
            const err = await response.text();
            console.error('Whisper API error:', err);
            return NextResponse.json(
                { error: '語音辨識失敗' },
                { status: response.status },
            );
        }

        const data = await response.json();
        return NextResponse.json({ text: data.text });
    } catch (error) {
        console.error('Transcribe error:', error);
        return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
    }
}
