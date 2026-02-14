
/**
 * 好奇小博士 — 注音標註引擎
 *
 * 將中文文字轉換為帶注音標註的 HTML 結構。
 * 使用 pinyin-pro 解析拼音結構 + 自定義注音映射表 (zhuyinMap)。
 */

import { pinyin } from 'pinyin-pro';
import { pinyinPartsToZhuyin, TONES_MAP } from './zhuyinMap';
import type { AgeGroup } from './prompts';

export interface ZhuyinChar {
    char: string;
    zhuyin: string;
    isHanzi: boolean;
}

/**
 * 常用字 Top 500 (用於 7-8 歲模式過濾)
 * 這裡保留一個基礎清單，用於過濾 "Too Common" 的字
 */
const COMMON_CHARS_STRING =
    '的一是了我不人在他有這個上們來到時大地為子中你說生國年著就那和要她出也得里後自以會家可下而過天去能對小多然於心學之都好看起發當沒成只如事把行最想作開手十用道方又如前日長水幾笑政現二某理本方介理公本';
const COMMON_CHARS = new Set(COMMON_CHARS_STRING.split(''));

/** 判斷是否為漢字 */
function isHanzi(char: string): boolean {
    return /[\u4e00-\u9fa5]/.test(char);
}

/**
 * 將文字轉換為注音標註陣列
 */
export function toZhuyin(text: string): ZhuyinChar[] {
    // 1. Get Initials
    // @ts-ignore
    const initials = pinyin(text, { pattern: 'initial', type: 'array' }) as string[];

    // 2. Get Finals (toneless)
    // @ts-ignore
    const finals = pinyin(text, { pattern: 'final', toneType: 'none', type: 'array' }) as string[];

    // 3. Get Tones
    // @ts-ignore
    const tones = pinyin(text, { pattern: 'num', type: 'array' }) as string[];

    return Array.from(text).map((char, index) => {
        if (isHanzi(char)) {
            const init = initials[index] || '';
            const fin = finals[index] || '';
            const toneNum = tones[index] || '';

            // Convert Pinyin parts to Zhuyin
            const zBody = pinyinPartsToZhuyin(init, fin);
            const zTone = TONES_MAP[toneNum] || ''; // Default to empty if not found

            // Combine: Zhuyin + Tone
            let fullZhuyin = zBody + zTone;

            // Special handling for Neutral Tone (˙)
            // If tone is ˙ (from '0' or '5'), some conventions put it before.
            // But standard Bopomofo font handling often expects it as a combining mark or just a character.
            // Let's stick to appending for now, unless user feedback says otherwise.
            // Actually, standard is usually Top or Before for vertical text.
            // We are using Ruby (horizontal).
            // Let's put it at the end to be safe, like '˙'

            return {
                char,
                zhuyin: fullZhuyin,
                isHanzi: true,
            };
        }
        return { char, zhuyin: '', isHanzi: false };
    });
}

/**
 * 根據年齡組過濾注音標註
 */
export function filterZhuyinByAge(
    chars: ZhuyinChar[],
    ageGroup: AgeGroup,
    showZhuyin: boolean = true,
): ZhuyinChar[] {
    if (!showZhuyin) {
        return chars.map((c) => ({ ...c, zhuyin: '' }));
    }

    switch (ageGroup) {
        case '5-6':
            // 全部標注
            return chars;

        case '7-8':
            // 僅標注非常用字
            return chars.map((c) => ({
                ...c,
                zhuyin: COMMON_CHARS.has(c.char) ? '' : c.zhuyin,
            }));

        case '9-10':
            // 預設不標注
            return chars.map((c) => ({ ...c, zhuyin: '' }));

        default:
            return chars;
    }
}
