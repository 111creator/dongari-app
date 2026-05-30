"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError("이메일 또는 비밀번호가 올바르지 않습니다."); setLoading(false); return; }
    router.push("/dashboard");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "var(--bg)" }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎓</div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "8px" }}>로그인</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>충북대 동아리앱에 오신 것을 환영합니다</p>
        </div>
        <div className="card" style={{ padding: "32px" }}>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "13px", color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>이메일</label>
              <input className="input" type="email" placeholder="student@cbnu.ac.kr" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: "13px", color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>비밀번호</label>
              <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && <p style={{ color: "var(--danger)", fontSize: "13px" }}>{error}</p>}
            <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: "8px", height: "44px" }}>
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>
          <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "var(--text-muted)" }}>
            계정이 없으신가요? <Link href="/auth/signup" style={{ color: "var(--primary-light)" }}>회원가입</Link>
          </p>
        </div>
        <p style={{ textAlign: "center", marginTop: "16px", fontSize: "13px", color: "var(--text-muted)" }}>
          <Link href="/" style={{ color: "var(--text-muted)" }}>← 홈으로</Link>
        </p>
      </div>
    </div>
  );
}
