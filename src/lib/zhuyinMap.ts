
/**
 * 拼音 -> 注音 映射表
 */

export const INITIALS_MAP: Record<string, string> = {
    b: 'ㄅ', p: 'ㄆ', m: 'ㄇ', f: 'ㄈ',
    d: 'ㄉ', t: 'ㄊ', n: 'ㄋ', l: 'ㄌ',
    g: 'ㄍ', k: 'ㄎ', h: 'ㄏ',
    j: 'ㄐ', q: 'ㄑ', x: 'ㄒ',
    zh: 'ㄓ', ch: 'ㄔ', sh: 'ㄕ', r: 'ㄖ',
    z: 'ㄗ', c: 'ㄘ', s: 'ㄙ',
    // y, w are handled specially in logic
};

export const FINALS_MAP: Record<string, string> = {
    a: 'ㄚ', o: 'ㄛ', e: 'ㄜ', ê: 'ㄝ',
    ai: 'ㄞ', ei: 'ㄟ', ao: 'ㄠ', ou: 'ㄡ',
    an: 'ㄢ', en: 'ㄣ', ang: 'ㄤ', eng: 'ㄥ',
    er: 'ㄦ',
    i: 'ㄧ', u: 'ㄨ', ü: 'ㄩ',
    ia: 'ㄧㄚ', io: 'ㄧㄛ', ie: 'ㄧㄝ', iai: 'ㄧㄞ', iao: 'ㄧㄠ', iou: 'ㄧㄡ', ian: 'ㄧㄢ', in: 'ㄧㄣ', iang: 'ㄧㄤ', ing: 'ㄧㄥ',
    ua: 'ㄨㄚ', uo: 'ㄨㄛ', uai: 'ㄨㄞ', uei: 'ㄨㄟ', uan: 'ㄨㄢ', uen: 'ㄨㄣ', uang: 'ㄨㄤ', ueng: 'ㄨㄥ',
    ue: 'ㄩㄝ', üe: 'ㄩㄝ',
    üan: 'ㄩㄢ', // y + uan -> üan
    ün: 'ㄩㄣ',
    iong: 'ㄩㄥ',
    ong: 'ㄨㄥ',
};

export const TONES_MAP: Record<string, string> = {
    '1': '',
    '2': 'ˊ',
    '3': 'ˇ',
    '4': 'ˋ',
    '0': '˙',
    '5': '˙',
};

const Z_CS_INITIALS = new Set(['zh', 'ch', 'sh', 'r', 'z', 'c', 's']);

/**
 * Convert Pinyin parts (Initial, Final) to Zhuyin
 */
export function pinyinPartsToZhuyin(initial: string, final: string): string {
    let zInitial = '';
    let keyFinal = final;

    // Handle Initial
    if (initial) {
        if (initial === 'y') {
            // y handling
            if (final === 'u') keyFinal = 'ü';
            else if (final === 'ue') keyFinal = 'üe';
            else if (final === 'uan') keyFinal = 'üan';
            else if (final === 'un') keyFinal = 'ün';
            else if (final === 'ong') keyFinal = 'iong';
            else if (['i', 'in', 'ing'].includes(final)) {
                // yi -> i, yin -> in, ying -> ing
                keyFinal = final;
            } else {
                // ya -> ia, yan -> ian, etc.
                keyFinal = 'i' + final;
            }
            // y is consumed (becomes part of final or ignored)
            zInitial = '';
        } else if (initial === 'w') {
            // w handling
            if (final === 'u') {
                keyFinal = 'u';
            } else {
                // wa -> ua, wo -> uo
                keyFinal = 'u' + final;
            }
            // w is consumed
            zInitial = '';
        } else {
            zInitial = INITIALS_MAP[initial] || initial;
        }
    }

    // Handle Final
    let zFinal = '';
    if (keyFinal) {
        if (Z_CS_INITIALS.has(initial) && keyFinal === 'i') {
            // zhi, chi, shi, ri, zi, ci, si -> ignore i
            zFinal = ''; // Just Initial
        } else {
            zFinal = FINALS_MAP[keyFinal] || keyFinal;
        }
    }

    return zInitial + zFinal;
}
