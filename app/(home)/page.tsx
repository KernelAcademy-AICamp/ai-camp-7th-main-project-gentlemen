"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as THREE from "three";
import { AuthButton } from "@/app/(marketing)/_components/auth-modal";
import styles from "./home.module.css";

/**
 * KUP 랜딩(홈) — 사용자 제공 디자인 이식.
 * 히어로: 스크롤에 따라 핑크 콘텐츠 카드가 지구 같은 구(球)로 조립되는 Three.js 인터랙션.
 * 자체 헤더/푸터 포함 → (marketing) 레이아웃이 아닌 (home) 라우트 그룹에서 렌더.
 */

const PLANS = [
  {
    name: "베이직",
    monthly: 0,
    desc: "가볍게 시작",
    feats: ["계정 1개 연동", "AI 기획·제작 기본", "DM 리드마그넷 100건"],
    featured: false,
  },
  {
    name: "프로",
    monthly: 9900,
    desc: "꾸준히 성장",
    feats: ["계정 3개 연동", "AI 제작 무제한", "DM 1,000건 · 성과 분석"],
    featured: true,
  },
  {
    name: "프리미엄",
    monthly: 19900,
    desc: "제한 없이",
    feats: ["계정 무제한", "DM 무제한", "우선 지원"],
    featured: false,
  },
];

