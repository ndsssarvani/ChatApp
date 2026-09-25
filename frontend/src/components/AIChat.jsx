import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import aiService from "../services/aiService";
import "./AIChat.css";

// ─── Safe Markdown & Code Block Renderer ───
const SafeMarkdownRenderer = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopyCode = (codeText, index) => {
    navigator.clipboard.writeText(codeText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!content) return null;

  // Split by code blocks ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  let codeBlockCounter = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        value: content.substring(lastIndex, match.index),
      });
    }

    const language = match[1] || "code";
    const code = match[2].trimEnd();
    parts.push({
      type: "code",
      language,
      code,
      index: codeBlockCounter++,
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: "text",
      value: content.substring(lastIndex),
    });
  }

  // Format text segments (headings, lists, blockquotes, paragraphs)
  const formatTextSegment = (textBlock, keyPrefix) => {
    const lines = textBlock.split("\n");
    return lines.map((line, lIdx) => {
      if (line.startsWith("### ")) {
        return (
          <h4 key={`${keyPrefix}-h3-${lIdx}`} className="ai-md-h3">
            {formatInlineText(line.replace("### ", ""))}
          </h4>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h3 key={`${keyPrefix}-h2-${lIdx}`} className="ai-md-h2">
            {formatInlineText(line.replace("## ", ""))}
          </h3>
        );
      }
      if (line.startsWith("# ")) {
        return (
          <h2 key={`${keyPrefix}-h1-${lIdx}`} className="ai-md-h1">
            {formatInlineText(line.replace("# ", ""))}
          </h2>
        );
      }
      if (line.match(/^[\*\-]\s+(.*)/)) {
        const itemText = line.replace(/^[\*\-]\s+/, "");
        return (
          <li key={`${keyPrefix}-li-${lIdx}`} className="ai-md-list-item">
            {formatInlineText(itemText)}
          </li>
        );
      }
      if (line.match(/^\d+\.\s+(.*)/)) {
        const itemText = line.replace(/^\d+\.\s+/, "");
        return (
          <li key={`${keyPrefix}-oli-${lIdx}`} className="ai-md-numbered-item">
            {formatInlineText(itemText)}
          </li>
        );
      }
      if (line.startsWith("> ")) {
        return (
          <blockquote key={`${keyPrefix}-quote-${lIdx}`} className="ai-md-quote">
            {formatInlineText(line.replace("> ", ""))}
          </blockquote>
        );
      }
      if (!line.trim()) {
        return <div key={`${keyPrefix}-sp-${lIdx}`} className="ai-md-spacer" />;
      }

      return (
        <p key={`${keyPrefix}-p-${lIdx}`} className="ai-md-paragraph">
          {formatInlineText(line)}
        </p>
      );
    });
  };

  const formatInlineText = (text) => {
    const tokens = [];
    const inlineRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
    let inlineMatch;
    let prevIdx = 0;
    let keyIdx = 0;

    while ((inlineMatch = inlineRegex.exec(text)) !== null) {
      if (inlineMatch.index > prevIdx) {
        tokens.push(text.substring(prevIdx, inlineMatch.index));
      }

      const matchText = inlineMatch[0];
      if (matchText.startsWith("`") && matchText.endsWith("`")) {
        tokens.push(
          <code key={`code-${keyIdx++}`} className="ai-inline-code">
            {matchText.slice(1, -1)}
          </code>
        );
      } else if (matchText.startsWith("**") && matchText.endsWith("**")) {
        tokens.push(
          <strong key={`bold-${keyIdx++}`} className="ai-inline-bold">
            {matchText.slice(2, -2)}
          </strong>
        );
      } else if (matchText.startsWith("*") && matchText.endsWith("*")) {
        tokens.push(
          <em key={`em-${keyIdx++}`} className="ai-inline-em">
            {matchText.slice(1, -1)}
          </em>
        );
      }

      prevIdx = inlineMatch.index + matchText.length;
    }

    if (prevIdx < text.length) {
      tokens.push(text.substring(prevIdx));
    }

    return tokens.length > 0 ? tokens : text;
  };

  return (
    <div className="ai-markdown-root">
      {parts.map((part, pIdx) => {
        if (part.type === "code") {
          const isCopied = copiedIndex === part.index;
          return (
            <div key={`block-${pIdx}`} className="ai-code-block-wrapper">
              <div className="ai-code-block-header">
                <span className="ai-code-lang-tag">{part.language || "Code"}</span>
                <button
                  type="button"
                  className={`ai-code-copy-btn ${isCopied ? "copied" : ""}`}
                  onClick={() => handleCopyCode(part.code, part.index)}
                  title="Copy code to clipboard"
                >
                  {isCopied ? "✓ Copied!" : "📋 Copy"}
                </button>
              </div>
              <pre className="ai-code-pre">
                <code>{part.code}</code>
              </pre>
            </div>
          );
        }
        return <div key={`txt-${pIdx}`}>{formatTextSegment(part.value, `p-${pIdx}`)}</div>;
      })}
    </div>
  );
};

