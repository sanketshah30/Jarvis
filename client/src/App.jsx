import { useEffect, useMemo, useRef, useState } from "react";

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:4000";

function toTitle(text = "") {
  return text.replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function App() {
  const [mission, setMission] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [showCeoResponse, setShowCeoResponse] = useState(true);
  const [orgConfig, setOrgConfig] = useState(null);
  const [typedKickoffMessage, setTypedKickoffMessage] = useState("");
  const [activityTick, setActivityTick] = useState(0);
  const recognitionRef = useRef(null);
  const streamAbortRef = useRef(null);
  const streamSessionIdRef = useRef(null);
  const missionInputRef = useRef(null);
  const speechBaseRef = useRef("");

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) || null,
    [sessions, activeSessionId]
  );
  const executives = useMemo(
    () => activeSession?.result?.executives || Object.values(activeSession?.liveExecutives || {}),
    [activeSession]
  );
  const topologyExecutives = useMemo(() => {
    if (executives.length > 0) return executives;
    if (!orgConfig?.executives) return [];
    return orgConfig.executives.map((exec) => ({
      id: exec.id,
      name: exec.name,
      title: exec.title,
      specialists: (exec.subordinates || [])
        .map((id) => orgConfig.specialists?.find((sp) => sp.id === id))
        .filter(Boolean)
    }));
  }, [executives, orgConfig]);

  function cleanModelText(text = "") {
    return text.replace(/\*\*/g, "").replace(/^#{1,6}\s*/gm, "").trim();
  }

  function activityFromPayload(payload) {
    if (payload.type === "mission_started") return "Mission received";
    if (payload.type === "routing_completed") return "CEO selected the right team";
    if (payload.type === "ceo_initial_started") return "Let's start";
    if (payload.type === "ceo_initial_completed") return "Plan direction set";
    if (payload.type === "executive_started") return `${payload.executiveName} is planning`;
    if (payload.type === "executive_completed") return `${payload.executiveName} finalized branch plan`;
    if (payload.type === "specialist_started") return "IC agents are working in parallel...";
    if (payload.type === "specialist_completed") return `${payload.specialistName} finished`;
    if (payload.type === "ceo_final_started") return "Now I got everything. Here's what I think";
    if (payload.type === "mission_completed") return "Final response ready";
    if (payload.type === "mission_cancelled") return "Mission cancelled.";
    return toTitle(payload.type);
  }

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }

    setVoiceSupported(true);
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += `${event.results[i][0].transcript} `;
      }
      if (transcript.trim()) {
        setMission(`${speechBaseRef.current} ${transcript}`.trim());
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    fetch(`${apiBase}/api/org`)
      .then((res) => res.json())
      .then((data) => setOrgConfig(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const message = activeSession?.status === "running" ? activeSession.kickoffMessage || "" : "";
    if (!message) {
      setTypedKickoffMessage("");
      return;
    }
    let i = 0;
    setTypedKickoffMessage("");
    const timer = setInterval(() => {
      i += 1;
      setTypedKickoffMessage(message.slice(0, i));
      if (i >= message.length) clearInterval(timer);
    }, 24);
    return () => clearInterval(timer);
  }, [activeSession?.kickoffMessage, activeSession?.status, activeSessionId]);

  useEffect(() => {
    if (!activeSession || activeSession.status !== "running" || (activeSession.activities || []).length <= 1) {
      return undefined;
    }
    const uniqueCount = new Set(activeSession.activities || []).size;
    if (uniqueCount <= 1) {
      return undefined;
    }
    const interval = setInterval(() => {
      setActivityTick((prev) => prev + 1);
    }, 1700);
    return () => clearInterval(interval);
  }, [activeSession?.id, activeSession?.status, activeSession?.activities?.length]);

  function toggleVoiceCapture() {
    if (!voiceSupported || !recognitionRef.current) {
      setError("Voice mode is not supported in this browser.");
      return;
    }

    setError("");
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    speechBaseRef.current = mission.trim();
    recognitionRef.current.start();
    setIsListening(true);
  }

  async function runMission(event) {
    if (event) event.preventDefault();
    setError("");

    if (!mission.trim()) {
      setError("Mission is required.");
      return;
    }

    const sessionId = `session-${Date.now()}`;
    const currentMission = mission.trim();
    const previousMemory = (activeSession?.result?.final || "").trim().slice(0, 5000);
    const session = {
      id: sessionId,
      mission: currentMission,
      createdAt: new Date().toISOString(),
      status: "running",
      kickoffMessage: "Alright my team, let's build a plan.",
      ceoFinalStarted: false,
      activeAgents: { ceo: true },
      currentActivity: "CEO is understanding the mission...",
      activities: ["CEO is understanding the mission..."],
      activityTickerKey: 1,
      progressDone: 0,
      progressTotal: 1,
      progressPercent: 0,
      progressEvents: [],
      liveExecutives: {},
      result: null
    };

    setSessions((prev) => [session, ...prev]);
    setActiveSessionId(sessionId);

    setLoading(true);
    streamAbortRef.current?.abort();
    streamSessionIdRef.current = sessionId;
    const abortController = new AbortController();
    streamAbortRef.current = abortController;

    const updateSession = (updater) => {
      setSessions((prev) => prev.map((item) => (item.id === sessionId ? updater(item) : item)));
    };

    const handlePayload = (payload) => {
      updateSession((item) => {
        let next = {
          ...item,
          progressEvents: [...item.progressEvents, payload]
        };

        // Estimate total units after routing to drive progress bar.
        if (payload.type === "routing_completed") {
          const executiveIds = payload.executives || [];
          const specialistsCount = executiveIds.reduce((sum, id) => {
            const exec = orgConfig?.executives?.find((e) => e.id === id);
            return sum + (exec?.subordinates?.length || 0);
          }, 0);
          // ceo-initial + specialist completions + executive completions + ceo-final
          next.progressTotal = Math.max(1 + specialistsCount + executiveIds.length + 1, 1);
        }

        if (payload.type === "ceo_initial_started") {
          next.activeAgents = { ...next.activeAgents, ceo: true };
        }

        if (payload.type === "ceo_initial_completed") {
          next.activeAgents = { ...next.activeAgents, ceo: false };
        }

        if (payload.type === "executive_started") {
          next.activeAgents = { ...next.activeAgents, [payload.executiveId]: true };
        }

        if (payload.type === "executive_completed") {
          next.activeAgents = { ...next.activeAgents, [payload.executiveId]: false };
        }

        if (payload.type === "specialist_started") {
          next.activeAgents = { ...next.activeAgents, [payload.specialistId]: true };
        }

        if (payload.type === "specialist_completed") {
          next.activeAgents = { ...next.activeAgents, [payload.specialistId]: false };
        }

        if (payload.type === "ceo_final_started") {
          next.activeAgents = { ...next.activeAgents, ceo: true };
        }

        if (payload.type === "mission_completed" || payload.type === "mission_cancelled") {
          next.activeAgents = {};
        }

        const completeTypes = new Set([
          "ceo_initial_completed",
          "specialist_completed",
          "executive_completed",
          "mission_completed"
        ]);
        if (completeTypes.has(payload.type)) {
          next.progressDone = Math.min((next.progressDone || 0) + 1, next.progressTotal || 1);
        }
        next.progressPercent = Math.min(
          100,
          Math.round(((next.progressDone || 0) / Math.max(next.progressTotal || 1, 1)) * 100)
        );

        const activity = activityFromPayload(payload);
        next.activities = [...(next.activities || []), activity].slice(-5);
        next.currentActivity = activity;
        next.activityTickerKey = (next.activityTickerKey || 0) + 1;

        return next;
      });

      if (payload.type === "executive_started") {
        updateSession((item) => ({
          ...item,
          liveExecutives: {
            ...item.liveExecutives,
            [payload.executiveId]: {
              id: payload.executiveId,
              name: payload.executiveName,
              title: payload.executiveId.toUpperCase(),
              output: "Running executive synthesis...",
              specialists: []
            }
          }
        }));
      }

      if (payload.type === "specialist_started") {
        updateSession((item) => {
          const executive = item.liveExecutives[payload.executiveId];
          if (!executive) return item;
          const specialists = [
            ...executive.specialists.filter((sp) => sp.id !== payload.specialistId),
            {
              id: payload.specialistId,
              name: payload.specialistName,
              title: payload.specialistId.toUpperCase(),
              output: "Running...",
              status: "running"
            }
          ];
          return {
            ...item,
            liveExecutives: {
              ...item.liveExecutives,
              [payload.executiveId]: { ...executive, specialists }
            }
          };
        });
      }

      if (payload.type === "specialist_completed") {
        updateSession((item) => {
          const executive = item.liveExecutives[payload.executiveId];
          if (!executive) return item;
          const specialists = [
            ...executive.specialists.filter((sp) => sp.id !== payload.specialistId),
            {
              id: payload.specialistId,
              name: payload.specialistName,
              title: payload.specialistId.toUpperCase(),
              output: payload.output,
              status: "done"
            }
          ];
          return {
            ...item,
            liveExecutives: {
              ...item.liveExecutives,
              [payload.executiveId]: { ...executive, specialists }
            }
          };
        });
      }

      if (payload.type === "executive_completed") {
        updateSession((item) => ({
          ...item,
          liveExecutives: {
            ...item.liveExecutives,
            [payload.executiveId]: {
              id: payload.executiveId,
              name: payload.executiveName,
              title: payload.executiveId.toUpperCase(),
              output: payload.output,
              specialists: payload.specialists || []
            }
          }
        }));
      }

      if (payload.type === "mission_completed") {
        updateSession((item) => ({
          ...item,
          status: "done",
          result: payload.result
        }));
        setLoading(false);
        streamAbortRef.current = null;
      }

      if (payload.type === "ceo_final_started") {
        updateSession((item) => ({
          ...item,
          ceoFinalStarted: true
        }));
      }

      if (payload.type === "ceo_message" && payload.message) {
        updateSession((item) => ({
          ...item,
          kickoffMessage: payload.message
        }));
      }

      if (payload.type === "mission_failed") {
        setError(payload.error || "Mission execution failed");
        updateSession((item) => ({
          ...item,
          status: "failed"
        }));
        setLoading(false);
        streamAbortRef.current = null;
      }

      if (payload.type === "mission_cancelled") {
        updateSession((item) => ({
          ...item,
          status: "cancelled"
        }));
        setLoading(false);
        streamAbortRef.current = null;
      }
    };

    try {
      const response = await fetch(`${apiBase}/api/mission/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mission: currentMission,
          memory: previousMemory,
          sessionId
        }),
        signal: abortController.signal
      });

      if (!response.ok || !response.body) {
        throw new Error("Streaming connection failed.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() || "";

        for (const chunk of chunks) {
          const dataLine = chunk
            .split("\n")
            .find((line) => line.startsWith("data: "));
          if (!dataLine) continue;

          const payloadText = dataLine.slice(6).trim();
          if (!payloadText) continue;

          try {
            const payload = JSON.parse(payloadText);
            handlePayload(payload);
          } catch (_err) {
            // Ignore malformed/non-JSON stream chunks.
          }
        }
      }
    } catch (err) {
      if (err?.name === "AbortError") return;
      setError(err?.message || "Streaming connection failed.");
      setLoading(false);
    }
  }

  useEffect(() => {
    return () => {
      streamAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const el = missionInputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [mission, sessions.length]);

  async function cancelMission() {
    const sessionId = streamSessionIdRef.current || activeSessionId;
    if (!sessionId) return;
    try {
      await fetch(`${apiBase}/api/mission/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
      });
    } catch (_err) {}

    setSessions((prev) =>
      prev.map((item) =>
        item.id === sessionId
          ? {
              ...item,
              status: "cancelled",
              progressEvents: [
                ...item.progressEvents,
                { type: "mission_cancelled", timestamp: new Date().toISOString() }
              ]
            }
          : item
      )
    );
    streamAbortRef.current?.abort();
    setLoading(false);
  }

  function handleMissionKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!loading) {
        runMission();
      }
    }
  }

  const hasExecuted = sessions.length > 0;

  return (
    <div className={`layout ${hasExecuted ? "executed" : ""}`}>
      <aside className="sidebar">
        <header className="header">
          <div className="badge">JARVIS SYSTEM</div>
          <h1>Neural Command Portal</h1>
          <p>Tell me what's on your mind?</p>
        </header>

        <section className="chat-panel">
          <form className="mission-form" onSubmit={runMission}>
            <div className="toolbar">
              <span className="input-label">Mission Input</span>
            </div>
            <textarea
              id="mission"
              className="mission-input"
              ref={missionInputRef}
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              onKeyDown={handleMissionKeyDown}
              placeholder={isListening ? "Listening... speak now" : "Describe the mission for Jarvis..."}
              rows={2}
            />
            <div className="action-row">
              <button type="submit" className="run-btn" disabled={loading}>
                {loading ? "Running..." : "Run Mission"}
              </button>
              {loading && (
                <button type="button" className="cancel-btn" onClick={cancelMission}>
                  Cancel
                </button>
              )}
              <button
                type="button"
                className={`voice-icon-btn ${isListening ? "live" : ""}`}
                onClick={toggleVoiceCapture}
                disabled={!voiceSupported}
                title={voiceSupported ? "Toggle voice input" : "Voice not supported"}
              >
                🎤
              </button>
            </div>
          </form>

          {sessions.length > 0 && (
            <h2>Conversation Thread</h2>
          )}
          {sessions.length > 0 && (
            <div className="thread-list">
              {sessions.map((session) => (
                <button
                  type="button"
                  key={session.id}
                  className={`thread-item ${session.id === activeSessionId ? "active" : ""}`}
                  onClick={() => {
                    setActiveSessionId(session.id);
                    setMission(session.mission);
                  }}
                >
                  <span className={`dot ${session.status}`} />
                  <span className="thread-text">{session.mission}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </aside>

      <main className="main">
        {error && <div className="error">{error}</div>}

        {activeSession && (
          <>
            {activeSession.status === "running" && (
              <div className="kickoff-banner">{typedKickoffMessage}</div>
            )}
            <section className="tree-panel">
              <h2>Entity Topology</h2>
              <div className="topology-board">
                <div className="topology-ceo">
                  <span className={`node ceo ${activeSession.activeAgents?.ceo ? "active" : ""}`}>CEO</span>
                </div>
                <div className="topology-executives">
                  {topologyExecutives.map((exec) => (
                    <div key={exec.id} className="topology-branch">
                      <span className={`node cxo ${activeSession.activeAgents?.[exec.id] ? "active" : ""}`}>
                        {exec.id.toUpperCase()}
                      </span>
                      <div className="branch-line" />
                      <div className="topology-ics">
                        {(exec.specialists || []).map((sp) => (
                          <span
                            key={sp.id}
                            className={`node ic ${activeSession.activeAgents?.[sp.id] ? "active" : ""}`}
                          >
                            {sp.id.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {activeSession.progressEvents.length > 0 && (
              <section className="progress">
                <div className="progress-meter">
                  <div
                    className="progress-fill"
                    style={{ width: `${activeSession.progressPercent || 0}%` }}
                  />
                </div>
                <div className="progress-meta">{activeSession.progressPercent || 0}% complete</div>
                {(activeSession.progressPercent || 0) < 100 && (
                  <div className="activity-carousel" key={`${activeSession.activityTickerKey || 0}-${activityTick}`}>
                    {(activeSession.activities || []).length > 0
                      ? activeSession.activities[activityTick % activeSession.activities.length]
                      : activeSession.currentActivity || "Starting mission..."}
                  </div>
                )}
              </section>
            )}

            <section className="result">
              <div className="section-head">
                <h2>Final CEO Response</h2>
                <button
                  type="button"
                  className="text-toggle"
                  onClick={() => setShowCeoResponse((prev) => !prev)}
                >
                  {showCeoResponse ? "Hide" : "Show"}
                </button>
              </div>
              {showCeoResponse && activeSession.result?.final && (
                <div className="final-response">{cleanModelText(activeSession.result.final)}</div>
              )}
              {showCeoResponse && !activeSession.result?.final && activeSession.ceoFinalStarted && (
                <div className="final-response final-pending">Generating final response...</div>
              )}

              <div className="section-head">
                <h2>CXO Branches and Subordinates</h2>
              </div>
              <div className="cxo-list">
                {executives.map((exec) => (
                  <details key={exec.id} className="cxo-item" open>
                    <summary className="cxo-summary">
                      <span>{exec.name}</span>
                      <span className="cxo-role">{exec.title}</span>
                    </summary>
                    <div className="cxo-content">
                      <div className="exec-output">{cleanModelText(exec.output || "")}</div>
                      <div className="ic-list">
                        {(exec.specialists || []).map((sp) => (
                          <details key={sp.id} className="ic-item">
                            <summary>
                              {sp.name} ({sp.title || sp.id.toUpperCase()})
                            </summary>
                            <div className="ic-output">{cleanModelText(sp.output || "")}</div>
                          </details>
                        ))}
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
