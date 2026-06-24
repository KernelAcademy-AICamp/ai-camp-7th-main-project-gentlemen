// Kup 생성 엔진 — concept(+선택 topic) → Claude → deck JSON → (자동)렌더 PNG
// 설계 근거: Kup_생성파이프라인_설계.md (§1 스키마 · §2 프롬프트 · §6 함수)
// 흐름(MVP 1차 = 단일 호출로 ②전략+③카피+④자가점검):
//   [잠긴 컨셉] + [주제(없으면 AI가 제안)] → Claude(구조화 출력) → deck → 글자수 검증(1회 재시도) → render-deck.js
//
// 실행:  node generate.js <컨셉파일> ["주제 한 줄(선택)"]
// 예:    node generate.js concepts/playlist.json
//        node generate.js concepts/playlist.json "비 오는 날 듣기 좋은 플레이리스트"
// 키:    poc/.env 에 ANTHROPIC_API_KEY=... (자동 로드). 모델은 MODEL=... 로 교체(기본 opus-4-8)

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const Anthropic = require("@anthropic-ai/sdk");

// ── .env 자동 로드 (dotenv 없이; 이미 export 됐으면 건드리지 않음) ──
(function loadEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
})();

// ── 모델 & 단가(per 1M tokens, 2026-06 기준 · 비용 표시용) ──
const MODEL = process.env.MODEL || "claude-opus-4-8";
const PRICES = {
  "claude-opus-4-8":  { in: 5,  out: 25 },
  "claude-sonnet-4-6": { in: 3,  out: 15 },
  "claude-haiku-4-5": { in: 1,  out: 5 },
};

// ── deck 구조 스키마(설계 §1.2) — 구조화 출력 강제용 ──
// 글자수 제약(§1.3)은 JSON 스키마로 못 박으니 프롬프트+코드 검증으로 처리한다.
const DECK_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["conceptId", "topic", "strategy", "leadKeyword", "slides", "caption", "hashtags", "ai_flags", "risk_level"],
  properties: {
    conceptId: { type: "string" },
    topic: { type: "string" },
    strategy: { type: "string" },
    leadKeyword: { type: "string" },           // outro cta 키워드(웹훅 매칭 키, 설계 §4)
    slides: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["kind"],
        properties: {
          kind: { type: "string", enum: ["cover", "body", "outro"] },
          kicker: { type: "string" }, title: { type: "string" }, sub: { type: "string" },
          index: { type: "string" }, head: { type: "string" }, body: { type: "string" },
          cta: { type: "string" },
        },
      },
    },
    caption: { type: "string" },
    hashtags: { type: "array", items: { type: "string" } },
    ai_flags: { type: "array", items: { type: "string" } },
    risk_level: { type: "string", enum: ["low", "high"] },
  },
};

// ── 시스템 프롬프트(설계 §2.0) — 채널마다 고정 → prompt caching 1순위 ──
function systemPrompt(c) {
  return `너는 인스타그램 카드뉴스 카피라이터다. 아래 "채널 컨셉"을 절대 규칙으로 따른다.

[채널 컨셉]
- 페르소나: ${c.persona}
- 톤: ${c.tone}
- 콘텐츠 기둥(이 안에서만 주제): ${(c.pillars || []).join(", ")}

[불변 규칙]
1. 위 톤·페르소나를 모든 문장에 반영한다. 과장·클릭베이트·이모지 남발 금지.
2. 두루뭉실한 무드 묘사로 도망가지 말고 구체적이고 실행 가능한 내용을 담는다. 채널 주제에 맞는 실제 추천(예: 음악=실제 아티스트와 곡명, 그 외 실제 장소·메뉴·제품)을 제시해 독자가 바로 저장·재생·방문할 수 있게 한다.
3. 실제 대상(곡·아티스트·인물·매장·제품)을 언급할 때: ① 실재가 확실한 것만 쓰고 없는 것을 지어내지 않는다 ② 검증 안 된 사실(발매일·수치·차트순위·가사·효능)은 단정하지 않는다 ③ 실제 고유명사를 하나라도 쓰면 risk_level="high"로 하고, 검수자가 확인·교체해야 할 항목(곡명·아티스트 등)을 ai_flags에 구체적으로 나열한다.
4. 광고/규제 표현(금융=수익 보장·투자 권유, 의료=치료·효능 단정)을 쓰지 않는다.
5. 출력은 지정된 JSON 스키마를 정확히 따른다. 아래 글자수 제약을 반드시 지킨다.`;
}