// ─── SUGGESTED PROMPTS ───
const SUGGESTED_PROMPTS = [
  {
    icon: "💡",
    title: "Explain a concept",
    prompt: "Explain the concept of WebSockets and how real-time messaging works in simple terms.",
  },
  {
    icon: "🐛",
    title: "Help me debug code",
    prompt: "Help me find and fix bugs in this JavaScript async/await function:\n\n",
  },
  {
    icon: "💼",
    title: "Prepare for an interview",
    prompt: "Prepare me for a React and Node.js full-stack developer interview with top questions and answers.",
  },
  {
    icon: "📝",
    title: "Summarize text",
    prompt: "Summarize the key takeaways and action items from this meeting note:\n\n",
  },
  {
    icon: "✉️",
    title: "Write an email",
    prompt: "Help me write a polite and professional follow-up email after a project milestone delivery.",
  },
  {
    icon: "🖼️",
    title: "Analyze image / file",
    prompt: "Please analyze the attached image/document in detail and summarize what you see.",
  },
];

// ─── AI TOOLS PRESETS ───
const AI_TOOLS = [
  { id: "summarize", icon: "📝", label: "Summarize", placeholder: "Paste the text you want to summarize..." },
  { id: "explain_code", icon: "💻", label: "Explain Code", placeholder: "Paste code here to get a step-by-step breakdown..." },
  { id: "debug_code", icon: "🐛", label: "Debug Code", placeholder: "Paste buggy code or error message..." },
  { id: "translate", icon: "🌐", label: "Translate", placeholder: "Enter text to translate..." },
  { id: "interview_prep", icon: "🎯", label: "Interview Prep", placeholder: "Enter role or topic (e.g. MERN Stack, System Design)..." },
  { id: "rewrite", icon: "✍️", label: "Rewrite & Polish", placeholder: "Enter text to improve tone and clarity..." },
];

