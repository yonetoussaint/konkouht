import { Trophy, Check } from "lucide-react";
import EntityAvatar from "./EntityAvatar";
import { fmtMatchdayDate } from "./utils";

// Poules → 8e de finale → Quart → Demi → Finale, built from the same
// registrant/points pool as Classement. Shown in every phase (falls back
// to generated mock contestants when there aren't 2+ real registrants
// yet). See buildMockBracket (in ./utils) for how rounds/winners are
// derived — no persisted round/match data behind this yet.
export default function Bracket({ bracket, bracketCurrentRound, accent, isCompleted, isRegistration }) {
  if (!bracket) return null;

  return (
    <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "14px 16px" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
        color: "#888", textTransform: "uppercase", letterSpacing: "0.1em",
      }}>
        <Trophy size={13} strokeWidth={2.5} />
        Parcours du tournoi
      </div>
      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#999", padding: "4px 0 10px" }}>
        {isCompleted
          ? "Bracket final, du premier tour au sacre."
          : isRegistration
          ? "Aperçu du bracket — les inscriptions déterminent qui l'occupe."
          : "Progression simulée à partir du classement actuel."}
      </div>

      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6 }}>
        {bracket.map((round, roundIdx) => {
          const roundState = roundIdx < bracketCurrentRound ? "done" : roundIdx === bracketCurrentRound ? "current" : "upcoming";
          return (
            <div key={round.name} style={{ flexShrink: 0, width: 168, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                padding: "6px 8px", borderRadius: 999,
                background: roundState === "current" ? `${accent}1a` : "#f4f4f4",
                border: roundState === "current" ? `1px solid ${accent}` : "1px solid #e6e6e6",
              }}>
                {roundState === "done" && <Check size={11} strokeWidth={3} color="#00A86B" />}
                <span style={{
                  fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 800,
                  color: roundState === "current" ? accent : roundState === "done" ? "#666" : "#aaa",
                  textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap",
                }}>
                  {round.name}
                </span>
              </div>

              {round.type === "groups" ? (
                round.groups.map((group, gi) => (
                  <div key={gi} style={{ background: "#f8f7fc", borderRadius: 8, padding: "6px 8px" }}>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                      Groupe {String.fromCharCode(65 + gi)}
                    </div>
                    {group.map((p) => {
                      const qualified = round.qualifiers.includes(p);
                      return (
                        <div key={p.id ?? p.index} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0" }}>
                          <div style={{ width: 16, height: 16, borderRadius: "50%", overflow: "hidden", flexShrink: 0, opacity: qualified ? 1 : 0.4 }}>
                            <EntityAvatar url={p.avatarUrl} name={p.name} />
                          </div>
                          <span style={{
                            flex: 1, minWidth: 0, fontFamily: "Inter, sans-serif", fontSize: 10.5,
                            fontWeight: qualified ? 700 : 500, color: qualified ? "#222" : "#aaa",
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          }}>{p.name}</span>
                          {qualified && <Check size={10} strokeWidth={3} color="#00A86B" style={{ flexShrink: 0 }} />}
                        </div>
                      );
                    })}
                  </div>
                ))
              ) : round.type === "roundrobin" ? (
                round.matchdays.map((matchday, di) => (
                  <div key={di} style={{ background: "#f8f7fc", borderRadius: 8, padding: "6px 8px" }}>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                      J{di + 1} · {fmtMatchdayDate(matchday.date)}
                    </div>
                    {matchday.matches.map((m, mi) => (
                      <div
                        key={mi}
                        style={{
                          display: "flex", flexDirection: "column", gap: 2, padding: "5px 0",
                          borderTop: mi > 0 ? "1px solid #ece9f7" : "none",
                        }}
                      >
                        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 8, fontWeight: 700, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          Groupe {String.fromCharCode(65 + m.groupIndex)}
                        </div>
                        {[m.a, m.b].map((p) => {
                          const won = p === m.winner;
                          return (
                            <div key={p.id ?? p.index} style={{ display: "flex", alignItems: "center", gap: 6, padding: "1px 0" }}>
                              <div style={{ width: 14, height: 14, borderRadius: "50%", overflow: "hidden", flexShrink: 0, opacity: won ? 1 : 0.5 }}>
                                <EntityAvatar url={p.avatarUrl} name={p.name} />
                              </div>
                              <span style={{
                                flex: 1, minWidth: 0, fontFamily: "Inter, sans-serif", fontSize: 10,
                                fontWeight: won ? 700 : 500, color: won ? "#222" : "#aaa",
                                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                              }}>{p.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                round.matches.map((m, mi) => (
                  <div key={mi} style={{ background: "#f8f7fc", borderRadius: 8, padding: "6px 8px" }}>
                    {[m.a, m.b].map((p) => {
                      const won = p === m.winner;
                      return (
                        <div key={p.id ?? p.index} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0" }}>
                          <div style={{ width: 18, height: 18, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: won ? `1.5px solid ${accent}` : "none", opacity: won ? 1 : 0.5 }}>
                            <EntityAvatar url={p.avatarUrl} name={p.name} />
                          </div>
                          <span style={{
                            flex: 1, minWidth: 0, fontFamily: "Inter, sans-serif", fontSize: 10.5,
                            fontWeight: won ? 700 : 500, color: won ? "#222" : "#aaa",
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          }}>{p.name}</span>
                          {won && round.name === "Finale" && <span style={{ fontSize: 11, flexShrink: 0 }}>🏆</span>}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
