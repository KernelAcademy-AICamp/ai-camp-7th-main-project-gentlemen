// Make a team-facing copy of the md with internal cross-refs (§, B-2) and emojis stripped from
// tables 2,3,5. Master doc is left untouched. Output: /tmp/v2_team.md
const fs = require('fs');
const src = fs.readFileSync(process.argv[2], 'utf8');

const repl = [
  // 표2 — 제외 대상: §참조 제거
  ['표현 제거 룰(§10)과 충돌', '표현 제거 룰과 충돌'],
  ['1차 검증 후 별도 검토(§17)', '1차 검증 후 별도 검토'],
  // 표3 — 1,000명 근거: 이모지 제거
  ['🔬 출처 확인 필요', '출처 확인 필요'],
  ['🔬 플랫폼 데이터 확인 필요', '플랫폼 데이터 확인 필요'],
  // 표5 — MVP 7대 기능: §/B-2 참조 제거
  ['시작 설문(§4-A) 기반 운영', '시작 설문 기반 운영'],
  ['내 주제 직접 입력(B-2)** 둘 다', '내 주제 직접 입력** 둘 다'],
  ['**필수 게이트**(§10)', '**필수 게이트**'],
  ['자동 발행 아님(§0 충돌노트)', '자동 발행 아님'],
  ['**사용자 노출용**(KPI 아님, §12)', '**사용자 노출용**(KPI 아님)'],
  ['설문(§4-A)의 영속 저장소', '설문의 영속 저장소'],
  ['테스터 베타에서 검증(§0)', '테스터 베타에서 검증'],
];

let out = src;
for (const [a, b] of repl) {
  if (!out.includes(a)) { console.error('WARN not found:', a); }
  out = out.split(a).join(b);
}
fs.writeFileSync('/tmp/v2_team.md', out);
console.log('prepared /tmp/v2_team.md');
