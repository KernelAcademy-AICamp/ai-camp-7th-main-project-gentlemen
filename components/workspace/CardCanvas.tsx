import type { CardLayout, CardPage } from "@/lib/workspace/types";

// 카드뉴스 1장을 1080×1080(또는 3:4 1080×1440) 정사각형으로 렌더. 미리보기/PNG 내보내기 공용.
// 부모가 transform: scale 로 축소해 보여준다.
// 템플릿 6종(표지·리스트·비교·인용·강조·CTA) + 공통 태그(숫자→번호뱃지 / 글자→칩).
// 화이트·블랙(mono) 테마는 태그를 핑크 대신 글자색으로.

const BRAND = "#e52364"; // 태그 기본 액센트(브랜드 핑크). mono 테마에선 글자색으로 대체.

export interface CardTheme {
  key: string;
  name: string;
  bg: string;
  fg: string;
  sub: string;
  accent: string;
  chip: string;
  chipFg: string;
  mono?: boolean; // 화이트·블랙 — 태그 색을 글자색(fg)으로
}

// 카드 테마 프리셋(제품 콘텐츠). 화이트·블랙(mono)을 앞에 두되 기존 key/순서는 유지 → 기존 카드 호환.
export const THEMES: CardTheme[] = [
  { key: "white", name: "화이트", bg: "#ffffff", fg: "#191f28", sub: "#6b7684", accent: "#e52364", chip: "#191f28", chipFg: "#ffffff", mono: true },
  { key: "black", name: "블랙", bg: "#17171c", fg: "#f4f5f7", sub: "#a7adba", accent: "#ff5c93", chip: "#f4f5f7", chipFg: "#17171c", mono: true },
  { key: "cream", name: "크림", bg: "#f6f3ec", fg: "#1b1a17", sub: "#6f6a5e", accent: "#ef5a35", chip: "#1b1a17", chipFg: "#f6f3ec" },
  { key: "ink", name: "잉크", bg: "#1b1a17", fg: "#f6f3ec", sub: "#b6b1a4", accent: "#ef8a35", chip: "#ef5a35", chipFg: "#ffffff" },
  { key: "coral", name: "코랄", bg: "#ef5a35", fg: "#fff7f3", sub: "#ffd9cb", accent: "#1b1a17", chip: "#1b1a17", chipFg: "#fff7f3" },
  { key: "teal", name: "딥그린", bg: "#1f6f63", fg: "#f2f8f5", sub: "#bcd9d0", accent: "#f3c14b", chip: "#f3c14b", chipFg: "#143f38" },
  { key: "sand", name: "샌드", bg: "#e9ddc7", fg: "#3a2f1d", sub: "#8a7a5c", accent: "#b23a6b", chip: "#3a2f1d", chipFg: "#e9ddc7" },
];

export function getTheme(key: string): CardTheme {
  return THEMES.find((t) => t.key === key) ?? THEMES[0]!;
}

// 카드 본문/제목 공통 폰트 — 고딕체(산세리프)
const GOTHIC = '"Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", ui-sans-serif, system-ui, sans-serif';

// hex(#rgb/#rrggbb) → rgba 문자열 (틴트용, 3자리도 허용)
function tint(hex: string, a: number): string {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex ?? "");
  if (!m) return `rgba(120,120,120,${a})`;
  let h = m[1]!;
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

