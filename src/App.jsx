import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export default function App() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

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
    } catch (err) {
      console.error("Error:", err);
      setError(err.message || "Failed to analyze report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status) => {
    if (status === "abnormal") return "bg-red-100 text-red-700 border-red-300";
    if (status === "borderline") return "bg-yellow-100 text-yellow-700 border-yellow-300";
    return "bg-green-100 text-green-700 border-green-300";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl">🏥</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">MediScan</h1>
            <p className="text-xs text-gray-500">AI Medical Report Analyzer</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            Understand Your Medical Report
          </h2>
          <p className="text-gray-500 text-lg">
            Upload your report and get a plain English explanation in seconds
          </p>
        </div>

        {/* Upload Box */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all mb-6 bg-white
            ${isDragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-indigo-400"}`}
          onClick={() => document.getElementById("fileInput").click()}
        >
          <input
            id="fileInput"
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
          <div className="text-5xl mb-4">📄</div>
          {file ? (
            <div>
              <p className="text-indigo-600 font-semibold text-lg">{file.name}</p>
              <p className="text-gray-400 text-sm mt-1">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 font-medium text-lg">Drag & drop your PDF here</p>
              <p className="text-gray-400 text-sm mt-1">or click to browse</p>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-5 py-4 mb-6">
            ⚠️ {error}
          </div>
        )}

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={!file || loading}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-all text-lg shadow-md"
        >
          {loading ? "Analyzing your report..." : "Analyze Report"}
        </button>

        {/* Loading */}
        {loading && (
          <div className="mt-8 text-center">
            <div className="inline-block w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 mt-3">Reading and analyzing your report...</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-10 space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-3">📋 Summary</h3>
              <p className="text-gray-600 leading-relaxed">{result.summary}</p>
            </div>

            {/* Key Findings */}
            {result.keyFindings?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">🔬 Key Findings</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.keyFindings.map((item, i) => (
                    <div
                      key={i}
                      className={`flex justify-between items-center px-4 py-3 rounded-xl border ${statusColor(item.status)}`}
                    >
                      <span className="font-medium">{item.label}</span>
                      <span className="font-bold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Abnormal Flags */}
            {result.abnormalFlags?.length > 0 && (
              <div className="bg-red-50 rounded-2xl p-6 shadow-sm border border-red-100">
                <h3 className="text-lg font-bold text-red-700 mb-3">🚨 Abnormal Values</h3>
                <ul className="space-y-2">
                  {result.abnormalFlags.map((flag, i) => (
                    <li key={i} className="flex items-start gap-2 text-red-600">
                      <span>•</span> {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations?.length > 0 && (
              <div className="bg-green-50 rounded-2xl p-6 shadow-sm border border-green-100">
                <h3 className="text-lg font-bold text-green-700 mb-3">✅ Recommendations</h3>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-green-700">
                      <span>•</span> {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-yellow-700 text-sm text-center">
              ⚠️ {result.disclaimer}
            </div>

            {/* Analyze Another */}
            <button
              onClick={() => { setFile(null); setResult(null); }}
              className="w-full py-3 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-semibold rounded-xl transition-all"
            >
              Analyze Another Report
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-400 text-sm mt-10">
        MediScan © 2024 · For educational purposes only
      </footer>
    </div>
  );
}