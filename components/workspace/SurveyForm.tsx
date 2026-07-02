"use client";

import { useState } from "react";
import { api } from "@/lib/workspace/client";
import { Button, Field, inputClass } from "@/components/workspace/ui";
import type {
  ContentFormat,
  OperationGoal,
  SensitiveDomain,
  SurveyProfile,
} from "@/lib/workspace/types";

const GOALS: OperationGoal[] = ["취미", "브랜딩", "협찬", "매출", "문의", "포트폴리오"];
const FORMATS: ContentFormat[] = ["카드뉴스", "릴스", "사진", "스토리"];
const DOMAINS: SensitiveDomain[] = ["없음", "금융·투자·부동산", "의료·건강·다이어트", "법률·세무", "기타 규제"];
const LENGTHS = ["짧게", "보통", "길게"] as const;

// 구간 버튼 → 대표 숫자(스키마 불변, diagnoseStage/recommendedCount 계약 그대로).
const FOLLOWER_BUCKETS = [
  { label: "~100", val: 50, min: 0, max: 99 },
  { label: "100~500", val: 300, min: 100, max: 499 },
  { label: "500~1천", val: 700, min: 500, max: 999 },
  { label: "1천~3천", val: 2000, min: 1000, max: 2999 },
  { label: "3천+", val: 5000, min: 3000, max: Infinity },
];
const MONTH_BUCKETS = [
  { label: "1개월 미만", val: 0, min: 0, max: 0 },
  { label: "1~6개월", val: 3, min: 1, max: 6 },
  { label: "6~12개월", val: 9, min: 7, max: 12 },
  { label: "1년 이상", val: 18, min: 13, max: Infinity },
];
const WEEKLY = [2, 3, 4, 5, 6, 7];

// 프리셋(탭 한 번). 직접 입력 텍스트로 언제든 덮어쓸 수 있음.
const VOICE_PRESETS = ["담백한 존댓말", "다정한 반말", "활기찬 존댓말(~해요/~해봐요)", "전문적·신뢰감 있는", "위트 있는 구어체"];
const CTA_PRESETS = ["저장 유도", "프로필 방문 유도", "공유 유도", "댓글 유도", "팔로우 유도"];
const HASHTAG_PRESETS = ["니치 위주 8~12개", "대형+니치 혼합", "최소한만(3~5개)", "트렌드 태그 포함"];
const VISUAL_PRESETS = ["미니멀", "따뜻한 크림톤", "비비드·선명", "모노톤", "파스텔"];
// 다중 선택(콤마로 합쳐 문자열 저장).
const ASSET_PRESETS = ["사진 다수 보유", "영상 촬영 가능", "제품·매장 있음", "직접 촬영은 어려움"];
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

