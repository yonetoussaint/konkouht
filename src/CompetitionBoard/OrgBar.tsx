import { useState } from "react";
import { BadgeCheck, Check, Bell } from "lucide-react";
import { fmtVotes } from "../App";

export default function OrgBar({ comp, accent }) {
  const [orgFollowed, setOrgFollowed] = useState(false);
  const [orgFollowerCount, setOrgFollowerCount] = useState(comp.followers);
  return (
    <div style={{
      background: "#fff",
      borderBottom: "1px solid #e0e0e0",
      padding: "12px 8px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      maxWidth: 800, margin: "0 auto",
      boxSizing: "border-box", width: "100%",
      position: "relative", left: "50%", transform: "translateX(-50%)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: "50%",
          background: accent, color: "#fff",
          fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          {comp.organisateur.charAt(0)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#111", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
            {comp.organisateur}
            <BadgeCheck size={13} strokeWidth={2.5} color={accent} />
          </span>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", fontWeight: 500 }}>
            {fmtVotes(orgFollowerCount)} abonnés
          </span>
        </div>
      </div>
      <button
        onClick={() => {
          const wasFollowed = orgFollowed;
          setOrgFollowed(!wasFollowed);
          setOrgFollowerCount((c) => wasFollowed ? c - 1 : c + 1);
        }}
        style={{
          border: `1px solid ${orgFollowed ? "#111" : accent}`,
          background: orgFollowed ? "#111" : "transparent",
          color: orgFollowed ? "#fff" : accent,
          fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
          letterSpacing: "0.08em", textTransform: "uppercase",
          padding: "6px 14px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 5,
          transition: "background 0.15s, color 0.15s, border-color 0.15s",
        }}
      >{orgFollowed
        ? <><Check size={11} strokeWidth={3} /> Abonné</>
        : <><Bell size={11} strokeWidth={2.5} /> S'abonner</>
      }</button>
    </div>
  );
}
