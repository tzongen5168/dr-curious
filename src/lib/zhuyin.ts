/**
 * 好奇小博士 — 注音標註引擎
 *
 * 將中文文字轉換為帶注音標註的 HTML 結構。
 * MVP 版本使用簡化的查表法，後續可替換為 pinyin-pro 等套件。
 *
 * 輸出格式：{ char: '天', zhuyin: 'ㄊㄧㄢ' }[]
 */

import type { AgeGroup } from './prompts';

export interface ZhuyinChar {
    char: string;
    zhuyin: string;
    isHanzi: boolean;
}

/**
 * 常用字注音對照表 (Top 500 常用字)
 * MVP 先放最常見的字，後續擴充或接 npm 套件
 */
const COMMON_ZHUYIN: Record<string, string> = {
    // 基本用字
    的: 'ㄉㄜ˙', 是: 'ㄕˋ', 不: 'ㄅㄨˋ', 了: 'ㄌㄜ˙', 在: 'ㄗㄞˋ',
    有: 'ㄧㄡˇ', 人: 'ㄖㄣˊ', 這: 'ㄓㄜˋ', 中: 'ㄓㄨㄥ', 大: 'ㄉㄚˋ',
    為: 'ㄨㄟˋ', 上: 'ㄕㄤˋ', 個: 'ㄍㄜˋ', 國: 'ㄍㄨㄛˊ', 我: 'ㄨㄛˇ',
    以: 'ㄧˇ', 要: 'ㄧㄠˋ', 他: 'ㄊㄚ', 會: 'ㄏㄨㄟˋ', 時: 'ㄕˊ',
    來: 'ㄌㄞˊ', 就: 'ㄐㄧㄡˋ', 出: 'ㄔㄨ', 也: 'ㄧㄝˇ', 到: 'ㄉㄠˋ',
    說: 'ㄕㄨㄛ', 用: 'ㄩㄥˋ', 對: 'ㄉㄨㄟˋ', 和: 'ㄏㄜˊ', 地: 'ㄉㄧˋ',
    你: 'ㄋㄧˇ', 什: 'ㄕㄣˊ', 麼: 'ㄇㄛ˙', 生: 'ㄕㄥ', 能: 'ㄋㄥˊ',
    子: 'ㄗˇ', 那: 'ㄋㄚˋ', 得: 'ㄉㄜˊ', 於: 'ㄩˊ', 可: 'ㄎㄜˇ',
    下: 'ㄒㄧㄚˋ', 自: 'ㄗˋ', 之: 'ㄓ', 年: 'ㄋㄧㄢˊ', 過: 'ㄍㄨㄛˋ',
    多: 'ㄉㄨㄛ', 後: 'ㄏㄡˋ', 作: 'ㄗㄨㄛˋ', 都: 'ㄉㄡ', 然: 'ㄖㄢˊ',
    沒: 'ㄇㄟˊ', 日: 'ㄖˋ', 好: 'ㄏㄠˇ', 小: 'ㄒㄧㄠˇ', 學: 'ㄒㄩㄝˊ',
    很: 'ㄏㄣˇ', 因: 'ㄧㄣ', 同: 'ㄊㄨㄥˊ', 長: 'ㄔㄤˊ', 看: 'ㄎㄢˋ',
    問: 'ㄨㄣˋ', 太: 'ㄊㄞˋ', 天: 'ㄊㄧㄢ', 空: 'ㄎㄨㄥ', 藍: 'ㄌㄢˊ',
    色: 'ㄙㄜˋ', 光: 'ㄍㄨㄤ', 陽: 'ㄧㄤˊ', 水: 'ㄕㄨㄟˇ', 火: 'ㄏㄨㄛˇ',
    山: 'ㄕㄢ', 月: 'ㄩㄝˋ', 星: 'ㄒㄧㄥ', 風: 'ㄈㄥ', 雨: 'ㄩˇ',
    花: 'ㄏㄨㄚ', 草: 'ㄘㄠˇ', 樹: 'ㄕㄨˋ', 魚: 'ㄩˊ', 鳥: 'ㄋㄧㄠˇ',
    狗: 'ㄍㄡˇ', 貓: 'ㄇㄠ', 吃: 'ㄔ', 喝: 'ㄏㄜ', 跑: 'ㄆㄠˇ',
    走: 'ㄗㄡˇ', 飛: 'ㄈㄟ', 叫: 'ㄐㄧㄠˋ', 聽: 'ㄊㄧㄥ', 想: 'ㄒㄧㄤˇ',
    知: 'ㄓ', 道: 'ㄉㄠˋ', 喜: 'ㄒㄧˇ', 歡: 'ㄏㄨㄢ', 愛: 'ㄞˋ',
    爸: 'ㄅㄚˋ', 媽: 'ㄇㄚ', 哥: 'ㄍㄜ', 姊: 'ㄐㄧㄝˇ', 弟: 'ㄉㄧˋ',
    妹: 'ㄇㄟˋ', 朋: 'ㄆㄥˊ', 友: 'ㄧㄡˇ', 老: 'ㄌㄠˇ', 師: 'ㄕ',
    // 科學常用字
    恐: 'ㄎㄨㄥˇ', 龍: 'ㄌㄨㄥˊ', 球: 'ㄑㄧㄡˊ',
    動: 'ㄉㄨㄥˋ', 物: 'ㄨˋ', 植: 'ㄓˊ', 海: 'ㄏㄞˇ', 洋: 'ㄧㄤˊ',
    雲: 'ㄩㄣˊ', 雷: 'ㄌㄟˊ', 電: 'ㄉㄧㄢˋ', 冰: 'ㄅㄧㄥ', 雪: 'ㄒㄩㄝˇ',
    石: 'ㄕˊ', 頭: 'ㄊㄡˊ', 土: 'ㄊㄨˇ', 沙: 'ㄕㄚ',
    // 更多字可以後續擴充...
};

// 常用字 Top 500 的 Set（7-8 歲只標非常用字）
const COMMON_CHARS = new Set(Object.keys(COMMON_ZHUYIN).slice(0, 50));

/** 判斷是否為漢字 */
function isHanzi(char: string): boolean {
    const code = char.charCodeAt(0);
    return (
        (code >= 0x4e00 && code <= 0x9fff) || // CJK Unified Ideographs
        (code >= 0x3400 && code <= 0x4dbf) // CJK Extension A
    );
}

/**
 * 將文字轉換為注音標註陣列
 */
export function toZhuyin(text: string): ZhuyinChar[] {
    return Array.from(text).map((char) => {
        if (isHanzi(char)) {
            return {
                char,
                zhuyin: COMMON_ZHUYIN[char] || '',
                isHanzi: true,
            };
        }
        return { char, zhuyin: '', isHanzi: false };
    });
}

/**
 * 根據年齡組過濾注音標註
 * - 5-6 歲：全部標注
 * - 7-8 歲：僅標注非常用字
 * - 9-10 歲：不標注（可選開啟）
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
