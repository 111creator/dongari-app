"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Membership = {
  id: string; club_id: string; role: string; status: string;
  clubs: { name: string; category: string; member_count: number; is_recruiting: boolean; }
};

type Notification = {
  id: string; message: string; type: string; read: boolean; created_at: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [tab, setTab] = useState<"my" | "requests" | "fees" | "logs">("my");
  const [feeRecords, setFeeRecords] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      setUser(user);
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(prof);
      const { data: mem } = await supabase.from("memberships").select("*, clubs(name, category, member_count, is_recruiting)").eq("user_id", user.id).eq("status", "approved");
      setMemberships((mem as any) || []);
      // Pending join requests for clubs I'm president of
      const myClubIds = (mem || []).filter((m: any) => m.role === "president").map((m: any) => m.club_id);
      if (myClubIds.length > 0) {
        const { data: pend } = await supabase.from("memberships").select("*, profiles(name, department, student_id, phone)").in("club_id", myClubIds).eq("status", "pending");
        setPending((pend as any) || []);
      }
      setLoading(false);
    };
    init();
  }, []);

  const loadFees = async () => {
    const clubIds = memberships.map(m => m.club_id);
    if (!clubIds.length) return;
    const { data } = await supabase.from("fee_records").select("*, clubs(name), profiles(name)").in("club_id", clubIds).order("created_at", { ascending: false });
    setFeeRecords(data || []);
  };

  const loadLogs = async () => {
    const clubIds = memberships.map(m => m.club_id);
    if (!clubIds.length) return;
    const { data } = await supabase.from("activity_logs").select("*, clubs(name), profiles(name)").in("club_id", clubIds).order("log_date", { ascending: false });
    setActivityLogs(data || []);
  };

  useEffect(() => {
    if (tab === "fees") loadFees();
    if (tab === "logs") loadLogs();
  }, [tab, memberships]);

  const approveRequest = async (id: string, approve: boolean) => {
    await supabase.from("memberships").update({ status: approve ? "approved" : "rejected" }).eq("id", id);
    setPending(p => p.filter(r => r.id !== id));
  };

  const ROLE_LABEL: Record<string, string> = {
    president: "회장", executive: "임원진", member: "일반 부원",
    alumni: "졸업생", exchange_student: "교환학생"
  };
  const EMOJI: Record<string, string> = { 학술: "📚", 체육: "⚽", 문화예술: "🎨", 봉사: "🤝", 취미: "🎯" };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <p style={{ color: "var(--text-muted)" }}>불러오는 중...</p>
    </div>
  );

  const tabs = [
    { key: "my", label: "내 동아리" },
    { key: "requests", label: `가입 신청 ${pending.length > 0 ? `(${pending.length})` : ""}` },
    { key: "fees", label: "회비 관리" },
    { key: "logs", label: "개신로그" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <nav style={{
        position: "sticky", top: 0, zIndex: 50, background: "rgba(10,15,30,0.95)",
        backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border)",
        padding: "0 24px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <span style={{ fontSize: "22px" }}>🎓</span>
          <span style={{ fontWeight: "800", fontSize: "17px" }}>동아리앱</span>
        </Link>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{profile?.name}</span>
          <button onClick={() => supabase.auth.signOut().then(() => router.push("/"))} className="btn-secondary" style={{ padding: "7px 14px", fontSize: "13px" }}>로그아웃</button>
        </div>
      </nav>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 24px" }}>
        {/* Profile Header */}
        <div className="card" style={{ padding: "24px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{
            width: "64px", height: "64px", borderRadius: "18px",
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "28px", flexShrink: 0
          }}>👤</div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "4px" }}>{profile?.name}</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>{profile?.department} · {profile?.student_id}</p>
          </div>
          <Link href="/clubs/create">
            <button className="btn-primary" style={{ fontSize: "13px" }}>+ 동아리 만들기</button>
          </Link>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "24px", background: "var(--bg-card)", padding: "4px", borderRadius: "12px", border: "1px solid var(--border)" }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)} style={{
              flex: 1, padding: "10px", borderRadius: "9px", border: "none", cursor: "pointer",
              background: tab === t.key ? "var(--primary)" : "transparent",
              color: tab === t.key ? "white" : "var(--text-muted)",
              fontWeight: "600", fontSize: "13px", transition: "all 0.2s"
            }}>{t.label}</button>
          ))}
        </div>

        {/* My Clubs */}
        {tab === "my" && (
          <div>
            {memberships.length === 0 ? (
              <div className="card" style={{ padding: "60px", textAlign: "center" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏠</div>
                <p style={{ color: "var(--text-muted)", marginBottom: "20px" }}>아직 가입한 동아리가 없습니다</p>
                <Link href="/"><button className="btn-primary">동아리 둘러보기</button></Link>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
                {memberships.map(m => (
                  <Link key={m.id} href={`/clubs/${m.club_id}`} style={{ textDecoration: "none" }}>
                    <div className="card" style={{ padding: "20px", cursor: "pointer" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                        <div style={{ fontSize: "32px" }}>{EMOJI[m.clubs.category] || "🎓"}</div>
                        <span className={`badge ${m.role === "president" ? "badge-yellow" : m.role === "executive" ? "badge-blue" : "badge-gray"}`}>
                          {ROLE_LABEL[m.role]}
                        </span>
                      </div>
                      <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "6px" }}>{m.clubs.name}</h3>
                      <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>👥 {m.clubs.member_count}명</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Join Requests */}
        {tab === "requests" && (
          <div>
            {pending.length === 0 ? (
              <div className="card" style={{ padding: "60px", textAlign: "center" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
                <p style={{ color: "var(--text-muted)" }}>처리할 가입 신청이 없습니다</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {pending.map(p => (
                  <div key={p.id} className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "700", marginBottom: "4px" }}>{p.profiles.name}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>{p.profiles.department} · {p.profiles.student_id}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>{p.profiles.phone}</div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button className="btn-primary" style={{ padding: "8px 16px", fontSize: "13px" }} onClick={() => approveRequest(p.id, true)}>승인</button>
                      <button className="btn-secondary" style={{ padding: "8px 16px", fontSize: "13px", borderColor: "var(--danger)", color: "var(--danger)" }} onClick={() => approveRequest(p.id, false)}>거절</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Fee Records */}
        {tab === "fees" && (
          <div>
            {feeRecords.length === 0 ? (
              <div className="card" style={{ padding: "60px", textAlign: "center" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>💰</div>
                <p style={{ color: "var(--text-muted)" }}>회비 내역이 없습니다</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {feeRecords.map(f => (
                  <div key={f.id} className="card" style={{ padding: "18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: "600", marginBottom: "4px" }}>{f.description}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>{f.clubs?.name} · {f.profiles?.name} · {new Date(f.created_at).toLocaleDateString("ko-KR")}</div>
                    </div>
                    <div style={{ fontWeight: "700", fontSize: "16px", color: f.amount > 0 ? "var(--success)" : "var(--danger)" }}>
                      {f.amount > 0 ? "+" : ""}{f.amount.toLocaleString()}원
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Activity Logs */}
        {tab === "logs" && (
          <div>
            {activityLogs.length === 0 ? (
              <div className="card" style={{ padding: "60px", textAlign: "center" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>📖</div>
                <p style={{ color: "var(--text-muted)" }}>활동 기록이 없습니다</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {activityLogs.map(l => (
                  <div key={l.id} className="card" style={{ padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span className="badge badge-blue">{l.clubs?.name}</span>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{new Date(l.log_date).toLocaleDateString("ko-KR")}</span>
                    </div>
                    <h3 style={{ fontWeight: "700", marginBottom: "8px" }}>{l.title}</h3>
                    <p style={{ color: "var(--text-muted)", fontSize: "13px", lineHeight: "1.6" }}>{l.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
