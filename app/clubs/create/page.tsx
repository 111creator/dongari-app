"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CATEGORIES = ["학술", "체육", "문화예술", "봉사", "취미", "기타"];

export default function CreateClubPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", category: "학술", max_members: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/auth/login");
      else setUser(data.user);
    });
  }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data: club, error: err } = await supabase.from("clubs").insert({
      name: form.name,
      description: form.description,
      category: form.category,
      president_id: user.id,
      is_recruiting: true,
      ...(form.max_members ? { max_members: Number(form.max_members) } : {})
    }).select().single();

    if (err) { setError(err.message); setLoading(false); return; }

    // Auto-add creator as president
    await supabase.from("memberships").insert({
      club_id: club.id, user_id: user.id, role: "president", status: "approved"
    });

    router.push(`/clubs/${club.id}`);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(10,15,30,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border)", padding: "0 24px", height: "64px", display: "flex", alignItems: "center", gap: "16px" }}>
        <Link href="/dashboard" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "20px" }}>←</Link>
        <span style={{ fontWeight: "800", fontSize: "17px" }}>새 동아리 만들기</span>
      </nav>
      <div style={{ maxWidth: "600px", margin: "40px auto", padding: "0 24px" }}>
        <div className="card" style={{ padding: "32px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <label style={{ fontSize: "13px", color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>동아리 이름 *</label>
              <input className="input" placeholder="예: 충북대 프로그래밍 동아리" value={form.name} onChange={set("name")} required />
            </div>
            <div>
              <label style={{ fontSize: "13px", color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>카테고리 *</label>
              <select className="input" value={form.category} onChange={set("category") as any}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "13px", color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>동아리 소개 *</label>
              <textarea className="input" placeholder="동아리를 소개해주세요" value={form.description} onChange={set("description")} style={{ height: "140px", resize: "vertical" }} required />
            </div>
            <div>
              <label style={{ fontSize: "13px", color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>최대 모집 인원 (선택)</label>
              <input className="input" type="number" placeholder="제한 없음" value={form.max_members} onChange={set("max_members")} />
            </div>
            {error && <p style={{ color: "var(--danger)", fontSize: "13px" }}>{error}</p>}
            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <button className="btn-primary" type="submit" disabled={loading} style={{ flex: 1, height: "44px" }}>
                {loading ? "만드는 중..." : "동아리 만들기"}
              </button>
              <Link href="/dashboard"><button className="btn-secondary" type="button" style={{ height: "44px" }}>취소</button></Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
