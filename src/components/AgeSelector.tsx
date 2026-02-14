'use client';

/**
 * 年齡選擇元件
 * 首次進入時顯示，選擇後存入 localStorage
 */

interface AgeSelectorProps {
    onSelect: (age: number) => void;
}

const AGE_OPTIONS = [
    { age: 5, label: '5 歲', emoji: '🐣', desc: '幼兒園大班' },
    { age: 6, label: '6 歲', emoji: '🐣', desc: '小學一年級' },
    { age: 7, label: '7 歲', emoji: '🌱', desc: '小學一年級' },
    { age: 8, label: '8 歲', emoji: '🌱', desc: '小學二年級' },
    { age: 9, label: '9 歲', emoji: '🚀', desc: '小學三年級' },
    { age: 10, label: '10 歲', emoji: '🚀', desc: '小學四年級' },
];

export default function AgeSelector({ onSelect }: AgeSelectorProps) {
    return (
        <div className="age-selector">
            <div className="age-selector-character">🎓</div>
            <h1 className="age-selector-title">嗨！我是好奇博士</h1>
            <p className="age-selector-subtitle">你今年幾歲呢？</p>

            <div className="age-grid">
                {AGE_OPTIONS.map((opt) => (
                    <button
                        key={opt.age}
                        className="age-button"
                        onClick={() => onSelect(opt.age)}
                    >
                        <span className="age-emoji">{opt.emoji}</span>
                        <span className="age-label">{opt.label}</span>
                        <span className="age-desc">{opt.desc}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
