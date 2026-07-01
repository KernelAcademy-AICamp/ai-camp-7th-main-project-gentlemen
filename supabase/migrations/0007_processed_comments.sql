-- 0007_processed_comments — DM 자동화 중복발송 방지(멱등).
-- 인스타 웹훅은 같은 댓글 이벤트를 여러 번 재전송한다. 서버리스(Vercel)는
-- 함수 인스턴스가 휘발·다중이라 프로세스 메모리 Set 으로는 중복을 못 막는다.
-- → 처리한 comment_id 를 이 테이블에 남기고, 발송 전에 원자적으로 "선점"한다.
--   insert 성공 = 이번이 처음 → DM 발송 / unique 충돌 = 이미 처리됨 → 스킵.
-- (blob app_state 에 넣으면 last-write-wins 레이스로 또 새므로 반드시 별도 관계형 테이블 + PK)

create table if not exists processed_comments (
  comment_id   text primary key,          -- 같은 댓글은 한 번만 (원자적 멱등키)
  processed_at timestamptz not null default now()
);

-- RLS on + 정책 없음 → service_role(BYPASSRLS)만 접근. 프론트(anon/authenticated) 차단.
alter table processed_comments enable row level security;