// ── 레이아웃 추론·구조 파생 (구조 필드가 비었으면 body에서 만들어 낸다 → 옛 카드도 렌더됨) ──
function inferLayout(index: number, total: number): CardLayout {
  if (index === 0) return "cover";
  if (index === total - 1) return "cta";
  return "list";
}
function isNumericTag(tag: string): boolean {
  return /^\d{1,2}$/.test(tag.trim());
}
function listItems(page: CardPage): string[] {
  if (page.items?.length) return page.items;
  return (page.body || "")
    .split(/\n+/)
    .map((s) => s.replace(/^[-•·▪️◦\d.)\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 5);
}
function comparePair(page: CardPage): { leftLabel: string; left: string; rightLabel: string; right: string } {
  if (page.compare) return { leftLabel: page.compare.leftLabel ?? "", left: page.compare.left, rightLabel: page.compare.rightLabel ?? "", right: page.compare.right };
  const parts = (page.body || "").split(/\s*(?:↔|→|—|vs\.?|\||\/|\n)\s*/i).map((s) => s.trim()).filter(Boolean);
  return { leftLabel: "", left: parts[0] ?? "", rightLabel: "", right: parts[1] ?? "" };
}
function bigNum(page: CardPage): string {
  if (page.bigNumber) return page.bigNumber.trim();
  const m = (page.headline || "").match(/[\d][\d,.]*\s*[%+]?/);
  return m ? m[0].trim() : "";
}

// 태그(헤드라인 위): 숫자면 번호뱃지, 글자면 칩. mono 테마는 글자색.
function TagEl({ tag, t, onDark = false }: { tag: string; t: CardTheme; onDark?: boolean }) {
  const color = onDark ? "#ffffff" : t.mono ? t.fg : BRAND;
  const contrast = onDark ? t.fg : t.bg;
  if (isNumericTag(tag)) {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 72, height: 72, padding: "0 20px", borderRadius: 20, background: color, color: contrast, fontSize: 38, fontWeight: 800, letterSpacing: -1, lineHeight: 1 }}>
        {tag.trim().padStart(2, "0")}
      </div>
    );
  }
  return (
    <div style={{ display: "inline-flex", alignItems: "center", height: 60, padding: "0 26px", borderRadius: 999, border: `3px solid ${color}`, color, fontSize: 30, fontWeight: 700, lineHeight: 1, whiteSpace: "nowrap" }}>
      {tag}
    </div>
  );
}

function Handle({ t, handle }: { t: CardTheme; handle: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
      <div style={{ fontSize: 30, fontWeight: 700, color: t.fg, letterSpacing: -0.5 }}>@{handle || "myaccount"}</div>
    </div>
  );
}

