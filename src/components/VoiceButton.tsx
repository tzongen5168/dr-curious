'use client';

/**
 * 語音大按鈕元件
 * 長按開始錄音 / 放開停止錄音
 * 含脈動動畫與狀態指示
 */
import { useCallback, useRef } from 'react';

export type VoiceState = 'idle' | 'recording' | 'thinking' | 'speaking';

interface VoiceButtonProps {
    state: VoiceState;
    onPressStart: () => void;
    onPressEnd: () => void;
}

const STATE_CONFIG: Record<
    VoiceState,
    { label: string; emoji: string; hint: string }
> = {
    idle: { label: '按住我 說話', emoji: '🎤', hint: '長按按鈕，問好奇博士任何問題！' },
    recording: { label: '博士在聽...', emoji: '👂', hint: '放開按鈕就會開始回答喔～' },
    thinking: { label: '讓我想想...', emoji: '🤔', hint: '好奇博士正在思考你的問題' },
    speaking: { label: '博士回答中', emoji: '💬', hint: '正在回答你的問題...' },
};

export default function VoiceButton({
    state,
    onPressStart,
    onPressEnd,
}: VoiceButtonProps) {
    const config = STATE_CONFIG[state];
    const pressTimer = useRef<NodeJS.Timeout | null>(null);
    const isPressed = useRef(false);

    const handleStart = useCallback(() => {
        if (state !== 'idle') return;
        isPressed.current = true;

        // 延遲 200ms 才觸發，防止誤觸
        pressTimer.current = setTimeout(() => {
            if (isPressed.current) {
                onPressStart();
            }
        }, 200);
    }, [state, onPressStart]);

    const handleEnd = useCallback(() => {
        isPressed.current = false;
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }
        if (state === 'recording') {
            onPressEnd();
        }
    }, [state, onPressEnd]);

    const isDisabled = state === 'thinking' || state === 'speaking';

    return (
        <div className="voice-button-container">
            <button
                className={`voice-button voice-button--${state}`}
                onMouseDown={handleStart}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={handleStart}
                onTouchEnd={handleEnd}
                onTouchCancel={handleEnd}
                disabled={isDisabled}
                aria-label={config.label}
            >
                <span className="voice-button-emoji">{config.emoji}</span>
                <span className="voice-button-label">{config.label}</span>
            </button>
            <p className="voice-hint">{config.hint}</p>
        </div>
    );
}