// ── 유저 프롬프트(설계 §2.1~2.4 단일 호출 통합) ──
function userPrompt(c, topic) {
  return `[작업] 이 채널의 카드뉴스 1세트를 처음부터 끝까지 만든다.
${topic ? `주제: "${topic}"` : `주제: pillars 안에서 저장·공유를 부르는 "정보성+공감" 주제를 네가 1개 정한다.`}

[구성 규칙]
- 슬라이드: 1장 cover + N장 body(2~5장) + 1장 outro. (전체 4~7장 권장)
- body의 index는 "01"부터 2자리. outro의 cta에는 리드마그넷 키워드를 넣는다(예 "💬 댓글: 플리").
- leadKeyword(예 "플리")는 cta와 일치해야 한다(댓글→DM 매칭 키).

[내용 원칙 — 가장 중요]
- 각 body는 구체적인 추천 1개를 담는다. "낮게 깔리는 소리" 같은 두루뭉실한 묘사는 금지.
- 음악 채널이면 body의 head에 실제 "아티스트 - 곡명"을, body에 그 곡이 이 상황·무드에 맞는 이유 한 줄을 쓴다. (다른 채널이면 실제 메뉴·장소·제품 등 그 채널에 맞는 구체 추천)
- 실제 곡/아티스트/고유명사를 쓰면 불변규칙 #3대로 risk_level="high" + ai_flags에 확인할 항목을 적는다.

[글자수 제약 — 초과 금지(공백 포함)]
- cover: kicker≤10, title≤24(줄바꿈 \\n 가능), sub≤34
- body : head≤24, body≤48(\\n 가능)
- outro: title≤22, sub≤40, cta≤14
- caption ≤ 300자, hashtags 5~10개(각 '#'으로 시작, 공백 없음)

[자가 점검] 생성 후 스스로 비판적으로 본다.
- 검증 필요한 주장(수치·효능·실존 인물/매장/곡명·날짜), 규제·광고 표현, 톤 일탈이 하나라도 있으면 risk_level="high"로 하고 그 지점을 ai_flags에 구체적으로. 전혀 없으면 risk_level="low", ai_flags=[].

[필드] conceptId 는 "${c.id}" 로 채운다.`;
}

// ── 글자수 검증(설계 §1.3) — 위반 목록 반환 ──
function clen(s) { return [...String(s || "")].length; }
const LIMITS = {
  cover: { kicker: 10, title: 24, sub: 34 },
  body: { head: 24, body: 48 },
  outro: { title: 22, sub: 40, cta: 14 },
};
function validateDeck(deck) {
  const v = [];
  if (!Array.isArray(deck.slides) || deck.slides.length < 3) v.push("슬라이드가 3장 미만");
  (deck.slides || []).forEach((s, i) => {
    const lim = LIMITS[s.kind];
    if (!lim) { v.push(`slide ${i + 1}: 알 수 없는 kind="${s.kind}"`); return; }
    for (const [field, max] of Object.entries(lim)) {
      // \n 으로 나눈 각 줄이 max 이하인지 본다(렌더가 줄 단위로 자르므로)
      const longest = Math.max(0, ...String(s[field] || "").split("\n").map(clen));
      if (longest > max) v.push(`slide ${i + 1}(${s.kind}).${field}: ${longest}자 > ${max}자 — "${s[field]}"`);
    }
  });
  if (clen(deck.caption) > 300) v.push(`caption ${clen(deck.caption)}자 > 300`);
  const tags = deck.hashtags || [];
  if (tags.length < 5 || tags.length > 10) v.push(`hashtags ${tags.length}개 (5~10 필요)`);
  if (tags.some((t) => !/^#\S+$/.test(t))) v.push("hashtags 형식 위반(각 '#'으로 시작·공백 없음)");
  return v;
}

// ── 단일 진입점(설계 §6) — concept → { deck, usage } ──
async function generateDeck(concept, { topic } = {}) {
  const client = new Anthropic(); // ANTHROPIC_API_KEY 자동 사용
  const system = [{ type: "text", text: systemPrompt(concept), cache_control: { type: "ephemeral" } }];
  const messages = [{ role: "user", content: userPrompt(concept, topic) }];
  const usage = { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0 };

  for (let attempt = 1; attempt <= 2; attempt++) {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system,
      output_config: { format: { type: "json_schema", schema: DECK_SCHEMA } },
      messages,
    });
    usage.input_tokens += res.usage.input_tokens || 0;
    usage.output_tokens += res.usage.output_tokens || 0;
    usage.cache_read_input_tokens += res.usage.cache_read_input_tokens || 0;

    const text = (res.content.find((b) => b.type === "text") || {}).text || "{}";
    const deck = JSON.parse(text);
    const violations = validateDeck(deck);
    if (violations.length === 0) return { deck, usage, attempts: attempt };

    if (attempt === 2) { deck._violations = violations; return { deck, usage, attempts: attempt }; }
    // 1회 재시도: 직전 결과 + 위반 목록을 주고 고치게 한다(repair)
    messages.push({ role: "assistant", content: text });
    messages.push({ role: "user", content: `아래 제약 위반을 모두 고쳐 같은 스키마로 다시 출력하라.\n- ${violations.join("\n- ")}` });
  }
}

