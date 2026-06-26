/**
 * Supabase DB 타입 — 데이터모델(Kup_데이터모델.md) 반영.
 *
 * ⚠️ 임시 수기 정의(스캐폴드용). Task 6에서 마이그레이션 적용 후
 *    `supabase gen types typescript --local > lib/db/database.types.ts` 로 자동 생성 교체.
 *    그때까지는 이 파일이 SoT(enum·핵심 테이블)로 클라이언트 타입을 잡는다.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type PlanTier = "basic" | "pro" | "premium";
export type BillingCycle = "monthly" | "yearly";
export type SubStatus = "beta_free" | "active" | "canceled" | "past_due";
export type ChannelStatus = "connected" | "needs_setup";
export type DeckStatus =
  | "planning"
  | "planned"
  | "producing"
  | "produced"
  | "scheduled"
  | "published";
export type DeckFormat = "cardnews" | "cardnews_photo";
export type RiskLevel = "low" | "high";
export type ReviewDecision = "approved" | "rejected";
export type ScheduleStatus = "pending" | "processing" | "done" | "failed" | "canceled";
export type PostStatus = "creating" | "published" | "failed";
export type DmStatus = "sent" | "failed" | "skipped_quota";

type Timestamps = { created_at: string };

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<{
        id: string;
        email: string;
        nickname: string | null;
        marketing_opt_in: boolean;
        created_at: string;
      }>;
      subscriptions: Table<{
        id: string;
        user_id: string;
        plan: PlanTier;
        billing_cycle: BillingCycle;
        status: SubStatus;
        current_period_end: string | null;
        auto_renew: boolean;
      }>;
      channels: Table<{
        id: string;
        user_id: string;
        ig_user_id: string | null;
        ig_username: string | null;
        status: ChannelStatus;
        connected_at: string | null;
      }>;
      ig_tokens: Table<{
        channel_id: string;
        access_token_enc: string; // bytea (base64 over wire)
        token_type: string;
        expires_at: string | null;
      }>;
      channel_configs: Table<{
        channel_id: string;
        persona: string;
        tone: string;
        pillars: string[];
        cadence: string | null;
        visual: Json;
        survey_raw: Json | null;
        locked_at: string;
      }>;
      decks: Table<
        {
          id: string;
          channel_id: string;
          status: DeckStatus;
          format: DeckFormat;
          topic: string | null;
          strategy: string | null;
          hook: string | null;
          lead_keyword: string | null;
          slides: Json;
          caption: string | null;
          hashtags: string[];
          ai_flags: Json;
          risk_level: RiskLevel | null;
          slide_count: number | null;
          created_at: string;
          updated_at: string;
        }
      >;
      reviews: Table<{
        id: string;
        deck_id: string;
        ai_flags: Json;
        risk_level: RiskLevel | null;
        ai_label_applied: boolean;
        decision: ReviewDecision;
        approved_by: string | null;
        decided_at: string;
      }>;
      schedules: Table<{
        id: string;
        deck_id: string;
        scheduled_at: string;
        bullmq_job_id: string | null;
        status: ScheduleStatus;
        attempts: number;
        last_error: string | null;
      }>;
      posts: Table<{
        id: string;
        deck_id: string;
        channel_id: string;
        ig_media_id: string | null;
        ig_container_id: string | null;
        permalink: string | null;
        published_at: string | null;
        status: PostStatus;
      }>;
      lead_magnets: Table<{
        id: string;
        channel_id: string;
        post_id: string | null;
        keyword: string;
        dm_payload: Json;
        active: boolean;
      }>;
      dm_logs: Table<
        {
          id: string;
          lead_magnet_id: string;
          channel_id: string;
          ig_recipient_id: string | null;
          status: DmStatus;
          sent_at: string | null;
        } & Partial<Timestamps>
      >;
      channel_insights_daily: Table<{
        id: string;
        channel_id: string;
        snapshot_date: string;
        followers_count: number | null;
        follows: number | null;
        unfollows: number | null;
        captured_at: string | null;
      }>;
      post_insights: Table<{
        id: string;
        post_id: string;
        captured_at: string;
        views: number | null;
        reach: number | null;
        saved: number | null;
        shares: number | null;
        likes: number | null;
        comments: number | null;
        profile_visits: number | null;
        follows: number | null;
      }>;
      challenge_logs: Table<{
        id: string;
        channel_id: string;
        log_date: string;
        publish_count: number;
      }>;
      events: Table<{
        id: string;
        user_id: string | null;
        channel_id: string | null;
        type: string;
        payload: Json;
        created_at: string;
      }>;
    };
    Enums: {
      plan_tier: PlanTier;
      billing_cycle: BillingCycle;
      sub_status: SubStatus;
      channel_status: ChannelStatus;
      deck_status: DeckStatus;
      deck_format: DeckFormat;
      risk_level: RiskLevel;
      review_decision: ReviewDecision;
      schedule_status: ScheduleStatus;
      post_status: PostStatus;
      dm_status: DmStatus;
    };
  };
}
