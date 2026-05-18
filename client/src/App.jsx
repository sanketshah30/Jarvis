import { useEffect, useMemo, useRef, useState } from "react";

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function App() {
  const [mission, setMission] = useState("");
  const [voiceMode, setVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const recognitionRef = useRef(null);

  const executives = useMemo(() => result?.executives || [], [result]);

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
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += `${transcript} `;
        }
      }
      if (finalTranscript) {
        setMission((prev) => `${prev}${finalTranscript}`.trim());
      }
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;

    return () => recognitionRef.current?.stop();
  }, []);

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

    recognitionRef.current.start();
    setIsListening(true);
  }

  async function runMission(event) {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!mission.trim()) {
      setError("Mission is required.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${apiBase}/api/mission`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mission: mission.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to run mission");
      }
      setResult(data);
    } catch (err) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <header className="header">
        <div className="badge">JARVIS SYSTEM</div>
        <h1>Neural Command Portal</h1>
        <p>Anthropic-powered multi-agent command center</p>
      </header>

      <form className="mission-form" onSubmit={runMission}>
        <div className="toolbar">
          <label className="switch">
            <input
              type="checkbox"
              checked={voiceMode}
              onChange={(e) => setVoiceMode(e.target.checked)}
            />
            <span>Voice Mode</span>
          </label>

          <button
            type="button"
            className={`voice-btn ${isListening ? "live" : ""}`}
            onClick={toggleVoiceCapture}
            disabled={!voiceMode || !voiceSupported}
          >
            {isListening ? "Listening..." : "Start Mic"}
          </button>
        </div>

        <label htmlFor="mission">Mission Input</label>
        <textarea
          id="mission"
          value={mission}
          onChange={(e) => setMission(e.target.value)}
          placeholder={
            voiceMode
              ? "Speak your mission or type to edit..."
              : "Describe the mission for Jarvis..."
          }
          rows={6}
        />
        <button type="submit" className="run-btn" disabled={loading}>
          {loading ? "Running..." : "Run Mission"}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {loading && (
        <section className="status-panel">
          <p className="status-title">Orchestrating agents…</p>
          <p className="status-hint">
            Check the server terminal for step-by-step logs. This can take a few
            minutes depending on how many executives are engaged.
          </p>
        </section>
      )}

      {result && (
        <section className="result">
          <h2>Final CEO Response</h2>
          <pre>{result.final}</pre>

          <h2>Executive Branches</h2>
          <div className="grid">
            {executives.map((exec) => (
              <article key={exec.id} className="card">
                <h3>
                  {exec.name} ({exec.title})
                </h3>
                <pre>{exec.output}</pre>
                <h4>Specialists</h4>
                {exec.specialists.map((sp) => (
                  <details key={sp.id}>
                    <summary>
                      {sp.name} ({sp.title})
                    </summary>
                    <pre>{sp.output}</pre>
                  </details>
                ))}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
