import fs from "fs";
import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { DB } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// 워크스페이스 저장소 — 좁은 인터페이스(readDB/writeDB/mutateDB)로 백엔드를 감춘다.
//
//   KUP_DB_BACKEND=supabase  → Supabase 단일 행(app_state) JSONB blob (서버리스/배포용)
//   그 외(기본)              → 로컬 파일 .data/db.json (로컬 개발·npm run gen)
//
// ⚠️ 임시(C안): Supabase 백엔드도 통짜 blob이라 동시 write 는 마지막-쓰기-승리다.
//    소규모 베타엔 충분. 정식은 관계형 테이블(A안)로 이관 예정 — 그때 이 파일만 교체.
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_DB: DB = {
  users: [],
  sessions: [],
  strategies: {},
  cards: [],
  publishJobs: [],
  metrics: [],
  dmRules: [],
};

const USE_SUPABASE = process.env.KUP_DB_BACKEND === "supabase";

function withDefaults(parsed: Partial<DB> | null | undefined): DB {
  // 누락된 컬렉션 보강 (스키마 진화 대비)
  return { ...EMPTY_DB, ...(parsed ?? {}) } as DB;
}

// ── Supabase blob 백엔드 ─────────────────────────────────────────────────────
let _sb: SupabaseClient | null = null;
function sb(): SupabaseClient {
  if (!_sb) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "KUP_DB_BACKEND=supabase 인데 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 없습니다."
      );
    }
    _sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return _sb;
}

async function readSupabase(): Promise<DB> {
  const { data, error } = await sb().from("app_state").select("data").eq("id", 1).maybeSingle();
  if (error) throw new Error(`app_state 읽기 실패: ${error.message}`);
  return withDefaults((data?.data as Partial<DB> | undefined) ?? undefined);
}

async function writeSupabase(db: DB): Promise<void> {
  const { error } = await sb().from("app_state").upsert({ id: 1, data: db as unknown as object });
  if (error) throw new Error(`app_state 쓰기 실패: ${error.message}`);
}

// ── 파일 백엔드 (로컬) ───────────────────────────────────────────────────────
// KUP_DATA_DIR 로 데이터 디렉터리를 격리할 수 있다(기본: .data)
const DATA_DIR = process.env.KUP_DATA_DIR
  ? path.resolve(process.env.KUP_DATA_DIR)
  : path.join(process.cwd(), ".data");
const DB_PATH = path.join(DATA_DIR, "db.json");

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(EMPTY_DB, null, 2), "utf-8");
  }
}

function readFileDB(): DB {
  ensureFile();
  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    return withDefaults(JSON.parse(raw) as Partial<DB>);
  } catch {
    return structuredClone(EMPTY_DB);
  }
}

function writeFileDB(db: DB): void {
  ensureFile();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

// ── 공개 API (async — 백엔드 무관) ───────────────────────────────────────────
export async function readDB(): Promise<DB> {
  return USE_SUPABASE ? readSupabase() : readFileDB();
}

export async function writeDB(db: DB): Promise<void> {
  if (USE_SUPABASE) await writeSupabase(db);
  else writeFileDB(db);
}

// read-modify-write 를 하나의 호출로 묶어 일관성을 높인다.
export async function mutateDB<T>(fn: (db: DB) => T): Promise<T> {
  const db = await readDB();
  const result = fn(db);
  await writeDB(db);
  return result;
}

export function uid(prefix = "id"): string {
  const rnd = Math.random().toString(36).slice(2, 10);
  const t = Date.now().toString(36);
  return `${prefix}_${t}${rnd}`;
}
