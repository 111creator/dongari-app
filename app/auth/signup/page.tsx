"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", name: "", department: "", student_id: "", phone: "", is_president: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!form.email.endsWith("@cbnu.ac.kr") && !form.email.endsWith("@chungbuk.ac.kr")) {
      setError("충북대학교 이메일(@cbnu.ac.kr)만 가입 가능합니다.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { name: form.name, department: form.department, student_id: form.student_id, phone: form.phone }
      }
    });

    if (error) { setError(error.message); setLoading(false); return; }
    setSuccess(true);
  };

  if (success) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "var(--bg)" }}>
        <div style={{ textAlign: "center", maxWidth: "400px" }}>
          <div style={{ fontSize: "60px", marginBottom: "20px" }}>✅</div>
          <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "12px" }}>이메일 인증을 완료해주세요!</h2>
          <p style={{ color: "var(--text-muted)", lineHeight: "1.7", marginBottom: "24px" }}>
            {form.email}로 인증 메일을 보냈습니다.<br />메일의 링크를 클릭한 후 로그인하세요.
          </p>
          <Link href="/auth/login"><button className="btn-primary">로그인하기</button></Link>
        </div>
      </div>
    );
  }

  const fields = [
    { k: "name", label: "이름", type: "text", placeholder: "홍길동" },
    { k: "student_id", label: "학번", type: "text", placeholder: "2024000000" },
    { k: "department", label: "학과", type: "text", placeholder: "컴퓨터공학과" },
    { k: "phone", label: "연락처", type: "tel", placeholder: "010-0000-0000" },
    { k: "email", label: "학교 이메일", type: "email", placeholder: "student@cbnu.ac.kr" },
    { k: "password", label: "비밀번호", type: "password", placeholder: "8자 이상" },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "var(--bg)" }}>
      <div style={{ width: "100%", maxWidth: "440px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎓</div>
          <h1 style={{ fontSize: "26px", fontWeight: "800", marginBottom: "8px" }}>회원가입</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>학교 이메일로 가입 후 인증이 필요합니다</p>
        </div>
        <div className="card" style={{ padding: "28px" }}>
          <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {fields.map(f => (
              <div key={f.k}>
                <label style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>{f.label}</label>
                <input className="input" type={f.type} placeholder={f.placeholder}
                  value={(form as any)[f.k]} onChange={set(f.k)} required />
              </div>
            ))}
            <div style={{
              display: "flex", alignItems: "center", gap: "10px", padding: "12px",
              background: "rgba(59,130,246,0.05)", borderRadius: "10px", border: "1px solid rgba(59,130,246,0.2)"
            }}>
              <input type="checkbox" id="is_president" checked={form.is_president} onChange={set("is_president")}
                style={{ width: "16px", height: "16px", cursor: "pointer" }} />
              <label htmlFor="is_president" style={{ fontSize: "13px", cursor: "pointer", lineHeight: "1.4" }}>
                <strong>저는 동아리 회장입니다</strong><br />
                <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>체크 시 동아리 개설 권한이 부여됩니다</span>
              </label>
            </div>
            {error && <p style={{ color: "var(--danger)", fontSize: "13px" }}>{error}</p>}
            <button className="btn-primary" type="submit" disabled={loading} style={{ height: "44px", marginTop: "4px" }}>
              {loading ? "가입 중..." : "가입하기"}
            </button>
          </form>
          <p style={{ textAlign: "center", marginTop: "16px", fontSize: "13px", color: "var(--text-muted)" }}>
            이미 계정이 있으신가요? <Link href="/auth/login" style={{ color: "var(--primary-light)" }}>로그인</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
