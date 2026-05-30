"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const CATEGORIES = ["전체", "학술", "체육", "문화예술", "봉사", "취미", "기타"];

type Club = {
  id: string;
  name: string;
  description: string;
  category: string;
  member_count: number;
  is_recruiting: boolean;
  image_url?: string;
};

export default function Home() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [filtered, setFiltered] = useState<Club[]>([]);
  const [category, setCategory] = useState("전체");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    const { data } = await supabase.from("clubs").select("*").order("created_at", { ascending: false });
    setClubs(data || []);
    setFiltered(data || []);
    setLoading(false);
  };

  useEffect(() => {
    let result = clubs;
    if (category !== "전체") result = result.filter((c) => c.category === category);
    if (search) result = result.filter((c) => c.name.includes(search) || c.description.includes(search));
    setFiltered(result);
  }, [category, search, clubs]);

  const EMOJI_MAP: Record<string, string> = {
    학술: "📚", 체육: "⚽", 문화예술: "🎨", 봉사: "🤝", 취미: "🎯", 기타: "✨",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* NAV */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(10,15,30,0.95)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
        padding: "0 24px", height: "64px",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px",
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "18px"
          }}>🎓</div>
          <span style={{ fontSize: "18px", fontWeight: "800", letterSpacing: "-0.5px" }}>동아리앱</span>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "-4px" }}>충북대</span>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {user ? (
            <>
              <Link href="/dashboard" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "14px" }}>대시보드</Link>
              <button onClick={() => supabase.auth.signOut().then(() => setUser(null))}
                className="btn-secondary" style={{ padding: "8px 16px", fontSize: "13px" }}>로그아웃</button>
            </>
          ) : (
            <>
              <Link href="/auth/login"><button className="btn-secondary" style={{ padding: "8px 16px", fontSize: "13px" }}>로그인</button></Link>
              <Link href="/auth/signup"><button className="btn-primary" style={{ padding: "8px 16px", fontSize: "13px" }}>회원가입</button></Link>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <div style={{
        padding: "80px 24px 60px",
        textAlign: "center",
        background: "radial-gradient(ellipse at top, rgba(59,130,246,0.08) 0%, transparent 60%)"
      }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <div className="badge badge-blue" style={{ marginBottom: "20px", fontSize: "13px" }}>
            🏫 충북대학교 공식 동아리 플랫폼
          </div>
          <h1 style={{
            fontSize: "clamp(32px, 6vw, 56px)", fontWeight: "900",
            lineHeight: "1.1", marginBottom: "20px", letterSpacing: "-1.5px"
          }}>
            나의 동아리,<br />
            <span style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              새로운 연결
            </span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "16px", lineHeight: "1.7", marginBottom: "36px" }}>
            충북대 모든 동아리를 한 곳에서. 가입부터 활동 관리까지.
          </p>
          <div style={{
            display: "flex", gap: "12px", maxWidth: "480px", margin: "0 auto"
          }}>
            <input
              className="input"
              placeholder="🔍  동아리 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, height: "48px", fontSize: "15px" }}
            />
          </div>
        </div>
      </div>

      {/* CATEGORIES */}
      <div style={{ padding: "0 24px 32px", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "32px" }}>
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)}
              style={{
                padding: "8px 18px", borderRadius: "99px", border: "1px solid",
                borderColor: category === cat ? "var(--primary)" : "var(--border-light)",
                background: category === cat ? "rgba(59,130,246,0.15)" : "transparent",
                color: category === cat ? "var(--primary-light)" : "var(--text-muted)",
                cursor: "pointer", fontSize: "13px", fontWeight: "600",
                transition: "all 0.2s"
              }}>
              {EMOJI_MAP[cat] || "🎓"} {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px", color: "var(--text-muted)" }}>불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "80px",
            color: "var(--text-muted)", background: "var(--bg-card)",
            borderRadius: "16px", border: "1px solid var(--border)"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
            <p style={{ fontSize: "16px" }}>검색 결과가 없습니다</p>
            {user && (
              <Link href="/clubs/create">
                <button className="btn-primary" style={{ marginTop: "16px" }}>새 동아리 만들기</button>
              </Link>
            )}
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px"
          }}>
            {filtered.map((club, i) => (
              <Link key={club.id} href={`/clubs/${club.id}`} style={{ textDecoration: "none" }}>
                <div className="card" style={{
                  padding: "24px", cursor: "pointer",
                  animationDelay: `${i * 0.05}s`
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                    <div style={{
                      width: "52px", height: "52px", borderRadius: "14px",
                      background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "24px"
                    }}>
                      {EMOJI_MAP[club.category] || "🎓"}
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <span className={`badge ${club.is_recruiting ? "badge-green" : "badge-gray"}`}>
                        {club.is_recruiting ? "모집중" : "모집마감"}
                      </span>
                      <span className="badge badge-blue">{club.category}</span>
                    </div>
                  </div>
                  <h3 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "8px" }}>{club.name}</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "13px", lineHeight: "1.6", marginBottom: "16px" }}>
                    {club.description.slice(0, 80)}{club.description.length > 80 ? "..." : ""}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                    <span>👥 {club.member_count}명</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