const AIChat = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { currentLanguage } = useLanguage();

  // Conversations & UI State
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [aiLanguage, setAiLanguage] = useState(currentLanguage || "en");
  const [responseStyle, setResponseStyle] = useState("balanced");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTool, setActiveTool] = useState(null);
  const [toolInput, setToolInput] = useState("");
  const [toolTargetLang, setToolTargetLang] = useState("English");
  const [copiedMessageId, setCopiedMessageId] = useState(null);

  // File Upload State
  const [attachedFiles, setAttachedFiles] = useState([]); // [{ fileName, fileType, mimeType, base64Data, textContent, size, previewUrl }]
  const fileInputRef = useRef(null);

  // Voice Assistance State
  const [isListening, setIsListening] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState(false);
  const speechRecognitionRef = useRef(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, attachedFiles]);

  // Load conversation list
  const loadConversations = async (search = "") => {
    try {
      const res = await aiService.getConversations(search);
      if (res.success) {
        setConversations(res.conversations || []);
      }
    } catch (err) {
      console.error("[AIChat] Failed to load conversations:", err);
    }
  };

  useEffect(() => {
    loadConversations(searchFilter);
  }, [searchFilter]);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
    };
  }, []);

  // Initialize Speech Recognition (Voice Input)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang =
        aiLanguage === "te"
          ? "te-IN"
          : aiLanguage === "hi"
          ? "hi-IN"
          : aiLanguage === "es"
          ? "es-ES"
          : aiLanguage === "fr"
          ? "fr-FR"
          : "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInputText((prev) => {
            const base = prev.trim() ? prev.trim() + " " : "";
            return base + transcript;
          });
        }
      };

      recognition.onerror = (event) => {
        console.warn("[Voice Input] Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      speechRecognitionRef.current = recognition;
    }
  }, [aiLanguage]);

  const toggleVoiceInput = () => {
    if (!speechRecognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        speechRecognitionRef.current.start();
      } catch (e) {
        console.error("Failed to start speech recognition:", e);
      }
    }
  };

  // Text-To-Speech (AI Voice Assistant)
  const speakText = (text, messageId) => {
    if (!window.speechSynthesis) {
      alert("Text-to-speech is not supported on this browser.");
      return;
    }

    // If currently speaking this message, stop it
    if (speakingMessageId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Clean markdown symbols for natural speech
    const cleanSpeechText = text
      .replace(/```[\s\S]*?```/g, "Code snippet omitted.")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/[*#_>]/g, "")
      .trim();

    if (!cleanSpeechText) return;

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.lang =
      aiLanguage === "te"
        ? "te-IN"
        : aiLanguage === "hi"
        ? "hi-IN"
        : aiLanguage === "es"
        ? "es-ES"
        : aiLanguage === "fr"
        ? "fr-FR"
        : "en-US";

    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setSpeakingMessageId(messageId);
    };

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };

    utterance.onerror = () => {
      setSpeakingMessageId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  // File Upload Handlers
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      const isImage = file.type.startsWith("image/");
      const reader = new FileReader();

      if (isImage) {
        reader.onload = (event) => {
          setAttachedFiles((prev) => [
            ...prev,
            {
              fileName: file.name,
              fileType: file.type,
              mimeType: file.type,
              base64Data: event.target.result,
              size: file.size,
              previewUrl: event.target.result,
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        // Read text/code/document files
        reader.onload = (event) => {
          setAttachedFiles((prev) => [
            ...prev,
            {
              fileName: file.name,
              fileType: file.type || "text/plain",
              mimeType: file.type || "text/plain",
              textContent: event.target.result,
              size: file.size,
            },
          ]);
        };
        reader.readAsText(file);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (index) => {
    setAttachedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Load specific conversation
  const handleSelectConversation = async (convId) => {
    setErrorMsg("");
    setActiveConversationId(convId);
    setSidebarOpen(false);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeakingMessageId(null);

    try {
      setLoading(true);
      const res = await aiService.getConversation(convId);
      if (res.success && res.conversation) {
        setMessages(res.conversation.messages || []);
      }
    } catch (err) {
      setErrorMsg("Could not load conversation messages.");
    } finally {
      setLoading(false);
    }
  };

  // Start new chat
  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setErrorMsg("");
    setInputText("");
    setAttachedFiles([]);
    setActiveTool(null);
    setSidebarOpen(false);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeakingMessageId(null);
    if (inputRef.current) inputRef.current.focus();
  };

  // Delete conversation
  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this AI conversation?")) return;
    try {
      const res = await aiService.deleteConversation(convId);
      if (res.success) {
        setConversations((prev) => prev.filter((c) => c._id !== convId));
        if (activeConversationId === convId) {
          handleNewChat();
        }
      }
    } catch (err) {
      alert("Failed to delete conversation");
    }
  };

  // Send message to Gemini via backend
  const handleSendMessage = async (textToSend = null) => {
    const message = (textToSend !== null ? textToSend : inputText).trim();
    const currentAttachments = [...attachedFiles];

    if ((!message && currentAttachments.length === 0) || loading) return;

    setErrorMsg("");
    setInputText("");
    setAttachedFiles([]);

    // Optimistic user message with attachment details
    const userMsgObj = {
      role: "user",
      content: message || "Please analyze the attached file.",
      attachments: currentAttachments,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsgObj]);
    setLoading(true);

    try {
      const res = await aiService.sendMessage({
        message: message || "Please analyze the attached file.",
        conversationId: activeConversationId || undefined,
        language: aiLanguage,
        style: responseStyle,
        attachments: currentAttachments,
      });

      if (res.success) {
        const modelMsgObj = {
          role: "model",
          content: res.reply,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, modelMsgObj]);

        if (res.conversationId && (!activeConversationId || activeConversationId !== res.conversationId)) {
          setActiveConversationId(res.conversationId);
          loadConversations();
        }

        // Auto read response if voice mode enabled
        if (autoSpeakEnabled) {
          speakText(res.reply, messages.length + 1);
        }
      } else {
        throw new Error(res.message || "Failed to get response");
      }
    } catch (err) {
      console.error("[AIChat] Send Error:", err);
      const errorText =
        err.response?.data?.message ||
        "AI is temporarily unavailable. Please try again or check your Gemini API key.";
      setErrorMsg(errorText);
    } finally {
      setLoading(false);
    }
  };

  // Regenerate latest response
  const handleRegenerate = async () => {
    if (loading || messages.length === 0) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMsg) return;

    const updatedMessages = [...messages];
    if (updatedMessages[updatedMessages.length - 1].role === "model") {
      updatedMessages.pop();
      setMessages(updatedMessages);
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await aiService.sendMessage({
        message: lastUserMsg.content,
        conversationId: activeConversationId || undefined,
        language: aiLanguage,
        style: responseStyle,
        attachments: lastUserMsg.attachments || [],
      });

      if (res.success) {
        const modelMsgObj = {
          role: "model",
          content: res.reply,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, modelMsgObj]);
      } else {
        throw new Error(res.message || "Failed to regenerate");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to regenerate response.");
    } finally {
      setLoading(false);
    }
  };

  // Copy full response
  const handleCopyMessage = (msgContent, msgId) => {
    navigator.clipboard.writeText(msgContent);
    setCopiedMessageId(msgId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Execute specialized AI tool
  const handleExecuteTool = async () => {
    if (!toolInput.trim() || loading || !activeTool) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await aiService.runTool({
        tool: activeTool.id,
        input: toolInput.trim(),
        targetLang: toolTargetLang,
        language: aiLanguage,
      });

      if (res.success) {
        const userToolMsg = {
          role: "user",
          content: `[Tool: ${activeTool.label}]\n${toolInput}`,
          createdAt: new Date().toISOString(),
        };
        const modelToolMsg = {
          role: "model",
          content: res.result,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userToolMsg, modelToolMsg]);
        setActiveTool(null);
        setToolInput("");
      } else {
        throw new Error(res.message || "Tool execution failed");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Tool failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="aichat-root-container">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        style={{ display: "none" }}
        multiple
        accept="image/*,.pdf,.txt,.js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.html,.css,.json,.md,.csv,.doc,.docx"
      />

      {/* ─── 1. TOP NAVBAR ─── */}
      <header className="aichat-navbar">
        <div className="aichat-nav-left">
          <button
            type="button"
            className="aichat-nav-btn"
            onClick={() => navigate("/dashboard")}
            title="Back to Chats"
          >
            ←
          </button>
          <button
            type="button"
            className="aichat-mobile-toggle-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Toggle AI Chat History"
          >
            ☰ History
          </button>
          <div className="aichat-brand">
            <div className="aichat-brand-icon">🤖</div>
            <div className="aichat-brand-info">
              <h1 className="aichat-title">AI Chat</h1>
              <p className="aichat-subtitle">Your Chatify AI Assistant</p>
            </div>
          </div>
        </div>

        <div className="aichat-nav-right">
          {/* Voice Auto-Speak Toggle */}
          <button
            type="button"
            className={`aichat-voice-toggle-btn ${autoSpeakEnabled ? "active" : ""}`}
            onClick={() => setAutoSpeakEnabled(!autoSpeakEnabled)}
            title={autoSpeakEnabled ? "Voice Assistant: ON (Auto-reads responses)" : "Voice Assistant: OFF"}
          >
            <span>{autoSpeakEnabled ? "🔊 Voice: ON" : "🔈 Voice: OFF"}</span>
          </button>

          {/* AI Language Selection */}
          <div className="aichat-lang-wrapper" title="AI Response Language">
            <span className="aichat-lang-label">🌐</span>
            <select
              className="aichat-lang-select"
              value={aiLanguage}
              onChange={(e) => setAiLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="te">Telugu (తెలుగు)</option>
              <option value="hi">Hindi (हिन्दी)</option>
              <option value="ta">Tamil (தமிழ்)</option>
              <option value="kn">Kannada (ಕನ್ನಡ)</option>
              <option value="es">Spanish (Español)</option>
              <option value="fr">French (Français)</option>
            </select>
          </div>

          {/* New Chat Button */}
          <button
            type="button"
            className="aichat-new-chat-btn"
            onClick={handleNewChat}
            title="Start a new AI conversation"
          >
            <span>+</span>
            <span className="aichat-new-chat-text">New Chat</span>
          </button>
        </div>
      </header>

      {/* ─── 2. MAIN BODY ─── */}
      <div className="aichat-body-layout">
        {/* Sidebar (History) */}
        <aside className={`aichat-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="aichat-sidebar-header">
            <h3 className="aichat-sidebar-title">Recent Conversations</h3>
            <button
              type="button"
              className="aichat-sidebar-close-btn"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className="aichat-sidebar-search">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="aichat-search-input"
            />
          </div>

          <div className="aichat-history-list">
            {conversations.length === 0 ? (
              <div className="aichat-history-empty">
                <p>No previous conversations found.</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = conv._id === activeConversationId;
                return (
                  <div
                    key={conv._id}
                    className={`aichat-history-item ${isActive ? "active" : ""}`}
                    onClick={() => handleSelectConversation(conv._id)}
                  >
                    <div className="aichat-history-item-icon">💬</div>
                    <div className="aichat-history-item-info">
                      <span className="aichat-history-item-title" title={conv.title}>
                        {conv.title || "AI Conversation"}
                      </span>
                      <span className="aichat-history-item-time">
                        {conv.updatedAt
                          ? new Date(conv.updatedAt).toLocaleDateString([], { month: "short", day: "numeric" })
                          : ""}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="aichat-history-delete-btn"
                      onClick={(e) => handleDeleteConversation(e, conv._id)}
                      title="Delete chat"
                    >
                      🗑️
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Backdrop for mobile drawer */}
        {sidebarOpen && (
          <div className="aichat-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Chat Area */}
        <main className="aichat-main-area">
          {/* AI Tools Quick Bar */}
          <div className="aichat-tools-bar">
            <span className="aichat-tools-label">AI Tools:</span>
            <div className="aichat-tools-scroll">
              {AI_TOOLS.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  className={`aichat-tool-chip ${activeTool?.id === tool.id ? "active" : ""}`}
                  onClick={() => setActiveTool(activeTool?.id === tool.id ? null : tool)}
                >
                  <span>{tool.icon}</span>
                  <span>{tool.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Tool Drawer */}
          {activeTool && (
            <div className="aichat-tool-drawer">
              <div className="aichat-tool-drawer-header">
                <span className="aichat-tool-drawer-title">
                  {activeTool.icon} {activeTool.label}
                </span>
                <button
                  type="button"
                  className="aichat-tool-drawer-close"
                  onClick={() => setActiveTool(null)}
                >
                  ✕
                </button>
              </div>
              <div className="aichat-tool-drawer-body">
                {activeTool.id === "translate" && (
                  <div className="aichat-tool-lang-row">
                    <label>Translate to:</label>
                    <select
                      value={toolTargetLang}
                      onChange={(e) => setToolTargetLang(e.target.value)}
                      className="aichat-tool-select"
                    >
                      <option value="Telugu">Telugu</option>
                      <option value="Hindi">Hindi</option>
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="Tamil">Tamil</option>
                      <option value="Kannada">Kannada</option>
                    </select>
                  </div>
                )}
                <textarea
                  className="aichat-tool-textarea"
                  placeholder={activeTool.placeholder}
                  value={toolInput}
                  onChange={(e) => setToolInput(e.target.value)}
                  rows={3}
                />
                <div className="aichat-tool-drawer-actions">
                  <button
                    type="button"
                    className="aichat-tool-submit-btn"
                    onClick={handleExecuteTool}
                    disabled={!toolInput.trim() || loading}
                  >
                    {loading ? "Processing..." : `Run ${activeTool.label}`}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Messages Scroll Container */}
          <div className="aichat-messages-container">
            {messages.length === 0 ? (
              /* ─── EMPTY STATE ─── */
              <div className="aichat-empty-state">
                <div className="aichat-empty-icon-glow">🤖</div>
                <h2 className="aichat-empty-title">Chatify AI Assistant</h2>
                <p className="aichat-empty-subtitle">
                  Ask questions, upload files & images, or use voice commands!
                </p>

                <div className="aichat-prompts-grid">
                  {SUGGESTED_PROMPTS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="aichat-prompt-card"
                      onClick={() => handleSendMessage(item.prompt)}
                    >
                      <span className="aichat-prompt-icon">{item.icon}</span>
                      <div className="aichat-prompt-text">
                        <span className="aichat-prompt-heading">{item.title}</span>
                        <span className="aichat-prompt-desc">{item.prompt.slice(0, 75)}...</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* ─── MESSAGES LIST ─── */
              <div className="aichat-messages-list">
                {messages.map((msg, index) => {
                  const isUser = msg.role === "user";
                  const isLastModel = !isUser && index === messages.length - 1;
                  const isSpeaking = speakingMessageId === index;

                  return (
                    <div
                      key={index}
                      className={`aichat-msg-row ${isUser ? "user-row" : "ai-row"}`}
                    >
                      {!isUser && (
                        <div className="aichat-avatar-bot" title="Chatify AI">
                          🤖
                        </div>
                      )}

                      <div className={`aichat-bubble ${isUser ? "user-bubble" : "ai-bubble"}`}>
                        {/* Attachments Display */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="aichat-msg-attachments">
                            {msg.attachments.map((att, attIdx) => {
                              const isImg =
                                att.mimeType?.startsWith("image/") ||
                                att.previewUrl ||
                                att.base64Data?.startsWith("data:image");
                              return isImg ? (
                                <div key={attIdx} className="aichat-att-img-box">
                                  <img
                                    src={att.previewUrl || att.base64Data}
                                    alt={att.fileName || "Uploaded image"}
                                    className="aichat-att-img"
                                  />
                                </div>
                              ) : (
                                <div key={attIdx} className="aichat-att-doc-pill">
                                  <span>📄</span>
                                  <span className="aichat-att-doc-name">{att.fileName}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {isUser ? (
                          <div className="aichat-user-text">{msg.content}</div>
                        ) : (
                          <SafeMarkdownRenderer content={msg.content} />
                        )}

                        <div className="aichat-bubble-footer">
                          <span className="aichat-bubble-time">
                            {formatTime(msg.createdAt)}
                          </span>

                          {!isUser && (
                            <div className="aichat-bubble-actions">
                              {/* Voice Assistant Speak Button */}
                              <button
                                type="button"
                                className={`aichat-action-pill-btn voice-btn ${isSpeaking ? "speaking" : ""}`}
                                onClick={() => speakText(msg.content, index)}
                                title={isSpeaking ? "Stop Voice" : "Listen to AI"}
                              >
                                {isSpeaking ? "⏹ Stop" : "🔊 Listen"}
                              </button>

                              <button
                                type="button"
                                className="aichat-action-pill-btn"
                                onClick={() => handleCopyMessage(msg.content, index)}
                                title="Copy response"
                              >
                                {copiedMessageId === index ? "✓ Copied!" : "📋 Copy"}
                              </button>

                              {isLastModel && (
                                <button
                                  type="button"
                                  className="aichat-action-pill-btn"
                                  onClick={handleRegenerate}
                                  title="Regenerate this response"
                                  disabled={loading}
                                >
                                  🔄 Regenerate
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {isUser && (
                        <div className="aichat-avatar-user" title={currentUser?.name || "User"}>
                          <img
                            src={
                              currentUser?.avatar ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser?.name || "U"}`
                            }
                            alt="You"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Loading Indicator */}
                {loading && (
                  <div className="aichat-msg-row ai-row">
                    <div className="aichat-avatar-bot">🤖</div>
                    <div className="aichat-bubble ai-bubble thinking-bubble">
                      <div className="aichat-thinking-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <span className="aichat-thinking-text">AI is thinking & analyzing...</span>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {errorMsg && (
                  <div className="aichat-error-alert">
                    <span>⚠️ {errorMsg}</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* ─── 3. BOTTOM INPUT AREA ─── */}
          <footer className="aichat-input-bar">
            {/* Attachment Preview Chips */}
            {attachedFiles.length > 0 && (
              <div className="aichat-attachments-preview-tray">
                {attachedFiles.map((f, fIdx) => (
                  <div key={fIdx} className="aichat-preview-chip">
                    {f.previewUrl ? (
                      <img src={f.previewUrl} alt={f.fileName} className="aichat-chip-thumb" />
                    ) : (
                      <span className="aichat-chip-icon">📄</span>
                    )}
                    <span className="aichat-chip-name">{f.fileName}</span>
                    <button
                      type="button"
                      className="aichat-chip-remove-btn"
                      onClick={() => handleRemoveFile(fIdx)}
                      title="Remove file"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Voice Listening Banner */}
            {isListening && (
              <div className="aichat-listening-indicator">
                <div className="aichat-voice-wave">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span>Listening to your voice... Speak now</span>
                <button
                  type="button"
                  className="aichat-stop-voice-btn"
                  onClick={toggleVoiceInput}
                >
                  Done
                </button>
              </div>
            )}

            <form
              className="aichat-input-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
            >
              {/* File Upload Button */}
              <button
                type="button"
                className="aichat-input-tool-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Upload Image or Document for AI analysis"
              >
                📎
              </button>

              {/* Voice Input Mic Button */}
              <button
                type="button"
                className={`aichat-input-tool-btn mic-btn ${isListening ? "listening" : ""}`}
                onClick={toggleVoiceInput}
                title={isListening ? "Stop listening" : "Speak to AI (Voice Input)"}
              >
                {isListening ? "🔴" : "🎙️"}
              </button>

              <textarea
                ref={inputRef}
                className="aichat-input-textarea"
                placeholder="Ask AI anything, attach images/docs, or tap mic... (Enter to send)"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={loading}
              />

              <button
                type="submit"
                className="aichat-send-btn"
                disabled={(!inputText.trim() && attachedFiles.length === 0) || loading}
                title="Send message to AI"
              >
                {loading ? "..." : "Send →"}
              </button>
            </form>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default AIChat;
