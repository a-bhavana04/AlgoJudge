
import { useState, useRef } from "react";
import axios from "axios";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const languages = [
  { value: "python", label: "Python" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "java", label: "Java" },
  { value: "javascript", label: "JavaScript" },
  { value: "go", label: "Go" }
];

  const [problem, setProblem] = useState("");
  const [language, setLanguage] = useState(languages[0].value);
  const [code, setCode] = useState("");
  const [testCases, setTestCases] = useState([{ input: "", output: "" }]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const chatRef = useRef(null);
  const [streaming, setStreaming] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const formData = new FormData();
    formData.append("problem", problem);
    formData.append("language", language);
    const file = new Blob([code], { type: "text/plain" });
    formData.append("file", file, `code.${language}`);
    formData.append("test_cases", JSON.stringify(testCases.filter(tc => tc.input || tc.output)));
    try {
      const res = await axios.post("/backend/submit/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        }
      });
      setResult(res.data);
      setChat([
        { role: "user", content: problem },
        { role: "assistant", content: res.data.analysis?.choices?.[0]?.text || JSON.stringify(res.data.analysis) }
      ]);
    } catch (err) {
      setResult({ error: err?.response?.data?.detail || "Submission failed" });
    }
    setLoading(false);
  }

  async function handleChat(e) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChat([...chat, { role: "user", content: chatInput }]);
    setStreaming(true);
    setChat(chat => [...chat, { role: "assistant", content: "" }]);
    try {
      const res = await fetch("/backend/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ messages: [...chat, { role: "user", content: chatInput }], language, code })
      });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      let aiMsg = "";
      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          aiMsg += new TextDecoder().decode(value);
          setChat(chat => {
            const updated = [...chat];
            updated[updated.length - 1] = { role: "assistant", content: aiMsg };
            return updated;
          });
        }
      }
    } catch {
      setChat(chat => {
        const updated = [...chat];
        updated[updated.length - 1] = { role: "assistant", content: "Chat failed." };
        return updated;
      });
    }
    setStreaming(false);
    setChatInput("");
    if (chatRef.current) setTimeout(() => chatRef.current.scrollTop = chatRef.current.scrollHeight, 100);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-700 flex flex-col items-center justify-center p-4">
      <div className="bg-white/90 rounded-xl shadow-xl p-8 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">AlgoJudge</h1>
          <div className="text-gray-600 text-sm">{username}</div>
        </div>
  <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            className="w-full p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            rows={3}
            placeholder="Describe your coding problem"
            value={problem}
            onChange={e => setProblem(e.target.value)}
            required
          />
          <select
            className="w-full p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={language}
            onChange={e => setLanguage(e.target.value)}
          >
            {languages.map(l => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
          <textarea
            className="w-full p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
            rows={8}
            placeholder="Paste your code here"
            value={code}
            onChange={e => setCode(e.target.value)}
            required
          />
          <div>
            <div className="font-bold text-gray-800 mb-1">Test Cases</div>
            {testCases.map((tc, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  className="flex-1 p-2 rounded border border-gray-300 font-mono"
                  placeholder="Input"
                  value={tc.input}
                  onChange={e => setTestCases(tcs => tcs.map((t, j) => j === i ? { ...t, input: e.target.value } : t))}
                />
                <input
                  className="flex-1 p-2 rounded border border-gray-300 font-mono"
                  placeholder="Expected Output"
                  value={tc.output}
                  onChange={e => setTestCases(tcs => tcs.map((t, j) => j === i ? { ...t, output: e.target.value } : t))}
                />
                <button type="button" className="px-2 text-red-600" onClick={() => setTestCases(tcs => tcs.length > 1 ? tcs.filter((_, j) => j !== i) : tcs)}>-</button>
              </div>
            ))}
            <button type="button" className="text-blue-600 underline" onClick={() => setTestCases(tcs => [...tcs, { input: "", output: "" }])}>Add Test Case</button>
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
        {result && (
          <div className="mt-6">
            {result.error && (
              <div className="text-red-600 font-semibold">{result.error}</div>
            )}
            {result.execution && (
              <div className="mb-2">
                <div className="font-bold text-gray-800">Execution Output</div>
                <SyntaxHighlighter language={language || "text"} style={vscDarkPlus} customStyle={{ borderRadius: 8, fontSize: 14 }}>
                  {result.execution.output || JSON.stringify(result.execution)}
                </SyntaxHighlighter>
              </div>
            )}
            {result.test_results && (
              <div className="mb-2">
                <div className="font-bold text-gray-800">Test Case Results</div>
                <table className="w-full text-sm mt-1">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="px-2 py-1">Input</th>
                      <th className="px-2 py-1">Expected</th>
                      <th className="px-2 py-1">Actual</th>
                      <th className="px-2 py-1">Passed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.test_results.map((tc, i) => (
                      <tr key={i} className={tc.passed ? "bg-green-50" : "bg-red-50"}>
                        <td className="px-2 py-1 font-mono">{tc.input}</td>
                        <td className="px-2 py-1 font-mono">{tc.expected}</td>
                        <td className="px-2 py-1 font-mono">{tc.actual}</td>
                        <td className="px-2 py-1">{tc.passed ? "Yes" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {result.analysis && (
              <div>
                <div className="font-bold text-gray-800">AI Analysis</div>
                <pre className="bg-gray-100 rounded p-2 text-sm overflow-x-auto">{typeof result.analysis === "string" ? result.analysis : JSON.stringify(result.analysis, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
        <div className="mt-8">
          <div className="font-bold text-gray-800 mb-2">Chat with AI</div>
          <div ref={chatRef} className="bg-gray-100 rounded p-2 h-40 overflow-y-auto text-sm mb-2">
            {chat.map((msg, i) => (
              <div key={i} className={msg.role === "user" ? "text-blue-700" : "text-green-700"}>
                <span className="font-semibold">{msg.role === "user" ? "You" : "AI"}:</span> {msg.content && msg.content.match(/\n/) ? (
                  <SyntaxHighlighter language={language || "text"} style={vscDarkPlus} customStyle={{ borderRadius: 8, fontSize: 13, margin: 0 }}>
                    {msg.content}
                  </SyntaxHighlighter>
                ) : msg.content}
              </div>
            ))}
            {streaming && <div className="text-green-700">AI: <span className="animate-pulse">...</span></div>}
          </div>
          <form onSubmit={handleChat} className="flex gap-2">
            <input
              className="flex-1 p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Ask follow-up or chat with AI..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              disabled={streaming}
            />
            <button
              type="submit"
              className="py-2 px-4 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
              disabled={streaming}
            >Send</button>
          </form>
        </div>
      </div>
      <div className="mt-8 text-gray-400 text-xs">AlgoJudge &copy; 2025</div>
    </div>
  );