type ShowcaseKey = "plan" | "create" | "analyze";
const SHOWCASE: { key: ShowcaseKey; label: string; t: string; d: string; l: string; hint: string }[] = [
  {
    key: "plan",
    label: "Plan",
    t: "무엇을, 언제 올릴지 정해 드려요",
    d: "계정 콘셉트와 목표를 바탕으로 주 2회 발행 로드맵을 짜 드려요. 다음에 올릴 주제가 늘 준비되어 있습니다.",
    l: "기획 흐름 보기",
    hint: "Plan · 기획 화면 자리 (GIF·영상)",
  },
  {
    key: "create",
    label: "Create",
    t: "내 말투 그대로, 카드뉴스 초안",
    d: "몇 번의 대화로 내 톤을 학습해 카드뉴스 초안을 만들어요. 손볼 곳이 거의 없이, 결정은 늘 당신 몫으로 남겨 둡니다.",
    l: "제작 과정 보기",
    hint: "Create · 제작 화면 자리 (GIF·영상)",
  },
  {
    key: "analyze",
    label: "Analyze",
    t: "이어지는 발행이 성과가 되도록",
    d: "발행 성과와, 이번 주에서 다음 주로 이어지는 발행 유지율을 한눈에 봐요. 무엇이 통했는지 확인하고 다음 콘텐츠에 반영합니다.",
    l: "성과 리포트 보기",
    hint: "Analyze · 성과 화면 자리 (GIF·영상)",
  },
];

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const heroBlockRef = useRef<HTMLDivElement>(null);
  const endlineRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [webglFailed, setWebglFailed] = useState(false);
  const [yearly, setYearly] = useState(false);
  const [tab, setTab] = useState<ShowcaseKey>("plan");
  const active = SHOWCASE.find((s) => s.key === tab)!;

  useEffect(() => {
    const canvas = canvasRef.current;
    const heroEl = heroRef.current;
    if (!canvas || !heroEl) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia("(max-width:760px)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      setWebglFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xffdcec, 13, 26);

    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
    camera.position.set(0, 0, 6.4);

    scene.add(new THREE.AmbientLight(0xffffff, 0.82));
    const dir = new THREE.DirectionalLight(0xffffff, 0.85);
    dir.position.set(4, 7, 8);
    scene.add(dir);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xffcfe2, 0.45));

    // 콘텐츠 카드 텍스처(흰 카드 + 옅은 콘텐츠) — 인스턴스별 핑크 틴트
    function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
    function makeCardTexture() {
      const s = 256;
      const c = document.createElement("canvas");
      c.width = c.height = s;
      const x = c.getContext("2d")!;
      x.clearRect(0, 0, s, s);
      roundRect(x, 16, 16, 224, 224, 30); x.fillStyle = "#ffffff"; x.fill();
      roundRect(x, 34, 34, 188, 104, 18); x.fillStyle = "#e7dde3"; x.fill();
      x.fillStyle = "#d4c6cd";
      x.beginPath(); x.moveTo(118, 72); x.lineTo(118, 100); x.lineTo(144, 86); x.closePath(); x.fill();
      x.fillStyle = "#e2d6dd"; x.beginPath(); x.arc(52, 168, 13, 0, Math.PI * 2); x.fill();
      roundRect(x, 74, 161, 86, 12, 6); x.fillStyle = "#e6dbe1"; x.fill();
      x.fillStyle = "#eadfe5";
      roundRect(x, 34, 192, 170, 11, 5); x.fill();
      roundRect(x, 34, 210, 120, 11, 5); x.fill();
      const t = new THREE.CanvasTexture(c);
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return t;
    }

    const N = isMobile ? 1300 : 2600;
    const R = 5.0;
    const geo = new THREE.PlaneGeometry(1, 1);
    const cardTex = makeCardTexture();
    const mat = new THREE.MeshStandardMaterial({
      map: cardTex, transparent: false, alphaTest: 0.5, roughness: 0.9, metalness: 0.0, side: THREE.DoubleSide,
    });
    const mesh = new THREE.InstancedMesh(geo, mat, N);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const group = new THREE.Group();
    group.add(mesh);
    group.rotation.x = -0.14;
    scene.add(group);

    // 인스턴스 데이터 (피보나치 구)
    const pos: THREE.Vector3[] = [];
    const quat: THREE.Quaternion[] = [];
    const size: number[] = [];
    const thr: number[] = [];
    const normal: THREE.Vector3[] = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    const pinks = [0xff6fa5, 0xff87b7, 0xffa6cb, 0xf5559a, 0xff7fb0, 0xffb9d6].map((h) => new THREE.Color(h));

    const tmp: { i: number; dirv: THREE.Vector3; z: number }[] = [];
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const rr = Math.sqrt(Math.max(0, 1 - y * y));
      const th = i * golden;
      const dirv = new THREE.Vector3(Math.cos(th) * rr, y, Math.sin(th) * rr);
      tmp.push({ i, dirv, z: dirv.z });
    }
    // 앞면(카메라 방향) ~26장을 "히어로" 카드로
    const front = tmp.slice().sort((a, b) => b.z - a.z).slice(0, 220);
    const heroSet = new Set<number>();
    const HERO = 26;
    for (let k = 0; k < HERO; k++) heroSet.add(front[Math.floor((k * front.length) / HERO)]!.i);

    const nOff = new THREE.Vector3();
    const mLook = new THREE.Matrix4();
    const eye = new THREE.Vector3();
    const tgt = new THREE.Vector3();
    const wUp = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
      const d = tmp[i]!.dirv;
      const p = d.clone().multiplyScalar(R);
      normal.push(d.clone());
      nOff.copy(d).multiplyScalar((Math.random() - 0.5) * 0.06);
      p.add(nOff);
      pos.push(p);

      // 카드 앞면(+z)이 구의 중심을 바라보게
      wUp.set(0, 1, 0);
      if (Math.abs(d.dot(wUp)) > 0.98) wUp.set(1, 0, 0);
      eye.copy(p);
      tgt.copy(p).add(d);
      mLook.lookAt(eye, tgt, wUp);
      quat.push(new THREE.Quaternion().setFromRotationMatrix(mLook));

      size.push(0.44 + Math.random() * 0.14);
      thr.push(heroSet.has(i) ? 0 : 0.07 + Math.random() * 0.5);

      mesh.setColorAt(i, pinks[(Math.random() * pinks.length) | 0]!);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    // 표면에서 살짝 떠 있는 카드들
    const FLOAT = 32;
    const floats: { idx: number; dist: number; phase: number; amp: number; speed: number }[] = [];
    for (let k = 0; k < FLOAT; k++) {
      const idx = Math.floor(((k + 0.5) / FLOAT) * N);
      const dist = R + 0.4 + Math.random() * 0.9;
      pos[idx]!.copy(normal[idx]!).multiplyScalar(dist);
      size[idx] = 0.52 + Math.random() * 0.14;
      thr[idx] = 0.22 + Math.random() * 0.18;
      floats.push({ idx, dist, phase: Math.random() * Math.PI * 2, amp: 0.14 + Math.random() * 0.2, speed: 0.35 + Math.random() * 0.45 });
    }

    const M = new THREE.Matrix4();
    const sc = new THREE.Vector3();
    const vF = new THREE.Vector3();
    const smoothstep = (a: number, b: number, x: number) => {
      x = Math.max(0, Math.min(1, (x - a) / (b - a)));
      return x * x * (3 - 2 * x);
    };
    const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

    const scaleFor = (idx: number, p: number, heroLerp: number) => {
      const isHero = thr[idx] === 0;
      const reveal = isHero ? 1 : smoothstep(thr[idx]!, thr[idx]! + 0.16, p);
      const s = size[idx]! * reveal * (isHero ? heroLerp : 1);
      return s < 0.0008 ? 0.0001 : s;
    };
    const buildMatrices = (p: number) => {
      const heroLerp = 1.7 - 0.7 * smoothstep(0, 0.32, p);
      for (let i = 0; i < N; i++) {
        const s = scaleFor(i, p, heroLerp);
        sc.set(s, s, s);
        M.compose(pos[i]!, quat[i]!, sc);
        mesh.setMatrixAt(i, M);
      }
      mesh.instanceMatrix.needsUpdate = true;
    };
    buildMatrices(0);

    const updateFloats = (p: number, t: number) => {
      const heroLerp = 1.7 - 0.7 * smoothstep(0, 0.32, p);
      for (const f of floats) {
        const s = scaleFor(f.idx, p, heroLerp);
        const dist = f.dist + Math.sin(t * f.speed + f.phase) * f.amp;
        vF.copy(normal[f.idx]!).multiplyScalar(dist);
        sc.set(s, s, s);
        M.compose(vF, quat[f.idx]!, sc);
        mesh.setMatrixAt(f.idx, M);
      }
      mesh.instanceMatrix.needsUpdate = true;
    };

    let progress = 0;
    let lastBuilt = -1;
    let spin = 0;
    let mx = 0, my = 0, tmx = 0, tmy = 0;
    let rafId = 0;

    const heroBlock = heroBlockRef.current;
    const endline = endlineRef.current;
    const hint = hintRef.current;
    const hd = headerRef.current;

    const updateProgress = () => {
      const rect = heroEl.getBoundingClientRect();
      const total = heroEl.offsetHeight - window.innerHeight;
      progress = Math.max(0, Math.min(1, -rect.top / total));
      if (heroBlock) {
        heroBlock.style.opacity = String(1 - smoothstep(0.42, 0.66, progress));
        heroBlock.style.transform = `translateY(${-progress * 40}px)`;
      }
      if (endline) endline.style.opacity = String(smoothstep(0.6, 0.9, progress));
      if (hint) hint.style.opacity = String(1 - smoothstep(0.02, 0.12, progress));
      if (hd) hd.classList.toggle(styles.solid!, window.scrollY > 40);
    };
    window.addEventListener("scroll", updateProgress, { passive: true });

    const onPointer = (e: PointerEvent) => {
      tmx = e.clientX / window.innerWidth - 0.5;
      tmy = e.clientY / window.innerHeight - 0.5;
    };
    if (!reduced && !isMobile) window.addEventListener("pointermove", onPointer);

    const resize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", resize);
    resize();
    updateProgress();

    const frame = () => {
      if (Math.abs(progress - lastBuilt) > 0.0009) {
        buildMatrices(progress);
        lastBuilt = progress;
      }
      const pe = easeInOut(progress);
      const d = 6.4 + (15.6 - 6.4) * pe; // 돌리아웃: 큰 카드 몇 장 → 전체 구
      mx += (tmx - mx) * 0.05;
      my += (tmy - my) * 0.05;
      const par = 1 - progress;
      camera.position.set(mx * 0.7 * par, -my * 0.5 * par, d);
      camera.lookAt(0, 0, 0);
      group.scale.setScalar(1 - 0.5 * smoothstep(0.55, 1.0, progress));
      if (!reduced) spin += 0.0012;
      group.rotation.y = spin + progress * 0.9;
      group.rotation.x = -0.14 + progress * 0.05;
      if (!reduced) updateFloats(progress, performance.now() * 0.001);
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(frame);
    };
    frame();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", resize);
      scene.remove(group);
      geo.dispose();
      mat.dispose();
      cardTex.dispose();
      mesh.dispose();
      renderer.dispose();
      renderer.forceContextLoss(); // 실제 WebGL 컨텍스트 해제 — 재진입/StrictMode 시 누적 방지
    };
  }, []);

  const price = (monthly: number) => {
    if (monthly === 0) return "₩0";
    const v = yearly ? Math.round((monthly * 12 * 0.7) / 12) : monthly;
    return `₩${v.toLocaleString("ko-KR")}`;
  };

  return (
    <div className={`${styles.wrap} ${webglFailed ? styles.noWebgl : ""}`}>
      {/* header */}
      <header ref={headerRef} className={styles.header}>
        <nav className={styles.nav}>
          <Link className={styles.logo} href="/"><span className={styles.dot} />KUP</Link>
          <div className={styles.navLinks}>
            <a href="#feat">제품</a>
            <a href="#feat">활용 사례</a>
            <a href="#pricing">가격</a>
            <a href="#feat">블로그</a>
          </div>
          <div className={styles.navCta}>
            <AuthButton className={`${styles.btn} ${styles.btnGhost}`}>로그인</AuthButton>
            <AuthButton className={`${styles.btn} ${styles.btnPrimary}`}>무료로 시작하기</AuthButton>
          </div>
        </nav>
      </header>

      {/* hero */}
      <section ref={heroRef} className={styles.hero} id="hero">
        <div className={styles.stage}>
          <canvas ref={canvasRef} className={styles.scene} />

          <div className={styles.overlay}>
            <div ref={heroBlockRef} className={styles.heroBlock}>
              <span className={styles.eyebrow}><span className={styles.pulse} />0–1,000 팔로워를 위한 콘텐츠 엔진</span>
              <h1 className={styles.h1}>카드 한 장으로<br /><span className={styles.hl}>채널을 채우세요</span></h1>
              <p className={styles.sub}>KUP가 당신의 말투를 학습해 카드뉴스를 만들고, 정해진 시간에 올리고, 성과까지 정리해 드려요.</p>
              <div className={styles.heroCta}>
                <AuthButton className={`${styles.btn} ${styles.btnPrimary}`}>무료로 시작하기</AuthButton>
                <AuthButton className={`${styles.btn} ${styles.btnLine}`}>데모 보기</AuthButton>
              </div>
            </div>
          </div>

          <div ref={endlineRef} className={styles.endline}>
            흩어진 아이디어가, 하나의 계정으로
            <small>수천 개의 콘텐츠를 KUP 안에서</small>
          </div>

          <div ref={hintRef} className={styles.scrollhint}>
            <div className={styles.mouse} />
            SCROLL
          </div>
        </div>
      </section>

      {/* features */}
      <section className={styles.section} id="feat">
        <span className={styles.kicker}>무엇을 하나요</span>
        <h2 className={styles.h2}>전략부터 발행까지, 한 흐름으로</h2>
        <p className={styles.lead}>아이디어를 붙잡아 두는 포스트잇처럼, KUP는 흩어진 콘텐츠 조각을 모아 꾸준히 발행되는 하나의 채널로 만들어 드려요.</p>

        <div className={styles.grid}>
          <div className={styles.feat}>
            <div className={styles.no}>01</div>
            <h3>성장 전략</h3>
            <p>계정 콘셉트와 목표에 맞춰 주 2회 발행 로드맵을 제안해요. 무엇을, 언제 올릴지 고민을 덜어 드립니다.</p>
            <span className={styles.chip}>전략 → 발행 로드맵</span>
          </div>
          <div className={styles.feat}>
            <div className={styles.no}>02</div>
            <h3>콘텐츠 자동 생성</h3>
            <p>내 말투를 학습한 카드뉴스 초안을 만들어요. 손볼 곳이 거의 없도록, 결정은 늘 당신 몫으로 남겨 둡니다.</p>
            <span className={styles.chip}>초안 → 리뷰</span>
          </div>
          <div className={styles.feat}>
            <div className={styles.no}>03</div>
            <h3>업로드 & 관리</h3>
            <p>예약 발행부터 성과 리포트까지 한 곳에서. 이번 주 발행이 다음 주로 이어지도록 리듬을 지켜 드려요.</p>
            <span className={styles.chip}>발행 → 성과</span>
          </div>
        </div>

        <div className={styles.note}>✦ <span><b>모든 초안은 언제든 직접 수정</b>할 수 있어요. 최종 결정권은 항상 당신에게 있습니다.</span></div>
      </section>

      {/* showcase (탭) — 사용자 추가 섹션 */}
      <section className={styles.section} id="showcase">
        <span className={styles.kicker}>한 흐름으로</span>
        <h2 className={styles.h2}>기획부터 성과까지, 끊김 없이</h2>

        <div className={styles.showcaseCard}>
          <div className={styles.tabs} role="tablist" aria-label="KUP 워크플로우">
            {SHOWCASE.map((s) => (
              <button
                key={s.key}
                type="button"
                role="tab"
                aria-selected={tab === s.key}
                className={`${styles.tab} ${tab === s.key ? styles.active : ""}`}
                onClick={() => setTab(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className={styles.showcaseBody}>
            <div className={styles.showcaseCopy}>
              <h3>{active.t}</h3>
              <p>{active.d}</p>
              <a className={styles.scLink} href="#"><span>{active.l}</span><span aria-hidden="true">→</span></a>
            </div>
            <div className={styles.showcaseVisual}>
              {SHOWCASE.map((s) => (
                <div key={s.key} className={`${styles.mediaFrame} ${tab === s.key ? styles.active : ""}`}>
                  <span className={styles.mediaHint}>{s.hint}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* pricing (추가) */}
      <section className={styles.section} id="pricing">
        <div className={styles.priceHead}>
          <span className={styles.kicker}>요금제</span>
          <h2 className={styles.h2}>부담 없이 시작하고, 필요할 때 키우세요</h2>
          <p className={styles.lead}>베타 기간엔 모든 플랜을 무료로 써볼 수 있어요.</p>
          <div className={styles.toggleWrap}>
            <span style={{ color: yearly ? undefined : "var(--ink)", fontWeight: yearly ? 500 : 700 }}>월간</span>
            <button
              type="button"
              role="switch"
              aria-checked={yearly}
              aria-label="결제 주기"
              className={styles.toggle}
              data-on={yearly}
              onClick={() => setYearly((v) => !v)}
            >
              <span className={styles.knob} />
            </button>
            <span style={{ color: yearly ? "var(--ink)" : undefined, fontWeight: yearly ? 700 : 500 }}>
              연간 <span className={styles.saveTag}>30% 할인</span>
            </span>
          </div>
        </div>

        <div className={styles.priceGrid}>
          {PLANS.map((p) => (
            <div key={p.name} className={`${styles.plan} ${p.featured ? styles.featured : ""}`}>
              {p.featured && <div className={styles.planBadge}>추천</div>}
              <div className={styles.planName}>{p.name}</div>
              <div className={styles.planPrice}>
                {price(p.monthly)}
                <small>/월</small>
              </div>
              <p className={styles.planDesc}>{p.desc}</p>
              <ul className={styles.planFeats}>
                {p.feats.map((f) => (
                  <li key={f}><span className={styles.ck}>✓</span>{f}</li>
                ))}
              </ul>
              <AuthButton className={`${styles.btn} ${p.featured ? styles.btnPrimary : styles.btnLine} ${styles.planCta}`}>
                {p.featured ? "무료로 시작하기" : "시작하기"}
              </AuthButton>
            </div>
          ))}
        </div>
        <p className={styles.priceNote}>* 베타 기간 동안 모든 기능 무료 · 카드 등록 없이 시작</p>
      </section>

      {/* final CTA */}
      <section className={styles.final}>
        <span className={styles.kicker}>지금 시작하세요</span>
        <h2 className={styles.h2}>첫 카드부터, 꾸준한 채널까지</h2>
        <div className={styles.heroCta}>
          <AuthButton className={`${styles.btn} ${styles.btnPrimary}`}>무료로 시작하기</AuthButton>
          <AuthButton className={`${styles.btn} ${styles.btnLine}`}>데모 보기</AuthButton>
        </div>
      </section>

      {/* footer */}
      <footer className={styles.footer}>
        <div className={styles.foot}>
          <Link className={styles.logo} href="/"><span className={styles.dot} />KUP</Link>
          <div>© 2026 KUP. Instagram growth studio for creators.</div>
        </div>
      </footer>
    </div>
  );
}
