'use client';

/**
 * 好奇小博士 — 主頁面
 * 整合年齡選擇 → 語音/文字問答的完整流程
 * STT: 瀏覽器 Web Speech API (免費)
 * TTS: 瀏覽器 speechSynthesis (免費)
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import AgeSelector from '@/components/AgeSelector';
import VoiceButton from '@/components/VoiceButton';
import type { VoiceState } from '@/components/VoiceButton';
import ZhuyinText from '@/components/ZhuyinText';
import { getAgeGroup } from '@/lib/prompts';

// Web Speech API 型別宣告
interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: { transcript: string };
      isFinal: boolean;
    };
    length: number;
  };
}

export default function Home() {
  const [age, setAge] = useState<number | null>(null);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [textInput, setTextInput] = useState('');
  const [showInput, setShowInput] = useState(false);
  const recognitionRef = useRef<ReturnType<typeof createRecognition> | null>(
    null,
  );
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 初始化：讀取 localStorage 中的年齡
  useEffect(() => {
    const saved = localStorage.getItem('dr-curious-age');
    if (saved) {
      setAge(parseInt(saved, 10));
    }
  }, []);

  // 自動捲動到底部
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [question, answer, voiceState]);

  // 選擇年齡
  const handleAgeSelect = useCallback((selectedAge: number) => {
    setAge(selectedAge);
    localStorage.setItem('dr-curious-age', selectedAge.toString());
  }, []);

  // 重設年齡
  const handleResetAge = useCallback(() => {
    setAge(null);
    localStorage.removeItem('dr-curious-age');
    setQuestion('');
    setAnswer('');
    setError('');
    setTextInput('');
  }, []);

  // 送出問題（語音或文字共用）
  const submitQuestion = useCallback(
    async (transcript: string) => {
      if (!transcript || transcript.trim().length === 0) {
        setVoiceState('idle');
        setError('沒聽清楚，再說一次好嗎？');
        return;
      }

      setQuestion(transcript);
      setVoiceState('thinking');

      try {
        // Gemini 問答
        const askRes = await fetch('/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: transcript, age }),
        });

        if (!askRes.ok) throw new Error('AI 回答失敗');
        const { answer: answerText } = await askRes.json();
        setAnswer(answerText);

        // 瀏覽器內建語音合成
        setVoiceState('speaking');
        speakText(answerText, age, () => {
          setVoiceState('idle');
        });
      } catch (err) {
        console.error(err);
        setError('發生了一些問題，再試一次吧！');
        setVoiceState('idle');
      }
    },
    [age],
  );

  // 開始錄音 (Web Speech API)
  const handlePressStart = useCallback(() => {
    setError('');
    setQuestion('');
    setAnswer('');

    // 停止正在播放的語音
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const recognition = createRecognition();
    if (!recognition) {
      setError('你的瀏覽器不支援語音辨識，請改用 Chrome 或 Edge 喔！');
      return;
    }

    recognitionRef.current = recognition;
    setVoiceState('recording');

    recognition.start();
  }, []);

  // 停止錄音，處理結果
  const handlePressEnd = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    // 設定結果處理 callback
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      submitQuestion(transcript);
    };

    recognition.onerror = (event: { error: string }) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        setError('沒有偵測到說話聲，再試一次吧！');
      } else if (event.error === 'not-allowed') {
        setError('需要麥克風權限才能使用喔！請在瀏覽器設定中允許。');
      } else {
        setError('語音辨識出了問題，再試一次吧！');
      }
      setVoiceState('idle');
    };

    recognition.onnomatch = () => {
      setError('沒聽清楚，再說一次好嗎？');
      setVoiceState('idle');
    };

    // 停止辨識，等待 onresult callback
    recognition.stop();
    recognitionRef.current = null;
  }, [submitQuestion]);

  // 文字送出
  const handleTextSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = textInput.trim();
      if (!q) return;

      // 停止正在播放的語音
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      setError('');
      setAnswer('');
      setTextInput('');
      submitQuestion(q);
    },
    [textInput, submitQuestion],
  );

  // 追問提示
  const handleFollowUp = useCallback(
    (type: 'repeat' | 'more') => {
      if (type === 'repeat') {
        // 重新朗讀
        if (answer && 'speechSynthesis' in window) {
          setVoiceState('speaking');
          speakText(answer, age, () => {
            setVoiceState('idle');
          });
        }
      } else {
        // 「還想知道更多」— 回到待機讓使用者繼續問
        setVoiceState('idle');
        setQuestion('');
        setAnswer('');
        setError('');
      }
    },
    [answer, age],
  );

  // 年齡選擇畫面
  if (age === null) {
    return (
      <main className="app">
        <AgeSelector onSelect={handleAgeSelect} />
      </main>
    );
  }

  const ageGroup = getAgeGroup(age);
  const canType = age >= 7;
  const isInteracting =
    voiceState === 'thinking' || voiceState === 'speaking';
  const showFollowUp = answer && voiceState === 'idle';

  // 語音問答畫面
  return (
    <main className="app">
      <header className="app-header">
        <h1 className="app-title">好奇小博士</h1>
        <button className="age-badge" onClick={handleResetAge}>
          {age} 歲 ✏️
        </button>
      </header>

      <div className="chat-area">
        {/* 歡迎訊息 */}
        {!question && !answer && !error && (
          <div className="welcome">
            <div className="welcome-emoji">🎓</div>
            <p className="welcome-text">嗨！你今天想問什麼呢？</p>
          </div>
        )}

        {/* 錯誤訊息 */}
        {error && (
          <div className="message message--error">
            <p>{error}</p>
          </div>
        )}

        {/* 孩子的問題 */}
        {question && (
          <div className="message message--question">
            <div className="message-avatar">🧒</div>
            <p>{question}</p>
          </div>
        )}

        {/* 思考中 */}
        {voiceState === 'thinking' && (
          <div className="message message--thinking">
            <div className="message-avatar">🎓</div>
            <div className="thinking-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        {/* 博士的回答 */}
        {answer && (
          <div className="message message--answer">
            <div className="message-avatar">🎓</div>
            <ZhuyinText text={answer} ageGroup={ageGroup} />
          </div>
        )}

        {/* 追問按鈕 */}
        {showFollowUp && (
          <div className="follow-up">
            <button
              className="follow-up-btn"
              onClick={() => handleFollowUp('repeat')}
            >
              🔄 再聽一次
            </button>
            <button
              className="follow-up-btn follow-up-btn--primary"
              onClick={() => handleFollowUp('more')}
            >
              💡 我還想問
            </button>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <div className="voice-area">
        {/* 文字輸入框 (7 歲以上) */}
        {canType && (
          <div className="text-input-area">
            <button
              className="keyboard-toggle"
              onClick={() => setShowInput(!showInput)}
              disabled={isInteracting}
              title="用打字的方式提問"
            >
              ⌨️
            </button>
            {showInput && (
              <form className="text-form" onSubmit={handleTextSubmit}>
                <input
                  type="text"
                  className="text-input"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="用打字的方式問問題..."
                  disabled={isInteracting}
                  autoFocus
                />
                <button
                  type="submit"
                  className="text-submit"
                  disabled={isInteracting || !textInput.trim()}
                >
                  🚀
                </button>
              </form>
            )}
          </div>
        )}

        <VoiceButton
          state={voiceState}
          onPressStart={handlePressStart}
          onPressEnd={handlePressEnd}
        />
      </div>
    </main>
  );
}

/* ========================================================================
   Helper Functions
   ======================================================================== */

/** 建立 Web Speech API 辨識器 */
function createRecognition() {
  const SpeechRecognition =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).SpeechRecognition ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) return null;

  const recognition = new SpeechRecognition();
  recognition.lang = 'zh-TW';
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  return recognition;
}

/** 使用瀏覽器內建 TTS 朗讀文字 */
function speakText(
  text: string,
  age: number | null,
  onEnd?: () => void,
) {
  if (!('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-TW';
  utterance.rate = age && age <= 6 ? 0.8 : 1.0;
  utterance.pitch = 1.1;

  // TTS 播放結束 callback
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();

  // 嘗試找到中文語音
  const voices = window.speechSynthesis.getVoices();
  const zhVoice = voices.find(
    (v) => v.lang === 'zh-TW' || v.lang.startsWith('zh'),
  );
  if (zhVoice) utterance.voice = zhVoice;

  window.speechSynthesis.speak(utterance);
}
