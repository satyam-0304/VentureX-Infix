import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send } from 'lucide-react';
import { useLearning } from '../../contexts/LearningContext';

export const AITutorDrawer: React.FC = () => {
  const {
    activeSession,
    isAiTutorOpen,
    openAiTutor,
    closeAiTutor,
    toggleAiTutor,
    sendChatMessage,
    aiTyping,
    seekTo
  } = useLearning();

  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Modality modes for Explain Differently
  const explainModes = [
    { label: '💡 Analogy', mode: 'analogy' as const, query: 'Explain this using an everyday analogy' },
    { label: '🔢 Step-by-Step', mode: 'step_by_step' as const, query: 'Explain this step by step' },
    { label: '🇮🇳 Hinglish', mode: 'hinglish' as const, query: 'Explain this in conversational Hinglish' },
    { label: '🟢 Simpler', mode: 'simpler' as const, query: 'Explain this in simpler terms' },
  ];

  // Suggested prompt questions
  const suggestedPrompts = [
    'What is vulcanization?',
    'What is the primary characteristic of monomers?',
    'Difference between natural and synthetic polymers?',
    'Explain cross-linking in simple terms'
  ];

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isAiTutorOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeSession.chatHistory, aiTyping, isAiTutorOpen]);

  // Global Keyboard shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleAiTutor();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleAiTutor]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (inputMessage.trim() && !aiTyping) {
      const msg = inputMessage.trim();
      setInputMessage('');
      await sendChatMessage(msg);
    }
  };

  const handleSelectSuggested = (prompt: string) => {
    if (!aiTyping) {
      sendChatMessage(prompt);
    }
  };

  return (
    <>
      {/* Floating Entry Button Dock */}
      <div
        className="fixed bottom-6 right-8 z-30 select-none animate-fade-in"
        data-purpose="ai-tutor-dock"
      >
        <button
          onClick={openAiTutor}
          id="openAiTutorBtn"
          className="group flex items-center space-x-2.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-4 py-2.5 rounded-full shadow-2xl border border-indigo-500/30 hover:shadow-indigo-500/25 hover:scale-[1.02] transition-all cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-400 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-3.5 h-3.5 pointer-events-none" />
          </div>
          <span className="text-xs font-semibold tracking-wide">Ask LURNIX AI Tutor</span>
          <span className="bg-indigo-500/30 border border-indigo-400/40 text-[10px] font-mono px-1.5 py-0.5 rounded text-indigo-200">
            ⌘K
          </span>
        </button>
      </div>

      {/* AI Tutor Chat Modal / Drawer */}
      {isAiTutorOpen && (
        <div
          id="aiTutorModal"
          className="fixed bottom-6 right-8 w-96 max-w-[calc(100vw-2rem)] h-[500px] bg-slate-900/95 backdrop-blur-xl border border-indigo-500/30 rounded-2xl shadow-2xl z-40 flex flex-col overflow-hidden text-white transition-all animate-fade-in"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight flex items-center space-x-1.5">
                  <span>LURNIX AI Tutor</span>
                  <span className="text-[9px] px-1 bg-indigo-500/30 text-indigo-300 rounded font-normal">
                    Gemini Ready
                  </span>
                </h4>
                <span className="text-[10px] text-emerald-400 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Online & Active ({activeSession.topic})</span>
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={closeAiTutor}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
                title="Close AI Tutor (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div
            id="aiChatMessages"
            className="flex-1 overflow-y-auto p-4 space-y-3 text-xs"
          >
            {activeSession.chatHistory.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start space-x-2 ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {!isUser && (
                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 shadow">
                      LX
                    </div>
                  )}

                  <div
                    className={`p-2.5 rounded-2xl max-w-[85%] leading-relaxed ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-sm shadow-sm'
                        : 'bg-slate-800/80 text-slate-200 rounded-tl-sm border border-slate-700/60 shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                    
                    {/* Clickable Grounded Citation Pill */}
                    {!isUser && msg.relatedTimestamp !== undefined && (
                      <button
                        type="button"
                        onClick={() => seekTo(msg.relatedTimestamp!)}
                        className="mt-2 flex items-center space-x-1 px-2.5 py-1 rounded-full bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-400/40 text-indigo-300 text-[10px] font-semibold transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                        title={`Jump player to ${Math.floor(msg.relatedTimestamp / 60)}:${String(msg.relatedTimestamp % 60).padStart(2, '0')}`}
                      >
                        <span>▶ Jump to Clip ({Math.floor(msg.relatedTimestamp / 60)}:{String(msg.relatedTimestamp % 60).padStart(2, '0')})</span>
                      </button>
                    )}

                    <div
                      className={`text-[9px] mt-1 ${
                        isUser ? 'text-indigo-200 text-right' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* AI Typing Indicator */}
            {aiTyping && (
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  LX
                </div>
                <div className="bg-slate-800/80 px-3 py-2 rounded-2xl rounded-tl-sm border border-slate-700/60 flex items-center space-x-2 text-indigo-300">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                  <span className="text-[11px]">AI Tutor is reasoning...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Explain Differently Modality Selector */}
          <div className="px-3 py-1.5 bg-slate-950/70 border-t border-slate-800 flex items-center space-x-1.5 overflow-x-auto text-[10px]">
            <span className="text-indigo-400 shrink-0 font-semibold">Modes:</span>
            {explainModes.map((m) => (
              <button
                key={m.mode}
                type="button"
                disabled={aiTyping}
                onClick={() => sendChatMessage(m.query, m.mode)}
                className="whitespace-nowrap px-2 py-0.5 rounded-full bg-slate-800 hover:bg-indigo-600/60 border border-slate-700/80 hover:border-indigo-400/50 text-slate-300 hover:text-white transition-all cursor-pointer shrink-0 disabled:opacity-40"
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Suggested Quick Prompts */}
          <div className="px-3 py-1.5 bg-slate-950/50 border-t border-slate-800/80 flex items-center space-x-1 overflow-x-auto text-[10px] text-slate-300">
            <span className="text-slate-500 shrink-0 font-medium">Try:</span>
            {suggestedPrompts.slice(0, 2).map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSelectSuggested(prompt)}
                className="whitespace-nowrap px-2 py-0.5 rounded bg-slate-800 hover:bg-indigo-600/50 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center space-x-2 shrink-0"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask e.g. What is vulcanization?..."
              className="flex-1 bg-slate-800/90 text-xs px-3 py-2 rounded-xl text-white placeholder-slate-400 border border-slate-700 focus:outline-none focus:border-indigo-500"
              disabled={aiTyping}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || aiTyping}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-2 rounded-xl transition-colors cursor-pointer shrink-0"
              title="Send message"
            >
              <Send className="w-3.5 h-3.5 pointer-events-none" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
