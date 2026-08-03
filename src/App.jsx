import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

// --- line-icon set (stroke-based, matches the report aesthetic) ---
const Icon = {
  Document: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
      <path d="M14 3.5V8h4" strokeLinejoin="round" />
      <path d="M9 12.5h6M9 15.5h6M9 9.5h2" strokeLinecap="round" />
    </svg>
  ),
  Flask: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M10 3h4M10 3v6.5L5.5 18a1.6 1.6 0 0 0 1.4 2.4h10.2a1.6 1.6 0 0 0 1.4-2.4L14 9.5V3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 15.5h8" strokeLinecap="round" />
    </svg>
  ),
  Alert: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M12 4.5 21 19.5H3L12 4.5Z" strokeLinejoin="round" />
      <path d="M12 10.5v4M12 17h.01" strokeLinecap="round" />
    </svg>
  ),
  Check: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12.3l2.3 2.3 4.7-4.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Info: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.2M12 7.8h.01" strokeLinecap="round" />
    </svg>
  ),
  Reset: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M4 12a8 8 0 1 1 2.6 5.9" strokeLinecap="round" />
      <path d="M4 17v-4h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Upload: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M12 15V4M12 4l-3.5 3.5M12 4l3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 15v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Scan: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M4 8V6a2 2 0 0 1 2-2h2M20 8V6a2 2 0 0 0-2-2h-2M4 16v2a2 2 0 0 0 2 2h2M20 16v2a2 2 0 0 1-2 2h-2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 12h16" strokeLinecap="round" />
    </svg>
  ),
  Lock: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <rect x="5.5" y="10.5" width="13" height="9" rx="1.5" />
      <path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" strokeLinecap="round" />
    </svg>
  ),
  Trash: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M5 7h14M9.5 7V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v2M7 7l.8 12a1.5 1.5 0 0 0 1.5 1.4h5.4a1.5 1.5 0 0 0 1.5-1.4L17 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Arrow: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

