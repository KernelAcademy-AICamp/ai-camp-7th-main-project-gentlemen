"use client";

import { useState } from "react";
import { api } from "@/lib/workspace/client";
import { Button, Field, inputClass } from "@/components/workspace/ui";
import type {
  ContentFormat,
  OperationGoal,
  SurveyProfile,
} from "@/lib/workspace/types";

const GOALS: OperationGoal[] = ["취미", "브랜딩", "협찬", "매출", "문의", "포트폴리오"];
const FORMATS: ContentFormat[] = ["카드뉴스", "릴스", "사진", "스토리"];
const LENGTHS = ["짧게", "보통", "길게"] as const;
const WEEKLY = [2, 3, 4, 5, 6, 7];

// 프리셋(탭 한 번). 직접 입력 텍스트로 언제든 덮어쓸 수 있음.
const VOICE_PRESETS = ["담백한 존댓말", "다정한 반말", "활기찬 존댓말(~해요/~해봐요)", "전문적·신뢰감 있는", "위트 있는 구어체"];
const CTA_PRESETS = ["저장 유도", "프로필 방문 유도", "공유 유도", "댓글 유도", "팔로우 유도"];
const HASHTAG_PRESETS = ["니치 위주 8~12개", "대형+니치 혼합", "최소한만(3~5개)", "트렌드 태그 포함"];
const VISUAL_PRESETS = ["미니멀", "따뜻한 크림톤", "비비드·선명", "모노톤", "파스텔"];
const FORBIDDEN_PRESETS = ["과장·보장 표현", "이모지 남발", "반말", "영어 남용", "느낌표 남발"];

