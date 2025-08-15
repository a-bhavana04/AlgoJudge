'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import Monaco from '@monaco-editor/react'
import { 
  Play, 
  LogOut, 
  MessageSquare, 
  Plus, 
  Trash2,
  Clock,
  MemoryStick,
  CheckCircle,
  XCircle,
  Send,
  User,
  Settings
} from 'lucide-react'
import axios from 'axios'

interface DashboardProps {
  user: any
  token: string
  onLogout: () => void
}

const languages = [
  { value: 'python', label: 'Python', defaultCode: '# Write your Python code here\nprint("Hello, AlgoJudge!")' },
  { value: 'cpp', label: 'C++', defaultCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, AlgoJudge!" << endl;\n    return 0;\n}' },
  { value: 'c', label: 'C', defaultCode: '#include <stdio.h>\n\nint main() {\n    printf("Hello, AlgoJudge!\\n");\n    return 0;\n}' },
  { value: 'java', label: 'Java', defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, AlgoJudge!");\n    }\n}' },
  { value: 'javascript', label: 'JavaScript', defaultCode: '// Write your JavaScript code here\nconsole.log("Hello, AlgoJudge!");' },
  { value: 'go', label: 'Go', defaultCode: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, AlgoJudge!")\n}' }
]

interface TestCase {
  input: string
  output: string
}

interface ExecutionResult {
  submission_id: number
  execution_result: {
    output: string
    error?: string
    execution_time: number
    memory_used: number
  }
}

export default function Dashboard({ user, token, onLogout }: DashboardProps) {
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0])
  const [code, setCode] = useState(selectedLanguage.defaultCode)
  const [testCases, setTestCases] = useState<TestCase[]>([{ input: '', output: '' }])
  const [result, setResult] = useState<ExecutionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string}>>([])
  const [chatInput, setChatInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setCode(selectedLanguage.defaultCode)
  }, [selectedLanguage])

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [chatMessages])

  // Configure axios with token
  useEffect(() => {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }, [token])

  const addTestCase = () => {
    setTestCases([...testCases, { input: '', output: '' }])
  }

  const removeTestCase = (index: number) => {
    setTestCases(testCases.filter((_, i) => i !== index))
  }

  const updateTestCase = (index: number, field: 'input' | 'output', value: string) => {
    const updated = [...testCases]
    updated[index][field] = value
    setTestCases(updated)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setResult(null)
    setAiAnalysis(null)

    try {
      const response = await axios.post('/api/submit', {
        code,
        language: selectedLanguage.value,
        test_cases: testCases.filter(tc => tc.input || tc.output)
      })

      setResult(response.data)
      setAiAnalysis(response.data.ai_analysis || null)

      // Add to chat - only add AI analysis if you want it in chat too
      const messages = [
        { role: 'user', content: `Submitted ${selectedLanguage.label} code` }
      ]
      setChatMessages(prev => [...prev, ...messages])
    } catch (error: any) {
      setResult({ 
        submission_id: 0,
        execution_result: { 
          output: '', 
          error: error.response?.data?.detail || 'Submission failed',
          execution_time: 0,
          memory_used: 0
        }
      })
      setAiAnalysis(null)
    } finally {
      setLoading(false)
    }
  }

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const userMessage = chatInput
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setStreaming(true)

    try {
      const response = await axios.post('/api/chat', {
        message: userMessage,
        submission_id: result?.submission_id
      })

      // Handle streaming response
      const text = response.data.content || 'I apologize, but I cannot analyze your code at the moment.'
      setChatMessages(prev => [...prev, { role: 'assistant', content: text }])
    } catch (error) {
      setChatMessages(prev => [
        ...prev, 
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }
      ])
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AlgoJudge
            </h1>
            <div className="flex items-center space-x-2 bg-gray-700 rounded-lg px-3 py-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-gray-300 text-sm">Online</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-gray-300">
              <User className="w-4 h-4" />
              <span>Welcome, {user?.username}</span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel - Code Editor */}
        <div className="flex-1 flex flex-col bg-gray-900">
          {/* Language Selector */}
          <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="text-gray-300 text-sm">Language:</label>
                <select
                  value={selectedLanguage.value}
                  onChange={(e) => setSelectedLanguage(languages.find(l => l.value === e.target.value) || languages[0])}
                  className="bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {languages.map(lang => (
                    <option key={lang.value} value={lang.value}>{lang.label}</option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4" />
                <span>{loading ? 'Running...' : 'Run Code'}</span>
              </button>
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex-1">
            <Monaco
              height="100%"
              language={selectedLanguage.value === 'cpp' ? 'cpp' : selectedLanguage.value}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>

          {/* Test Cases */}
          <div className="bg-gray-800 border-t border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Test Cases</h3>
              <button
                onClick={addTestCase}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Test Case</span>
              </button>
            </div>
            
            <div className="space-y-4 max-h-40 overflow-y-auto">
              {testCases.map((testCase, index) => (
                <div key={index} className="flex items-center space-x-4 bg-gray-700 rounded-lg p-4">
                  <div className="flex-1">
                    <label className="block text-gray-300 text-sm mb-1">Input</label>
                    <input
                      type="text"
                      value={testCase.input}
                      onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                      className="w-full bg-gray-600 text-white border border-gray-500 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter input"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-gray-300 text-sm mb-1">Expected Output</label>
                    <input
                      type="text"
                      value={testCase.output}
                      onChange={(e) => updateTestCase(index, 'output', e.target.value)}
                      className="w-full bg-gray-600 text-white border border-gray-500 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter expected output"
                    />
                  </div>
                  {testCases.length > 1 && (
                    <button
                      onClick={() => removeTestCase(index)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Results & Chat */}
        <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* Results */}
          <div className="border-b border-gray-700 p-6">
            <h3 className="text-white font-semibold mb-4">Execution Results</h3>
            {result ? (
              <div className="space-y-4">
                {result.execution_result.error ? (
                  <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <XCircle className="w-5 h-5 text-red-400" />
                      <span className="text-red-400 font-semibold">Error</span>
                    </div>
                    <pre className="text-red-300 text-sm whitespace-pre-wrap">
                      {result.execution_result.error}
                    </pre>
                  </div>
                ) : (
                  <div className="bg-green-900/50 border border-green-500 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 font-semibold">Success</span>
                    </div>
                    <pre className="text-green-300 text-sm whitespace-pre-wrap">
                      {result.execution_result.output}
                    </pre>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-300 text-sm">Time</span>
                    </div>
                    <span className="text-white font-mono">
                      {result.execution_result?.execution_time ? 
                        result.execution_result.execution_time.toFixed(2) : '0.00'}s
                    </span>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <MemoryStick className="w-4 h-4 text-purple-400" />
                      <span className="text-gray-300 text-sm">Memory</span>
                    </div>
                    <span className="text-white font-mono">
                      {result.execution_result?.memory_used ? 
                        result.execution_result.memory_used.toFixed(1) : '0.0'}MB
                    </span>
                  </div>
                </div>

                {/* AI Analysis Panel */}
                {aiAnalysis && (
                  <div className="bg-blue-900/40 border border-blue-500 rounded-lg p-4 mt-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <MessageSquare className="w-5 h-5 text-blue-400" />
                      <span className="text-blue-300 font-semibold">AI Analysis</span>
                    </div>
                    <pre className="text-blue-200 text-sm whitespace-pre-wrap">{aiAnalysis}</pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-400 text-center py-8">
                <Play className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Run your code to see results</p>
              </div>
            )}
          </div>

          {/* AI Chat */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-blue-400" />
                <h3 className="text-white font-semibold">AI Assistant</h3>
              </div>
            </div>
            
            <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-gray-400 text-center py-8">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Start a conversation with the AI</p>
                </div>
              ) : (
                chatMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white ml-8'
                        : 'bg-gray-700 text-gray-300 mr-8'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                ))
              )}
              {streaming && (
                <div className="bg-gray-700 text-gray-300 mr-8 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></div>
                    <span className="text-sm">AI is thinking...</span>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleChat} className="p-4 border-t border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about your code..."
                  className="flex-1 bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={streaming}
                />
                <button
                  type="submit"
                  disabled={streaming || !chatInput.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