// ── CLI: 생성 → deck 저장 → render-deck.js 자동 호출 ──
if (require.main === module) {
  (async () => {
    const conceptFile = process.argv[2];
    const topic = process.argv[3];
    if (!conceptFile) {
      console.error('사용법: node generate.js <컨셉파일> ["주제(선택)"]');
      process.exit(1);
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("❌ ANTHROPIC_API_KEY 없음 — poc/.env 에 키를 넣으세요 (.env.example 참고).");
      process.exit(1);
    }
    const concept = JSON.parse(fs.readFileSync(conceptFile, "utf8"));

    console.log(`\n🤖 [${MODEL}] 생성 중… (컨셉: ${concept.id}${topic ? `, 주제: ${topic}` : ", 주제: AI 제안"})`);
    const t0 = Date.now();
    const { deck, usage, attempts } = await generateDeck(concept, { topic });
    const sec = ((Date.now() - t0) / 1000).toFixed(1);

    // deck 저장
    const outDir = path.join(__dirname, "decks");
    const deckFile = path.join(outDir, `${concept.id}-gen.json`);
    fs.writeFileSync(deckFile, JSON.stringify(deck, null, 2));

    // 비용 계산(표시용)
    const p = PRICES[MODEL] || { in: 0, out: 0 };
    const cost = (usage.input_tokens * p.in + usage.output_tokens * p.out) / 1e6;

    console.log(`\n── 생성 리포트 ──`);
    console.log(`   주제      : ${deck.topic}`);
    console.log(`   전략      : ${deck.strategy}`);
    console.log(`   슬라이드  : ${deck.slides.length}장 / 리드키워드: ${deck.leadKeyword}`);
    console.log(`   리스크    : ${deck.risk_level === "high" ? "🔴 고위험(사람 검수 필수)" : "🟢 저위험"}`);
    (deck.ai_flags || []).forEach((f) => console.log(`   ⚠️ 플래그 : ${f}`));
    if (deck._violations) console.log(`   ⚠️ 글자수 : 2회차에도 일부 초과 — ${deck._violations.length}건(렌더는 진행)`);
    console.log(`   토큰      : in ${usage.input_tokens} / out ${usage.output_tokens} (캐시읽기 ${usage.cache_read_input_tokens}) · 재시도 ${attempts - 1}회`);
    console.log(`   비용/속도 : $${cost.toFixed(4)} · ${sec}s · 모델 ${MODEL}`);
    console.log(`   저장      : ${path.relative(process.cwd(), deckFile)}`);

    // 렌더 자동 호출(STEP 2 연결)
    console.log(`\n🎨 렌더 중…`);
    execFileSync("node", [path.join(__dirname, "render-deck.js"), conceptFile, deckFile], { stdio: "inherit" });
  })();
}

module.exports = { generateDeck, validateDeck };