// corner scan-brackets — the recurring signature motif tying back to "Scan"
function ScanCorners({ className = "" }) {
  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`}>
      <span className="absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 border-teal-500/60 rounded-tl" />
      <span className="absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2 border-teal-500/60 rounded-tr" />
      <span className="absolute left-0 bottom-0 h-4 w-4 border-l-2 border-b-2 border-teal-500/60 rounded-bl" />
      <span className="absolute right-0 bottom-0 h-4 w-4 border-r-2 border-b-2 border-teal-500/60 rounded-br" />
    </div>
  );
}

const statusMeta = {
  normal: { dot: "bg-moss-600", text: "text-moss-700" },
  borderline: { dot: "bg-amber-600", text: "text-amber-700" },
  abnormal: { dot: "bg-rose-700", text: "text-rose-700" },
};

function statusStyle(status) {
  return statusMeta[status] || statusMeta.normal;
}

function makeReportId() {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `MS-${rand}`;
}

const scrollTo = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

// Static preview shown in the hero — illustrates the output before anyone uploads anything
const sampleFindings = [
  { label: "Hemoglobin", value: "13.8 g/dL", status: "normal" },
  { label: "Fasting Glucose", value: "118 mg/dL", status: "borderline" },
  { label: "LDL Cholesterol", value: "162 mg/dL", status: "abnormal" },
];

export default function App() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [reportMeta, setReportMeta] = useState(null);

  const extractTextFromPDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map((item) => item.str).join(" ") + "\n";
    }
    return fullText;
  };

  const analyzeReport = async (text) => {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: `You are MediScan, an AI medical report analyzer. Analyze the medical report below and respond ONLY with a valid JSON object in this exact format, no extra text, no markdown backticks:
{
  "summary": "2-3 sentence plain English summary",
  "keyFindings": [
    {"label": "Test Name", "value": "Result", "status": "normal"}
  ],
  "abnormalFlags": ["list any abnormal values here"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "disclaimer": "Always consult a qualified doctor for medical advice."
}

Status must be one of: normal, abnormal, borderline

Medical Report:
${text.slice(0, 3000)}`,
          },
        ],
      }),
    });

    const data = await response.json();
    console.log("Groq response:", data);

    if (!response.ok) {
      throw new Error(data.error?.message || "API error");
    }

    const content = data.choices[0].message.content;
    const cleaned = content.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  };

  const handleFile = (f) => {
    if (f && f.type === "application/pdf") {
      setFile(f);
      setResult(null);
      setError(null);
    } else {
      setError("Please upload a PDF file only.");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const text = await extractTextFromPDF(file);
      if (!text.trim()) {
        throw new Error("Could not extract text from PDF. Make sure it's not a scanned image.");
      }
      const analysis = await analyzeReport(text);
      setResult(analysis);
      setReportMeta({
        id: makeReportId(),
        date: new Date().toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    } catch (err) {
      console.error("Error:", err);
      setError(err.message || "Failed to analyze report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper font-sans text-ink-700 antialiased">
      {/* ---------- NAV ---------- */}
      <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded border border-teal-700 font-serif text-base font-medium text-teal-700">
              M
            </div>
            <span className="font-serif text-lg font-medium text-ink-900">MediScan</span>
          </div>

          <nav className="hidden items-center gap-8 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-500 md:flex">
            <button onClick={() => scrollTo("how-it-works")} className="transition-colors hover:text-teal-700">
              How it works
            </button>
            <button onClick={() => scrollTo("privacy")} className="transition-colors hover:text-teal-700">
              Privacy
            </button>
            <a
              href="https://github.com/yanshika-singh-dev/MediScan"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-teal-700"
            >
              GitHub
            </a>
          </nav>

          <button
            onClick={() => scrollTo("analyze")}
            className="rounded-sm bg-teal-700 px-4 py-2 text-xs font-medium tracking-wide text-white transition-colors hover:bg-teal-600"
          >
            Try it free
          </button>
        </div>
      </header>

      <main>
        {/* ---------- HERO ---------- */}
        <section className="relative overflow-hidden border-b border-line">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "radial-gradient(circle, #1C8C82 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              maskImage: "linear-gradient(to bottom, black, transparent 85%)",
            }}
          />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-28">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-700/30 bg-teal-100/60 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-teal-700">
                Upload · Read · Understand
              </p>
              <h1 className="max-w-xl font-serif text-5xl font-medium leading-[1.1] text-ink-900 sm:text-6xl">
                Your lab report, translated out of medical jargon.
              </h1>
              <p className="mt-5 max-w-md text-[16px] leading-relaxed text-ink-500">
                Upload the PDF your lab or hospital gave you. MediScan reads it
                and explains each result in plain language, flags anything
                outside the normal range, and tells you what to ask your
                doctor next.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => scrollTo("analyze")}
                  className="flex items-center gap-2 rounded-sm bg-teal-700 px-6 py-3.5 font-medium tracking-wide text-white transition-colors hover:bg-teal-600"
                >
                  Analyze a report
                  <Icon.Arrow className="h-4 w-4" />
                </button>
                <button
                  onClick={() => scrollTo("how-it-works")}
                  className="font-mono text-[12px] uppercase tracking-[0.14em] text-ink-500 transition-colors hover:text-teal-700"
                >
                  See how it works
                </button>
              </div>
              <p className="mt-8 font-mono text-[11px] text-ink-500">
                No signup · Reports are not stored · Free to use
              </p>
            </div>

            {/* sample report mockup — signature element */}
            <div className="relative mx-auto w-full max-w-sm lg:mx-0 lg:ml-auto">
              <div className="absolute -inset-3 -z-10 rounded-sm border border-teal-500/20" />
              <div className="relative border border-line bg-white shadow-[0_20px_50px_-25px_rgba(16,34,31,0.35)]">
                <ScanCorners />
                <div className="flex items-center justify-between border-b border-line px-5 py-3">
                  <span className="font-serif text-sm font-medium text-ink-900">Report Summary</span>
                  <span className="font-mono text-[10px] text-ink-500">MS-7QP2K</span>
                </div>
                <div className="px-5 py-4">
                  <p className="mb-4 text-[13px] leading-relaxed text-ink-500">
                    Most values are within range. Cholesterol and glucose are
                    worth a follow-up conversation with your doctor.
                  </p>
                  <div className="border-t border-line">
                    {sampleFindings.map((item, i) => {
                      const s = statusStyle(item.status);
                      return (
                        <div key={i} className="flex items-center justify-between border-b border-line py-2.5">
                          <span className="flex items-center gap-2 text-[13px] text-ink-700">
                            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                            {item.label}
                          </span>
                          <span className={`font-mono text-[13px] font-medium ${s.text}`}>{item.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-center font-mono text-[10px] text-ink-500">
                Illustrative example
              </p>
            </div>
          </div>
        </section>

        {/* ---------- HOW IT WORKS ---------- */}
        <section id="how-it-works" className="border-b border-line">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-teal-600">
              How it works
            </p>
            <h2 className="mb-10 font-serif text-2xl font-medium text-ink-900">
              Three steps, no medical degree required.
            </h2>
            <div className="grid gap-10 sm:grid-cols-3">
              {[
                {
                  n: "01",
                  icon: Icon.Upload,
                  title: "Upload the PDF",
                  body: "Drop in the report your lab, hospital, or diagnostic center emailed you.",
                },
                {
                  n: "02",
                  icon: Icon.Scan,
                  title: "MediScan reads it",
                  body: "The report is parsed and each value is checked against normal reference ranges.",
                },
                {
                  n: "03",
                  icon: Icon.Check,
                  title: "Get a plain summary",
                  body: "A short summary, flagged values, and questions worth asking your doctor.",
                },
              ].map((step) => (
                <div key={step.n} className="relative border-l border-line pl-6">
                  <span className="absolute -left-[1px] top-0 h-full w-[1px] bg-line" />
                  <span className="mb-4 block font-mono text-xs text-teal-600">{step.n}</span>
                  <step.icon className="mb-3 h-6 w-6 text-teal-600" />
                  <h3 className="mb-1.5 font-serif text-lg font-medium text-ink-900">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-ink-500">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- TOOL ---------- */}
        <section id="analyze" className="border-b border-line bg-white/60">
          <div className="mx-auto max-w-3xl px-6 py-16">
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-teal-600">
              Try it now
            </p>
            <h2 className="mb-8 font-serif text-2xl font-medium text-ink-900">
              Analyze your report
            </h2>

            {/* Upload */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById("fileInput").click()}
              className={`relative cursor-pointer rounded-sm border border-dashed p-10 text-center transition-colors
                ${isDragging ? "border-teal-500 bg-teal-100/40" : "border-line bg-white hover:border-teal-500/60"}`}
            >
              <ScanCorners />
              <input
                id="fileInput"
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
              />
              <Icon.Document className="mx-auto mb-4 h-8 w-8 text-teal-600" />
              {file ? (
                <div>
                  <p className="font-mono text-sm font-medium text-teal-700">{file.name}</p>
                  <p className="mt-1 font-mono text-xs text-ink-500">
                    {(file.size / 1024).toFixed(1)} KB · ready to analyze
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-[15px] font-medium text-ink-700">Drop your report PDF here</p>
                  <p className="mt-1 font-mono text-xs text-ink-500">or click to browse</p>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2 border border-rose-700/30 bg-rose-100 px-4 py-3 text-sm text-rose-700">
                <Icon.Alert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={!file || loading}
              className="mt-4 w-full rounded-sm bg-teal-700 py-3.5 font-medium tracking-wide text-white transition-colors hover:bg-teal-600 disabled:cursor-not-allowed disabled:bg-ink-300"
            >
              {loading ? "Reading your report…" : "Analyze Report"}
            </button>

            {loading && (
              <div className="mt-6 flex items-center justify-center gap-3 font-mono text-xs text-ink-500">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
                Extracting text and checking each value…
              </div>
            )}

            {/* Results — styled as a generated report */}
            {result && (
              <div className="mt-10 border border-line bg-white">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-6 py-4">
                  <p className="font-serif text-base font-medium text-ink-900">Report Summary</p>
                  {reportMeta && (
                    <p className="font-mono text-[11px] text-ink-500">
                      {reportMeta.id} · {reportMeta.date}
                    </p>
                  )}
                </div>

                <div className="divide-y divide-line">
                  <div className="px-6 py-6">
                    <div className="mb-3 flex items-center gap-2 text-ink-900">
                      <Icon.Info className="h-4 w-4 text-teal-600" />
                      <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-500">Summary</h3>
                    </div>
                    <p className="text-[15px] leading-relaxed text-ink-700">{result.summary}</p>
                  </div>

                  {result.keyFindings?.length > 0 && (
                    <div className="px-6 py-6">
                      <div className="mb-3 flex items-center gap-2 text-ink-900">
                        <Icon.Flask className="h-4 w-4 text-teal-600" />
                        <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-500">
                          Key Findings
                        </h3>
                      </div>
                      <div className="border-t border-line">
                        {result.keyFindings.map((item, i) => {
                          const s = statusStyle(item.status);
                          return (
                            <div key={i} className="flex items-center justify-between gap-4 border-b border-line py-3">
                              <span className="flex items-center gap-2.5 text-sm text-ink-700">
                                <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                                {item.label}
                              </span>
                              <span className={`font-mono text-sm font-medium ${s.text}`}>{item.value}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {result.abnormalFlags?.length > 0 && (
                    <div className="bg-rose-100/50 px-6 py-6">
                      <div className="mb-3 flex items-center gap-2 text-rose-700">
                        <Icon.Alert className="h-4 w-4" />
                        <h3 className="font-mono text-[11px] uppercase tracking-[0.14em]">Flagged Values</h3>
                      </div>
                      <ul className="space-y-2">
                        {result.abnormalFlags.map((flag, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-rose-700">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-rose-700" />
                            {flag}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.recommendations?.length > 0 && (
                    <div className="px-6 py-6">
                      <div className="mb-3 flex items-center gap-2 text-moss-700">
                        <Icon.Check className="h-4 w-4" />
                        <h3 className="font-mono text-[11px] uppercase tracking-[0.14em]">
                          Recommended Next Steps
                        </h3>
                      </div>
                      <ul className="space-y-2">
                        {result.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-ink-700">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-moss-600" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="px-6 py-4">
                    <p className="font-mono text-[11px] leading-relaxed text-ink-500">{result.disclaimer}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setFile(null);
                    setResult(null);
                    setReportMeta(null);
                  }}
                  className="flex w-full items-center justify-center gap-2 border-t border-line py-3.5 text-sm font-medium text-teal-700 transition-colors hover:bg-teal-100/40"
                >
                  <Icon.Reset className="h-3.5 w-3.5" />
                  Analyze another report
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ---------- PRIVACY / TRUST ---------- */}
        <section id="privacy" className="border-b border-line">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="grid gap-10 sm:grid-cols-[auto_1fr] sm:items-start">
              <Icon.Lock className="h-7 w-7 text-teal-600" />
              <div className="max-w-2xl">
                <h2 className="mb-3 font-serif text-2xl font-medium text-ink-900">
                  What actually happens to your report
                </h2>
                <p className="mb-6 text-sm leading-relaxed text-ink-500">
                  Be specific about this, since it's a medical document. Here's the full path your file takes:
                </p>
                <div className="space-y-5 border-t border-line pt-6">
                  <div className="flex gap-4">
                    <span className="font-mono text-xs text-teal-600">01</span>
                    <p className="text-sm leading-relaxed text-ink-700">
                      Your PDF is opened and read entirely in your browser — it is never uploaded to a MediScan
                      server, because MediScan doesn't have one.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <span className="font-mono text-xs text-teal-600">02</span>
                    <p className="text-sm leading-relaxed text-ink-700">
                      The extracted text is sent directly from your browser to Groq's API, which runs the
                      Llama 3.3 model that writes your summary. This is the one third party that sees your
                      report content — Groq's own data handling is governed by{" "}
                      <a
                        href="https://groq.com/privacy-policy/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-teal-700 underline underline-offset-2 hover:text-teal-600"
                      >
                        their privacy policy
                      </a>
                      , not MediScan's.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <span className="font-mono text-xs text-teal-600">03</span>
                    <p className="text-sm leading-relaxed text-ink-700">
                      The analysis is displayed on this page and nowhere else. Closing or refreshing the tab
                      discards it — there's no account, no database, and no history of past reports.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <span className="font-mono text-xs text-teal-600">04</span>
                    <p className="text-sm leading-relaxed text-ink-700">
                      MediScan explains what your report says in plain language. It isn't a diagnosis and
                      doesn't replace a conversation with your doctor.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ---------- FOOTER ---------- */}
      <footer>
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-10 sm:grid-cols-[1.3fr_1fr_1fr]">
            <div>
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded border border-teal-700 font-serif text-sm font-medium text-teal-700">
                  M
                </div>
                <span className="font-serif text-base font-medium text-ink-900">MediScan</span>
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-ink-500">
                An AI reading companion for your medical reports. Built to make
                lab results easier to understand at a glance.
              </p>
            </div>
            <div>
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-500">Product</p>
              <ul className="space-y-2 text-sm">
                <li>
                  <button onClick={() => scrollTo("how-it-works")} className="text-ink-700 hover:text-teal-700">
                    How it works
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollTo("analyze")} className="text-ink-700 hover:text-teal-700">
                    Analyze a report
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-500">More</p>
              <ul className="space-y-2 text-sm">
                <li>
                  <button onClick={() => scrollTo("privacy")} className="text-ink-700 hover:text-teal-700">
                    Privacy
                  </button>
                </li>
                <li>
                  <a
                    href="https://github.com/yanshika-singh-dev/MediScan"
                    target="_blank"
                    rel="noreferrer"
                    className="text-ink-700 hover:text-teal-700"
                  >
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 font-mono text-[11px] text-ink-500 sm:flex-row sm:items-center sm:justify-between">
            <span>© 2026 MediScan · For educational purposes only</span>
            <span>Not a substitute for professional medical advice</span>
          </div>
        </div>
      </footer>
    </div>
  );
}