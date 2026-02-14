/**
 * Azure TTS API Route
 * 接收回答文字 → 呼叫 Azure Speech Service → 回傳 MP3 音訊
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { text, speed } = await request.json();

        if (!text) {
            return NextResponse.json({ error: '缺少文字' }, { status: 400 });
        }

        const speechKey = process.env.AZURE_SPEECH_KEY;
        const speechRegion = process.env.AZURE_SPEECH_REGION;

        if (!speechKey || !speechRegion) {
            return NextResponse.json(
                { error: 'Azure Speech 未設定' },
                { status: 500 },
            );
        }

        // 使用 SSML 控制語速和語氣
        const rate = speed === 'slow' ? '-20%' : '+0%';
        const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-TW">
        <voice name="zh-TW-HsiaoChenNeural">
          <prosody rate="${rate}" pitch="+5%">
            ${escapeXml(text)}
          </prosody>
        </voice>
      </speak>
    `.trim();

        const response = await fetch(
            `https://${speechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`,
            {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': speechKey,
                    'Content-Type': 'application/ssml+xml',
                    'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
                },
                body: ssml,
            },
        );

        if (!response.ok) {
            const err = await response.text();
            console.error('Azure TTS error:', err);
            return NextResponse.json(
                { error: '語音合成失敗' },
                { status: response.status },
            );
        }

        const audioBuffer = await response.arrayBuffer();

        return new NextResponse(audioBuffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': audioBuffer.byteLength.toString(),
            },
        });
    } catch (error) {
        console.error('TTS error:', error);
        return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
    }
}

/** 轉義 XML 特殊字元 */
function escapeXml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
