"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

type Post = { id: string; title: string; content: string; type: string; created_at: string; profiles: { name: string } };
type Member = { id: string; role: string; profiles: { name: string; department: string; student_id: string } };

const ROLE_LABEL: Record<string, string> = { president: "회장", executive: "임원진", member: "일반 부원", alumni: "졸업생", exchange_student: "교환학생" };
const EMOJI: Record<string, string> = { 학술: "📚", 체육: "⚽", 문화예술: "🎨", 봉사: "🤝", 취미: "🎯" };

export default function ClubDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [club, setClub] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [myMembership, setMyMembership] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [tab, setTab] = useState<"posts" | "members" | "fees" | "subgroups" | "logs">("posts");
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [isPresidentJoin, setIsPresidentJoin] = useState(false);
  const [applying, setApplying] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "", type: "general" as string });
  const [showPostForm, setShowPostForm] = useState(false);
  const [feeRecords, setFeeRecords] = useState<any[]>([]);
  const [newFee, setNewFee] = useState({ amount: 0, description: "" });
  const [showFeeForm, setShowFeeForm] = useState(false);
  const [subgroups, setSubgroups] = useState<any[]>([]);
  const [newSubgroup, setNewSubgroup] = useState({ name: "", description: "" });
  const [showSubgroupForm, setShowSubgroupForm] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [newLog, setNewLog] = useState({ title: "", content: "" });
  const [showLogForm, setShowLogForm] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      const { data: clubData } = await supabase.from("clubs").select("*, profiles(name)").eq("id", id).single();
      setClub(clubData);
      if (user) {
        const { data: mem } = await supabase.from("memberships").select("*").eq("club_id", id).eq("user_id", user.id).maybeSingle();
        setMyMembership(mem);
      }
      const { data: postData } = await supabase.from("posts").select("*, profiles(name)").eq("club_id", id).order("created_at", { ascending: false });
      setPosts((postData as any) || []);
      setLoading(false);
    };
    init();
  }, [id]);

  const loadMembers = async () => {
    const { data } = await supabase.from("memberships").select("*, profiles(name, department, student_id)").eq("club_id", id).eq("status", "approved").order("role");
    setMembers((data as any) || []);
  };
  const loadFees = async () => {
    const { data } = await supabase.from("fee_records").select("*, profiles(name)").eq("club_id", id).order("created_at", { ascending: false });
    setFeeRecords(data || []);
  };
  const loadSubgroups = async () => {
    const { data } = await supabase.from("subgroups").select("*, profiles(name)").eq("club_id", id);
    setSubgroups(data || []);
  };
  const loadLogs = async () => {
    const { data } = await supabase.from("activity_logs").select("*, profiles(name)").eq("club_id", id).order("log_date", { ascending: false });
    setLogs(data || []);
  };

  useEffect(() => {
    if (tab === "members") loadMembers();
    if (tab === "fees") loadFees();
    if (tab === "subgroups") loadSubgroups();
    if (tab === "logs") loadLogs();
  }, [tab]);

  const applyToJoin = async () => {
    if (!user) { router.push("/auth/login"); return; }
    setApplying(true);
    await supabase.from("memberships").insert({ club_id: id as string, user_id: user.id, role: "member", status: "pending" });
    setMyMembership({ status: "pending", role: "member" });
    setShowJoinModal(false);
    setApplying(false);
  };

  const submitPost = async () => {
    if (!newPost.title || !newPost.content) return;
    await supabase.from("posts").insert({ ...newPost, club_id: id as string, author_id: user.id });
    setNewPost({ title: "", content: "", type: "general" });
    setShowPostForm(false);
    const { data } = await supabase.from("posts").select("*, profiles(name)").eq("club_id", id).order("created_at", { ascending: false });
    setPosts((data as any) || []);
  };

  const submitFee = async () => {
    if (!newFee.description) return;
    await supabase.from("fee_records").insert({ ...newFee, club_id: id as string, uploaded_by: user.id });
    setNewFee({ amount: 0, description: "" });
    setShowFeeForm(false);
    loadFees();
  };

  const submitSubgroup = async () => {
    if (!newSubgroup.name) return;
    await supabase.from("subgroups").insert({ ...newSubgroup, club_id: id as string, created_by: user.id });
    setNewSubgroup({ name: "", description: "" });
    setShowSubgroupForm(false);
    loadSubgroups();
  };

  const submitLog = async () => {
    if (!newLog.title || !newLog.content) return;
    await supabase.from("activity_logs").insert({ ...newLog, club_id: id as string, author_id: user.id });
    setNewLog({ title: "", content: "" });
    setShowLogForm(false);
    loadLogs();
  };

  const isMember = myMembership?.status === "approved";
  const isPresident = myMembership?.role === "president" && isMember;
  const isExecutive = (myMembership?.role === "president" || myMembership?.role === "executive") && isMember;

  const POST_TYPE_LABEL: Record<string, string> = { announcement: "📢 공지", survey: "📊 수요조사", general: "💬 일반" };
  const tabList = [
    { key: "posts", label: "게시판" },
    { key: "members", label: "부원" },
    { key: "fees", label: "회비" },
    { key: "subgroups", label: "소모임" },
    { key: "logs", label: "개신로그" },
  ];

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}><p style={{ color: "var(--text-muted)" }}>로딩중...</p></div>;
  if (!club) return <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px", textAlign: "center" }}><p>동아리를 찾을 수 없습니다.</p></div>;

  const totalFees = feeRecords.reduce((sum, f) => sum + f.amount, 0);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(10,15,30,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border)", padding: "0 24px", height: "64px", display: "flex", alignItems: "center", gap: "16px" }}>
        <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "20px" }}>←</Link>
        <span style={{ fontWeight: "800", fontSize: "17px" }}>{club.name}</span>
      </nav>

      {/* Club Header */}
      <div style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.05))", padding: "40px 24px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", gap: "24px", alignItems: "flex-start" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "20px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px", flexShrink: 0 }}>
            {EMOJI[club.category] || "🎓"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
              <span className={`badge ${club.is_recruiting ? "badge-green" : "badge-gray"}`}>{club.is_recruiting ? "모집중" : "모집마감"}</span>
              <span className="badge badge-blue">{club.category}</span>
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: "900", marginBottom: "8px" }}>{club.name}</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "15px", lineHeight: "1.6", marginBottom: "12px" }}>{club.description}</p>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>👑 회장: {club.profiles?.name} · 👥 {club.member_count}명</p>
          </div>
          <div>
            {!user ? (
              <Link href="/auth/login"><button className="btn-primary">로그인 후 가입</button></Link>
            ) : !myMembership ? (
              <button className="btn-primary" onClick={() => setShowJoinModal(true)}>가입 신청</button>
            ) : myMembership.status === "pending" ? (
              <span className="badge badge-yellow" style={{ padding: "10px 16px" }}>승인 대기중</span>
            ) : myMembership.status === "rejected" ? (
              <span className="badge badge-red" style={{ padding: "10px 16px" }}>가입 거절됨</span>
            ) : (
              <span className="badge badge-green" style={{ padding: "10px 16px" }}>✓ 가입됨 ({ROLE_LABEL[myMembership.role]})</span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px" }}>
        <div style={{ display: "flex", gap: "4px", marginBottom: "24px", background: "var(--bg-card)", padding: "4px", borderRadius: "12px", border: "1px solid var(--border)" }}>
          {tabList.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)} style={{
              flex: 1, padding: "10px", borderRadius: "9px", border: "none", cursor: "pointer",
              background: tab === t.key ? "var(--primary)" : "transparent",
              color: tab === t.key ? "white" : "var(--text-muted)",
              fontWeight: "600", fontSize: "13px", transition: "all 0.2s"
            }}>{t.label}</button>
          ))}
        </div>

        {/* POSTS TAB */}
        {tab === "posts" && (
          <div>
            {isMember && (
              <div style={{ marginBottom: "20px" }}>
                {showPostForm ? (
                  <div className="card" style={{ padding: "20px" }}>
                    <select className="input" value={newPost.type} onChange={e => setNewPost(p => ({ ...p, type: e.target.value }))} style={{ marginBottom: "10px" }}>
                      <option value="general">💬 일반</option>
                      <option value="announcement">📢 공지</option>
                      <option value="survey">📊 수요조사</option>
                    </select>
                    <input className="input" placeholder="제목" value={newPost.title} onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))} style={{ marginBottom: "10px" }} />
                    <textarea className="input" placeholder="내용" value={newPost.content} onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))} style={{ height: "120px", resize: "vertical" }} />
                    <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                      <button className="btn-primary" onClick={submitPost}>게시하기</button>
                      <button className="btn-secondary" onClick={() => setShowPostForm(false)}>취소</button>
                    </div>
                  </div>
                ) : (
                  <button className="btn-primary" onClick={() => setShowPostForm(true)}>+ 새 게시물</button>
                )}
              </div>
            )}
            {posts.length === 0 ? (
              <div className="card" style={{ padding: "60px", textAlign: "center" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>📝</div>
                <p style={{ color: "var(--text-muted)" }}>게시물이 없습니다</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {posts.map(p => (
                  <div key={p.id} className="card" style={{ padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{POST_TYPE_LABEL[p.type]}</span>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{p.profiles?.name} · {new Date(p.created_at).toLocaleDateString("ko-KR")}</span>
                    </div>
                    <h3 style={{ fontWeight: "700", marginBottom: "8px" }}>{p.title}</h3>
                    <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6" }}>{p.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MEMBERS TAB */}
        {tab === "members" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {members.map(m => (
              <div key={m.id} className="card" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>👤</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "600" }}>{m.profiles?.name}</div>
                  <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>{m.profiles?.department} · {m.profiles?.student_id}</div>
                </div>
                <span className={`badge ${m.role === "president" ? "badge-yellow" : m.role === "executive" ? "badge-blue" : "badge-gray"}`}>
                  {ROLE_LABEL[m.role]}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* FEES TAB */}
        {tab === "fees" && (
          <div>
            {isMember && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div className="card" style={{ padding: "16px 24px", display: "inline-flex", gap: "12px", alignItems: "center" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>총 잔액</span>
                  <span style={{ fontWeight: "800", fontSize: "22px", color: totalFees >= 0 ? "var(--success)" : "var(--danger)" }}>
                    {totalFees.toLocaleString()}원
                  </span>
                </div>
                {isExecutive && (
                  <button className="btn-primary" onClick={() => setShowFeeForm(!showFeeForm)}>+ 내역 추가</button>
                )}
              </div>
            )}
            {showFeeForm && (
              <div className="card" style={{ padding: "20px", marginBottom: "16px" }}>
                <input className="input" type="number" placeholder="금액 (음수: 지출)" value={newFee.amount} onChange={e => setNewFee(f => ({ ...f, amount: Number(e.target.value) }))} style={{ marginBottom: "10px" }} />
                <input className="input" placeholder="내용 (예: 회비 수납, 행사비 지출)" value={newFee.description} onChange={e => setNewFee(f => ({ ...f, description: e.target.value }))} style={{ marginBottom: "10px" }} />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="btn-primary" onClick={submitFee}>등록</button>
                  <button className="btn-secondary" onClick={() => setShowFeeForm(false)}>취소</button>
                </div>
              </div>
            )}
            {!isMember ? (
              <div className="card" style={{ padding: "40px", textAlign: "center" }}>
                <p style={{ color: "var(--text-muted)" }}>회원만 볼 수 있습니다</p>
              </div>
            ) : feeRecords.length === 0 ? (
              <div className="card" style={{ padding: "60px", textAlign: "center" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>💰</div>
                <p style={{ color: "var(--text-muted)" }}>회비 내역이 없습니다</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {feeRecords.map(f => (
                  <div key={f.id} className="card" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: "600", marginBottom: "4px" }}>{f.description}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{f.profiles?.name} · {new Date(f.created_at).toLocaleDateString("ko-KR")}</div>
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

        {/* SUBGROUPS TAB */}
        {tab === "subgroups" && (
          <div>
            {isExecutive && (
              <div style={{ marginBottom: "20px" }}>
                <button className="btn-primary" onClick={() => setShowSubgroupForm(!showSubgroupForm)}>+ 소모임 만들기</button>
                {showSubgroupForm && (
                  <div className="card" style={{ padding: "20px", marginTop: "12px" }}>
                    <input className="input" placeholder="소모임 이름 (예: 스터디, TF팀)" value={newSubgroup.name} onChange={e => setNewSubgroup(s => ({ ...s, name: e.target.value }))} style={{ marginBottom: "10px" }} />
                    <input className="input" placeholder="소개" value={newSubgroup.description} onChange={e => setNewSubgroup(s => ({ ...s, description: e.target.value }))} style={{ marginBottom: "10px" }} />
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button className="btn-primary" onClick={submitSubgroup}>만들기</button>
                      <button className="btn-secondary" onClick={() => setShowSubgroupForm(false)}>취소</button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {subgroups.length === 0 ? (
              <div className="card" style={{ padding: "60px", textAlign: "center" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>👥</div>
                <p style={{ color: "var(--text-muted)" }}>소모임이 없습니다</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "14px" }}>
                {subgroups.map(s => (
                  <div key={s.id} className="card" style={{ padding: "20px" }}>
                    <div style={{ fontSize: "28px", marginBottom: "10px" }}>🏷️</div>
                    <h3 style={{ fontWeight: "700", marginBottom: "6px" }}>{s.name}</h3>
                    <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>{s.description}</p>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "10px" }}>개설: {s.profiles?.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LOGS TAB */}
        {tab === "logs" && (
          <div>
            {isMember && (
              <div style={{ marginBottom: "20px" }}>
                <button className="btn-primary" onClick={() => setShowLogForm(!showLogForm)}>+ 활동 기록 남기기</button>
                {showLogForm && (
                  <div className="card" style={{ padding: "20px", marginTop: "12px" }}>
                    <input className="input" placeholder="제목" value={newLog.title} onChange={e => setNewLog(l => ({ ...l, title: e.target.value }))} style={{ marginBottom: "10px" }} />
                    <textarea className="input" placeholder="내용" value={newLog.content} onChange={e => setNewLog(l => ({ ...l, content: e.target.value }))} style={{ height: "100px", resize: "vertical", marginBottom: "10px" }} />
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button className="btn-primary" onClick={submitLog}>기록하기</button>
                      <button className="btn-secondary" onClick={() => setShowLogForm(false)}>취소</button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {logs.length === 0 ? (
              <div className="card" style={{ padding: "60px", textAlign: "center" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>📖</div>
                <p style={{ color: "var(--text-muted)" }}>활동 기록이 없습니다</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {logs.map(l => (
                  <div key={l.id} className="card" style={{ padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>📝 {l.profiles?.name}</span>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{new Date(l.log_date).toLocaleDateString("ko-KR")}</span>
                    </div>
                    <h3 style={{ fontWeight: "700", marginBottom: "8px" }}>{l.title}</h3>
                    <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6" }}>{l.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Join Modal */}
      {showJoinModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div className="card" style={{ padding: "32px", maxWidth: "420px", width: "100%" }}>
            <h3 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px" }}>가입 신청</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "20px" }}>{club.name}에 가입하시겠습니까?</p>
            <div style={{ padding: "16px", background: "rgba(59,130,246,0.05)", borderRadius: "10px", border: "1px solid rgba(59,130,246,0.2)", marginBottom: "20px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <input type="checkbox" checked={isPresidentJoin} onChange={e => setIsPresidentJoin(e.target.checked)} style={{ width: "16px", height: "16px" }} />
                <span style={{ fontSize: "13px" }}>
                  <strong>저는 회장입니다</strong><br />
                  <span style={{ color: "var(--text-muted)" }}>체크 시 회장 자격으로 가입합니다</span>
                </span>
              </label>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={applyToJoin} disabled={applying}>
                {applying ? "신청 중..." : "신청하기"}
              </button>
              <button className="btn-secondary" onClick={() => setShowJoinModal(false)}>취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
