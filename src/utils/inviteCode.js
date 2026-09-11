/**
 * 邀请码提取与清洗工具
 *
 * 背景:邀请链接为 hash 路由形式 /#/register?code=XXXX
 * 直接用 URLSearchParams(hash.replace('#','?')) 解析会把 key 解析成
 * "/register?code",导致取不到 code 而落到兜底正则,拿到的是未解码的原始串
 * (例如结尾被粘上顿号时会显示成 XRIGcmzi%E3%80%81)。
 */

// 邀请码允许的字符集:字母、数字、下划线、短横线
const INVITE_CODE_ALLOWED = /[^A-Za-z0-9_-]/g;

/**
 * 清洗邀请码:解码 -> 去空白 -> 去掉非法字符(中文顿号、逗号、引号等)
 * @param {string} raw 原始邀请码(可能是 URL 编码的)
 * @returns {string} 干净的邀请码
 */
export function sanitizeInviteCode(raw) {
  if (!raw || typeof raw !== 'string') return '';

  let value = raw;

  // 可能存在多重编码(%25E3%2580%2581),最多解码 3 次
  for (let i = 0; i < 3; i++) {
    if (!/%[0-9A-Fa-f]{2}/.test(value)) break;
    try {
      const decoded = decodeURIComponent(value);
      if (decoded === value) break;
      value = decoded;
    } catch (e) {
      break;
    }
  }

  return value.trim().replace(INVITE_CODE_ALLOWED, '');
}

/**
 * 从当前 URL 中提取邀请码,兼容以下形式:
 *   /register?code=XXX
 *   /#/register?code=XXX
 *   /?code=XXX#/register
 * @param {string} [href] 默认取 window.location.href
 * @returns {string} 清洗后的邀请码,取不到返回 ''
 */
export function extractInviteCodeFromUrl(href) {
  const url = href || (typeof window !== 'undefined' ? window.location.href : '');
  if (!url) return '';

  // 依次尝试 search 段与 hash 段中的 query
  const candidates = [];

  const queryIndex = url.indexOf('?');
  if (queryIndex !== -1) {
    // 收集所有 ? 之后的片段(hash 里也可能带 ?)
    url.slice(queryIndex).split('#').forEach((part) => {
      const qIndex = part.indexOf('?');
      candidates.push(qIndex === -1 ? part : part.slice(qIndex + 1));
    });
  }

  for (const candidate of candidates) {
    const params = new URLSearchParams(candidate.replace(/^\?/, ''));
    const value = params.get('code');
    if (value) {
      const cleaned = sanitizeInviteCode(value);
      if (cleaned) return cleaned;
    }
  }

  // 最后兜底:正则直接抓
  const match = url.match(/[?&]code=([^&#]+)/);
  return match ? sanitizeInviteCode(match[1]) : '';
}