// 사진/플레이스홀더 비주얼(반반 상단용)
function Visual({ t, photoDataUrl, note }: { t: CardTheme; photoDataUrl?: string; note?: string }) {
  if (photoDataUrl) {
    return (
      <div style={{ flex: 1, borderRadius: 28, overflow: "hidden", display: "flex" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoDataUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
    );
  }
  return (
    <div style={{ flex: 1, borderRadius: 28, background: `linear-gradient(135deg, ${tint(t.sub, 0.16)}, ${tint(t.sub, 0.05)})`, border: `2px solid ${tint(t.sub, 0.22)}`, display: "grid", placeItems: "center", padding: 56, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, borderRadius: 999, background: tint(t.sub, 0.1) }} />
      <span style={{ position: "relative", fontSize: 34, fontWeight: 600, color: t.sub, textAlign: "center", wordBreak: "keep-all" }}>{note || "사진을 올리면 여기에 표시돼요"}</span>
    </div>
  );
}

export function CardCanvas({
  page,
  index,
  total,
  themeKey,
  handle,
  photo = false,
  photoDataUrl,
  photoStyle = "top",
  ratio = "1:1",
}: {
  page: CardPage;
  index: number;
  total: number;
  themeKey: string;
  niche: string;
  handle: string;
  brandColor?: string;
  photo?: boolean;
  photoDataUrl?: string;
  photoStyle?: "top" | "bg";
  ratio?: "1:1" | "3:4";
}) {
  const t = getTheme(themeKey);
  const layout = page.layout ?? inferLayout(index, total);
  const tag = page.tag?.trim() || "";
  const hasPhoto = Boolean(photoDataUrl);
  const showVisual = hasPhoto || photo;
  const W = 1080;
  const H = ratio === "3:4" ? 1440 : 1080;

  const outer: React.CSSProperties = {
    width: W,
    height: H,
    background: t.bg,
    color: t.fg,
    fontFamily: GOTHIC,
    position: "relative",
    overflow: "hidden",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
  };

  // ── 미디어 모드 2: 배경 풀블리드 + DIM(배경+DIM). 레이아웃 무관, 텍스트는 하단 오버레이 ──
  if (photoStyle === "bg" && photoDataUrl) {
    const big = layout === "emphasis" ? bigNum(page) : "";
    return (
      <div style={{ ...outer, background: "#111" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoDataUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.42) 45%, rgba(0,0,0,0.80) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, padding: 72, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>{tag && <TagEl tag={tag} t={t} onDark />}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {big && <div style={{ fontSize: 200, fontWeight: 800, lineHeight: 0.95, color: "#fff", letterSpacing: -4, textShadow: "0 2px 30px rgba(0,0,0,0.5)" }}>{big}</div>}
            <div style={{ fontSize: index === 0 ? 88 : 68, lineHeight: 1.18, fontWeight: 800, color: "#fff", wordBreak: "keep-all", whiteSpace: "pre-wrap", textShadow: "0 2px 24px rgba(0,0,0,0.45)" }}>{page.headline}</div>
            {page.body && !big && <div style={{ fontSize: 40, lineHeight: 1.5, color: "rgba(255,255,255,0.92)", whiteSpace: "pre-wrap", wordBreak: "keep-all", textShadow: "0 2px 18px rgba(0,0,0,0.45)" }}>{page.body}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ fontSize: 30, fontWeight: 700, color: "rgba(255,255,255,0.92)", letterSpacing: -0.5 }}>@{handle || "myaccount"}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const PAD = 72;
  const tagRow = tag ? <div style={{ marginBottom: 8 }}><TagEl tag={tag} t={t} /></div> : null;

  // ── 레이아웃별 렌더 ──
  if (layout === "list") {
    const items = listItems(page);
    return (
      <div style={{ ...outer, padding: PAD, gap: 40 }}>
        <div>
          {tagRow}
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.18, color: t.fg, wordBreak: "keep-all", whiteSpace: "pre-wrap", marginTop: tag ? 20 : 0 }}>{page.headline}</div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 28 }}>
          {items.map((it, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 24 }}>
              <div style={{ flexShrink: 0, width: 56, height: 56, borderRadius: 16, background: t.mono ? tint(t.fg, 0.08) : tint(BRAND, 0.14), color: t.mono ? t.fg : BRAND, display: "grid", placeItems: "center", fontSize: 30, fontWeight: 800, marginTop: 2 }}>{i + 1}</div>
              <div style={{ fontSize: 42, lineHeight: 1.45, fontWeight: 500, color: t.fg, wordBreak: "keep-all" }}>{it}</div>
            </div>
          ))}
        </div>
        <Handle t={t} handle={handle} />
      </div>
    );
  }

  if (layout === "compare") {
    const c = comparePair(page);
    const Col = ({ label, text, accent }: { label: string; text: string; accent: boolean }) => (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20, padding: 40, borderRadius: 28, background: accent ? (t.mono ? tint(t.fg, 0.06) : tint(BRAND, 0.1)) : tint(t.sub, 0.08), border: `2px solid ${accent ? (t.mono ? tint(t.fg, 0.18) : tint(BRAND, 0.3)) : tint(t.sub, 0.16)}` }}>
        {label && <div style={{ fontSize: 30, fontWeight: 800, color: accent ? (t.mono ? t.fg : BRAND) : t.sub }}>{label}</div>}
        <div style={{ fontSize: 40, lineHeight: 1.4, fontWeight: 600, color: t.fg, wordBreak: "keep-all" }}>{text}</div>
      </div>
    );
    return (
      <div style={{ ...outer, padding: PAD, gap: 44 }}>
        <div>
          {tagRow}
          <div style={{ fontSize: 62, fontWeight: 800, lineHeight: 1.18, color: t.fg, wordBreak: "keep-all", whiteSpace: "pre-wrap", marginTop: tag ? 20 : 0 }}>{page.headline}</div>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "stretch", gap: 24 }}>
          <Col label={c.leftLabel || "A"} text={c.left} accent={false} />
          <div style={{ display: "grid", placeItems: "center", width: 72, flexShrink: 0, fontSize: 40, fontWeight: 800, color: t.sub }}>VS</div>
          <Col label={c.rightLabel || "B"} text={c.right} accent />
        </div>
        <Handle t={t} handle={handle} />
      </div>
    );
  }

  if (layout === "quote") {
    return (
      <div style={{ ...outer, padding: PAD, justifyContent: "center", gap: 32 }}>
        {tag && <div>{<TagEl tag={tag} t={t} />}</div>}
        <div style={{ fontSize: 220, lineHeight: 0.7, fontWeight: 800, color: t.mono ? tint(t.fg, 0.16) : tint(BRAND, 0.32), fontFamily: "Georgia, serif" }}>&ldquo;</div>
        <div style={{ fontSize: 66, lineHeight: 1.32, fontWeight: 700, color: t.fg, wordBreak: "keep-all", whiteSpace: "pre-wrap" }}>{page.headline}</div>
        {page.body && <div style={{ fontSize: 38, lineHeight: 1.5, color: t.sub, wordBreak: "keep-all" }}>— {page.body}</div>}
        <div style={{ marginTop: "auto" }}><Handle t={t} handle={handle} /></div>
      </div>
    );
  }

  if (layout === "emphasis") {
    const big = bigNum(page) || page.body?.slice(0, 6) || "";
    return (
      <div style={{ ...outer, padding: PAD, justifyContent: "center", gap: 28 }}>
        <div>
          {tagRow}
          <div style={{ fontSize: 54, fontWeight: 700, lineHeight: 1.25, color: t.sub, wordBreak: "keep-all", whiteSpace: "pre-wrap", marginTop: tag ? 20 : 0 }}>{page.headline}</div>
        </div>
        {/* 강조형: 단위·캡션 없이 큰 숫자 + 본문을 헤드라인 밑에 */}
        <div style={{ fontSize: 300, lineHeight: 0.9, fontWeight: 800, color: t.mono ? t.fg : BRAND, letterSpacing: -8, wordBreak: "keep-all" }}>{big}</div>
        {page.body && <div style={{ fontSize: 44, lineHeight: 1.45, fontWeight: 500, color: t.fg, wordBreak: "keep-all", whiteSpace: "pre-wrap" }}>{page.body}</div>}
        <div style={{ marginTop: "auto" }}><Handle t={t} handle={handle} /></div>
      </div>
    );
  }

  if (layout === "cta") {
    return (
      <div style={{ ...outer, padding: PAD, justifyContent: "center", alignItems: "flex-start", gap: 32 }}>
        {tag && <TagEl tag={tag} t={t} />}
        <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.14, color: t.fg, wordBreak: "keep-all", whiteSpace: "pre-wrap" }}>{page.headline}</div>
        {page.body && <div style={{ fontSize: 42, lineHeight: 1.5, color: t.sub, wordBreak: "keep-all", whiteSpace: "pre-wrap" }}>{page.body}</div>}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 16, marginTop: 12, padding: "26px 44px", borderRadius: 999, background: t.mono ? t.fg : BRAND, color: t.mono ? t.bg : "#fff", fontSize: 40, fontWeight: 700 }}>
          팔로우하고 더 보기 <span style={{ fontSize: 44 }}>→</span>
        </div>
        <div style={{ marginTop: "auto", width: "100%" }}><Handle t={t} handle={handle} /></div>
      </div>
    );
  }

  // ── cover(표지) — 기본. 반반(비주얼 상단) 또는 큰 표지 텍스트 ──
  return (
    <div style={{ ...outer, padding: showVisual ? "72px 72px 72px 72px" : PAD, gap: showVisual ? 40 : 28, justifyContent: showVisual ? "flex-start" : "center" }}>
      {showVisual && <Visual t={t} photoDataUrl={photoDataUrl} note={page.photoNote} />}
      <div style={{ display: "flex", flexDirection: "column", gap: showVisual ? 18 : 26 }}>
        {tagRow}
        <div style={{ fontSize: showVisual ? 64 : 100, lineHeight: 1.1, fontWeight: 800, color: t.fg, wordBreak: "keep-all", whiteSpace: "pre-wrap", letterSpacing: -1 }}>{page.headline}</div>
        {page.body && <div style={{ fontSize: showVisual ? 36 : 44, lineHeight: 1.5, color: t.sub, whiteSpace: "pre-wrap", wordBreak: "keep-all" }}>{page.body}</div>}
      </div>
      <div style={{ marginTop: "auto" }}><Handle t={t} handle={handle} /></div>
    </div>
  );
}