const EMPTY: SurveyProfile = {
  niche: "",
  followers: 0,
  operatingMonths: 0,
  goals: [],
  weeklyCapacity: 2,
  mainFormats: ["카드뉴스"],
  assets: "",
  brandKeywords: [],
  brandColor: "#ff385c",
  voiceExample: "",
  forbiddenExpressions: [],
  captionLength: "보통",
  hashtagStyle: "",
  ctaStyle: "",
  visualGuide: "",
  sensitiveDomain: "없음",
  benchmark: "",
};

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-sm border transition ${
        active ? "bg-coral text-white border-coral" : "bg-card text-ink-soft border-line hover:border-coral/40"
      }`}
    >
      {children}
    </button>
  );
}

// 프리셋 칩(단일) + 직접 입력. 텍스트가 곧 저장값이고, 칩은 텍스트를 채우는 단축.
function PresetField({
  label,
  hint,
  presets,
  value,
  onChange,
  placeholder,
  textarea,
}: {
  label: string;
  hint?: string;
  presets: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex flex-wrap gap-2 mb-2">
        {presets.map((p) => (
          <Chip key={p} active={value.trim() === p} onClick={() => onChange(p)}>
            {p}
          </Chip>
        ))}
      </div>
      {textarea ? (
        <textarea className={inputClass} rows={2} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      ) : (
        <input className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </Field>
  );
}

// 프리셋 칩(다중, 콤마 문자열) + 직접 입력. 칩은 콤마 목록의 항목을 토글.
function MultiPresetField({
  label,
  hint,
  presets,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  hint?: string;
  presets: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const items = value.split(",").map((x) => x.trim()).filter(Boolean);
  const has = (p: string) => items.includes(p);
  const toggleItem = (p: string) => onChange((has(p) ? items.filter((x) => x !== p) : [...items, p]).join(", "));
  return (
    <Field label={label} hint={hint}>
      <div className="flex flex-wrap gap-2 mb-2">
        {presets.map((p) => (
          <Chip key={p} active={has(p)} onClick={() => toggleItem(p)}>
            {p}
          </Chip>
        ))}
      </div>
      <input className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </Field>
  );
}

export function SurveyForm({
  initial,
  mode,
  onSaved,
  onCancel,
}: {
  initial?: SurveyProfile | null;
  mode: "onboarding" | "edit";
  onSaved?: (s: SurveyProfile) => void;
  onCancel?: () => void;
}) {
  const [s, setS] = useState<SurveyProfile>({ ...EMPTY, ...(initial ?? {}) });
  const [keywordsText, setKeywordsText] = useState((initial?.brandKeywords ?? []).join(", "));
  const [forbiddenText, setForbiddenText] = useState((initial?.forbiddenExpressions ?? []).join(", "));
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  function set<K extends keyof SurveyProfile>(k: K, v: SurveyProfile[K]) {
    setS((prev) => ({ ...prev, [k]: v }));
  }
  function toggle<T>(arr: T[], v: T): T[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  async function save() {
    setErr("");
    // 민감도(sensitiveDomain)는 설문에서 안 받고 서버가 니치로 자동 감지 → 안전 가드레일 유지.
    const payload: SurveyProfile = {
      ...s,
      brandKeywords: keywordsText.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 5),
      forbiddenExpressions: forbiddenText.split(",").map((x) => x.trim()).filter(Boolean),
    };
    if (!payload.niche.trim()) {
      setErr("주제(카테고리)는 필수예요.");
      return;
    }
    setSaving(true);
    try {
      const { survey } = await api<{ survey: SurveyProfile }>("/api/survey", {
        method: "PUT",
        body: payload,
      });
      onSaved?.(survey);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* 계정 기본 — 주제·목적·업로드 횟수만 */}
      <Field label="계정 주제(카테고리)" hint="필수">
        <input
          className={inputClass}
          value={s.niche}
          onChange={(e) => set("niche", e.target.value)}
          placeholder="예: 퇴근 후 운동·식단 / 동네 베이커리 / 사회초년생 재테크"
        />
      </Field>
      <Field label="운영 목적" hint="복수 선택">
        <div className="flex flex-wrap gap-2">
          {GOALS.map((g) => (
            <Chip key={g} active={s.goals.includes(g)} onClick={() => set("goals", toggle(s.goals, g))}>
              {g}
            </Chip>
          ))}
        </div>
      </Field>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="주당 업로드 가능 횟수" hint="주 2회 권장">
          <div className="flex flex-wrap gap-2 pt-1">
            {WEEKLY.map((n) => (
              <Chip key={n} active={s.weeklyCapacity === n} onClick={() => set("weeklyCapacity", n)}>
                주 {n}회
              </Chip>
            ))}
          </div>
        </Field>
        <Field label="주 콘텐츠 형식" hint="복수 선택">
          <div className="flex flex-wrap gap-2 pt-1">
            {FORMATS.map((f) => (
              <Chip
                key={f}
                active={s.mainFormats.includes(f)}
                onClick={() => set("mainFormats", toggle(s.mainFormats, f))}
              >
                {f}
              </Chip>
            ))}
          </div>
        </Field>
      </div>

      {/* 톤앤매너 — 생성 톤의 핵심 */}
      <div className="flex items-center gap-3 pt-2">
        <span className="text-xs font-semibold tracking-wide text-coral uppercase">톤앤매너</span>
        <span className="h-px flex-1 bg-line" />
      </div>
      <Field label="브랜드 키워드" hint="3~5개, 쉼표로 구분">
        <input
          className={inputClass}
          value={keywordsText}
          onChange={(e) => setKeywordsText(e.target.value)}
          placeholder="담백한, 솔직한, 실용적인"
        />
      </Field>
      <PresetField
        label="문체 예시"
        presets={VOICE_PRESETS}
        value={s.voiceExample}
        onChange={(v) => set("voiceExample", v)}
        placeholder="또는 직접 입력 (예: 친구한테 말하듯 편하게, 과장 없이)"
        textarea
      />
      <MultiPresetField
        label="금지 표현/스타일"
        hint="복수 선택 · 직접 추가 가능"
        presets={FORBIDDEN_PRESETS}
        value={forbiddenText}
        onChange={setForbiddenText}
        placeholder="또는 직접 입력 (쉼표로 구분)"
      />
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="선호 캡션 길이">
          <div className="flex gap-2 pt-1">
            {LENGTHS.map((l) => (
              <Chip key={l} active={s.captionLength === l} onClick={() => set("captionLength", l)}>
                {l}
              </Chip>
            ))}
          </div>
        </Field>
        <Field label="브랜드 컬러">
          <input
            type="color"
            value={s.brandColor}
            onChange={(e) => set("brandColor", e.target.value)}
            className="w-14 h-11 rounded-xl border border-line bg-card cursor-pointer p-1"
          />
        </Field>
      </div>
      <PresetField
        label="해시태그 스타일"
        presets={HASHTAG_PRESETS}
        value={s.hashtagStyle}
        onChange={(v) => set("hashtagStyle", v)}
        placeholder="또는 직접 입력"
      />
      <PresetField
        label="CTA 스타일"
        presets={CTA_PRESETS}
        value={s.ctaStyle}
        onChange={(v) => set("ctaStyle", v)}
        placeholder="또는 직접 입력 (예: 저장 유도 / 프로필 방문 안내)"
      />
      <PresetField
        label="비주얼 가이드"
        hint="색감·무드"
        presets={VISUAL_PRESETS}
        value={s.visualGuide}
        onChange={(v) => set("visualGuide", v)}
        placeholder="또는 직접 입력"
      />

      {err && <p className="text-sm text-coral">{err}</p>}

      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            취소
          </Button>
        )}
        <Button onClick={save} disabled={saving}>
          {saving ? "저장 중…" : mode === "onboarding" ? "설문 완료하고 전략 받기" : "저장"}
        </Button>
      </div>
    </div>
  );
}
