/**
 * 好奇小博士 — 瀏覽器錄音模組
 * 封裝 MediaRecorder API，輸出 webm 音訊 Blob
 */

export class AudioRecorder {
    private mediaRecorder: MediaRecorder | null = null;
    private chunks: Blob[] = [];
    private stream: MediaStream | null = null;

    /** 請求麥克風權限並初始化 */
    async init(): Promise<boolean> {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            });
            return true;
        } catch {
            console.error('無法取得麥克風權限');
            return false;
        }
    }

    /** 開始錄音 */
    start(): void {
        if (!this.stream) {
            console.error('請先呼叫 init()');
            return;
        }

        this.chunks = [];

        // 優先使用 webm，fallback 到瀏覽器支援的格式
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : MediaRecorder.isTypeSupported('audio/webm')
                ? 'audio/webm'
                : 'audio/mp4';

        this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });

        this.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                this.chunks.push(e.data);
            }
        };

        this.mediaRecorder.start(100); // 每 100ms 收集一次
    }

    /** 停止錄音，回傳音訊 Blob */
    stop(): Promise<Blob> {
        return new Promise((resolve, reject) => {
            if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
                reject(new Error('錄音尚未開始'));
                return;
            }

            this.mediaRecorder.onstop = () => {
                const blob = new Blob(this.chunks, {
                    type: this.mediaRecorder?.mimeType || 'audio/webm',
                });
                this.chunks = [];
                resolve(blob);
            };

            this.mediaRecorder.stop();
        });
    }

    /** 檢查是否正在錄音 */
    get isRecording(): boolean {
        return this.mediaRecorder?.state === 'recording';
    }

    /** 釋放麥克風資源 */
    destroy(): void {
        if (this.stream) {
            this.stream.getTracks().forEach((track) => track.stop());
            this.stream = null;
        }
        this.mediaRecorder = null;
    }
}
