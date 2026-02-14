'use client';

/**
 * 注音文字元件
 * 以 Ruby text 方式顯示漢字上方的注音符號
 */
import { useMemo } from 'react';
import { toZhuyin, filterZhuyinByAge } from '@/lib/zhuyin';
import type { AgeGroup } from '@/lib/prompts';

interface ZhuyinTextProps {
    text: string;
    ageGroup: AgeGroup;
    showZhuyin?: boolean;
}

export default function ZhuyinText({
    text,
    ageGroup,
    showZhuyin = true,
}: ZhuyinTextProps) {
    const chars = useMemo(() => {
        const raw = toZhuyin(text);
        return filterZhuyinByAge(raw, ageGroup, showZhuyin);
    }, [text, ageGroup, showZhuyin]);

    return (
        <p className="zhuyin-text" data-age={ageGroup}>
            {chars.map((c, i) =>
                c.isHanzi && c.zhuyin ? (
                    <ruby key={i}>
                        {c.char}
                        <rp>(</rp>
                        <rt>{c.zhuyin}</rt>
                        <rp>)</rp>
                    </ruby>
                ) : (
                    <span key={i}>{c.char}</span>
                ),
            )}
        </p>
    );
}