// 구간 버튼(단일). 현재 숫자값이 구간에 들면 활성.
function BucketField({
  label,
  hint,
  buckets,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  buckets: { label: string; val: number; min: number; max: number }[];
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex flex-wrap gap-2 pt-1">
        {buckets.map((b) => (
          <Chip key={b.label} active={value >= b.min && value <= b.max} onClick={() => onChange(b.val)}>
            {b.label}
          </Chip>
        ))}
      </div>
    </Field>
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
}: {
  initial?: SurveyProfile | null;
  mode: "onboarding" | "edit";
  onSaved?: (s: SurveyProfile) => void;
}) {
  const [s, setS] = useState<SurveyProfile>({ ...EMPTY, ...(initial ?? {}) });
  const [step, setStep] = useState(0);
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
    const payload: SurveyProfile = {
      ...s,
      brandKeywords: keywordsText.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 5),
      forbiddenExpressions: forbiddenText.split(",").map((x) => x.trim()).filter(Boolean),
    };
    if (!payload.niche.trim()) {
      setErr("주제(니치)는 필수예요.");
      setStep(0);
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

  const steps = ["계정 · 여건", "톤앤매너", "민감도 · 벤치마크"];

  return (
    <div>
      {/* step nav */}
      <div className="flex gap-2 mb-6">
        {steps.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(i)}
            className={`flex-1 text-left rounded-xl border px-3 py-2 transition ${
              step === i ? "border-coral bg-card" : "border-line bg-paper-2/50"
            }`}
          >
            <div className="text-xs text-muted">STEP {i + 1}</div>
            <div className={`text-sm font-medium ${step === i ? "text-ink" : "text-ink-soft"}`}>
              {label}
            </div>
          </button>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-4 float-in">
          <Field label="주제(니치)" hint="필수">
            <input
              className={inputClass}
              value={s.niche}
              onChange={(e) => set("niche", e.target.value)}
              placeholder="예: 퇴근 후 운동·식단 / 동네 베이커리"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <BucketField label="현재 팔로워 수" buckets={FOLLOWER_BUCKETS} value={s.followers} onChange={(v) => set("followers", v)} />
            <BucketField label="운영 기간" buckets={MONTH_BUCKETS} value={s.operatingMonths} onChange={(v) => set("operatingMonths", v)} />
          </div>
          <Field label="운영 목적" hint="복수 선택">
            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => (
                <Chip key={g} active={s.goals.includes(g)} onClick={() => set("goals", toggle(s.goals, g))}>
                  {g}
                </Chip>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
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
          <MultiPresetField
            label="보유 자산"
            hint="복수 선택 · 직접 추가 가능"
            presets={ASSET_PRESETS}
            value={s.assets}
            onChange={(v) => set("assets", v)}
            placeholder="또는 직접 입력 (쉼표로 구분)"
          />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4 float-in">
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="선호 캡션 길이">
              <div className="flex gap-2 pt-1">
                {LENGTHS.map((l) => (
                  <Chip key={l} active={s.captionLength === l} onClick={() => set("captionLength", l)}>
                    {l}
                  </Chip>
                ))}
              </div>
            </Field>
            <div />
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
          <div className="grid grid-cols-[1fr_auto] gap-3 items-start">
            <PresetField
              label="비주얼 가이드"
              hint="색감·무드"
              presets={VISUAL_PRESETS}
              value={s.visualGuide}
              onChange={(v) => set("visualGuide", v)}
              placeholder="또는 직접 입력"
            />
            <Field label="브랜드 컬러">
              <input
                type="color"
                value={s.brandColor}
                onChange={(e) => set("brandColor", e.target.value)}
                className="w-14 h-11 rounded-xl border border-line bg-card cursor-pointer p-1"
              />
            </Field>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 float-in">
          <Field label="민감/규제 도메인" hint="해당 시 검수 룰셋 자동 적용">
            <div className="flex flex-wrap gap-2">
              {DOMAINS.map((d) => (
                <Chip key={d} active={s.sensitiveDomain === d} onClick={() => set("sensitiveDomain", d)}>
                  {d}
                </Chip>
              ))}
            </div>
          </Field>
          {s.sensitiveDomain !== "없음" && (
            <p className="text-sm text-amber bg-amber-soft rounded-xl px-4 py-3">
              ⚠ 이 도메인은 ‘권유·강요·단정·보장’ 표현을 검수 단계에서 자동 플래그하고, 생성 시에도
              정보 제공형으로 유도해요.
            </p>
          )}
          <Field label="벤치마크 계정" hint="선택">
            <input
              className={inputClass}
              value={s.benchmark}
              onChange={(e) => set("benchmark", e.target.value)}
              placeholder="@reference_account"
            />
          </Field>
        </div>
      )}

      {err && <p className="text-sm text-coral mt-4">{err}</p>}

      <div className="flex items-center justify-between mt-7">
        <Button
          variant="ghost"
          onClick={() => setStep((x) => Math.max(0, x - 1))}
          disabled={step === 0}
        >
          ← 이전
        </Button>
        {step < 2 ? (
          <Button onClick={() => setStep((x) => Math.min(2, x + 1))}>다음 →</Button>
        ) : (
          <Button onClick={save} disabled={saving}>
            {saving ? "저장 중…" : mode === "onboarding" ? "설문 완료하고 전략 받기" : "변경 저장"}
          </Button>
        )}
      </div>
    </div>
  );
}
