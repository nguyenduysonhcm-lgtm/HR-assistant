import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, MessageSquare, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { ChatMessage } from '../types';

interface SmartAssistantProps {
  context: {
    employeesCount: number;
    expiringContractsCount: number;
    pendingDependentsCount: number;
  };
  onClose?: () => void;
  prepopulatedMessage?: string;
}

export default function SmartAssistant({ context, onClose, prepopulatedMessage }: SmartAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'bot',
      text: 'Xin chào! Tôi là Trợ lý Nhân sự Thông minh (HR Smart Assistant). Tôi có thể giúp bạn giải đáp luật lao động, tư vấn thủ tục giảm trừ gia cảnh thuế TNCN, hoặc soạn thảo mẫu thông báo gia hạn hợp đồng. Bạn cần hỗ trợ gì hôm nay?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle prepopulated messages (e.g. drafting contract emails)
  useEffect(() => {
    if (prepopulatedMessage) {
      handleSendMessage(prepopulatedMessage);
    }
  }, [prepopulatedMessage]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          chatHistory: messages.slice(-10), // Send last 10 messages for context
          context
        })
      });

      if (!response.ok) {
        throw new Error('Lỗi máy chủ hoặc chưa cấu hình API Key.');
      }

      const data = await response.json();
      const botMsg: ChatMessage = {
        sender: 'bot',
        text: data.text || 'Tôi không nhận được phản hồi. Bạn vui lòng thử lại nhé.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error: any) {
      const errorMsg: ChatMessage = {
        sender: 'bot',
        text: `⚠️ **Lỗi kết nối AI:** ${error.message || 'Không thể kết nối đến máy chủ Gemini.'}\n\n*Mẹo: Hãy đảm bảo bạn đã cấu hình GEMINI_API_KEY trong thẻ Settings > Secrets của AI Studio.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const templates = [
    {
      title: "Đăng ký Người phụ thuộc",
      prompt: "Hướng dẫn thủ tục đăng ký người phụ thuộc giảm trừ gia cảnh cho con nhỏ và bố mẹ ngoài tuổi lao động cần những giấy tờ gì?"
    },
    {
      title: "Gia hạn Hợp đồng lao động",
      prompt: "Soạn thảo email thông báo gia hạn hợp đồng lao động ngắn gọn, chuyên nghiệp gửi cho nhân viên khi hợp đồng sắp hết hạn."
    },
    {
      title: "Tư vấn Luật lao động",
      prompt: "Theo luật lao động Việt Nam mới nhất, hợp đồng thử việc tối đa là bao lâu đối với vị trí kỹ sư phần mềm?"
    },
    {
      title: "Báo cáo tóm tắt nhân sự",
      prompt: "Hãy đưa ra nhận xét nhanh về bối cảnh nhân sự hiện tại khi có một số hợp đồng sắp hết hạn."
    }
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-xl">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-base flex items-center gap-1.5">
              HR Smart Assistant
              <span className="h-2 w-2 rounded-full bg-green-400 inline-block animate-ping"></span>
            </h3>
            <p className="text-xs text-slate-400">Powered by Gemini 3.5-Flash</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-sm font-medium px-3 py-1 bg-slate-800 rounded-lg"
          >
            Đóng
          </button>
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
          >
            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'
            }`}>
              {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className="space-y-1">
              <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-line shadow-sm border ${
                msg.sender === 'user' 
                  ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none' 
                  : 'bg-white text-slate-800 border-slate-100 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
              <p className={`text-[10px] text-slate-400 px-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                {msg.timestamp}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3 max-w-[85%] mr-auto">
            <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center animate-spin">
              <RefreshCw size={16} />
            </div>
            <div className="bg-white text-slate-500 border border-slate-100 p-4 rounded-2xl rounded-tl-none text-sm flex items-center gap-2 shadow-sm">
              <Loader2 className="animate-spin text-blue-600" size={16} />
              <span>Trợ lý đang suy nghĩ và phản hồi...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Templates */}
      {messages.length === 1 && !isLoading && (
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <MessageSquare size={12} /> Gợi ý câu hỏi nhanh:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {templates.map((tpl, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(tpl.prompt)}
                className="text-left bg-white hover:bg-blue-50/50 hover:border-blue-200 border border-slate-200 p-3 rounded-xl transition-all duration-200 group"
              >
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs font-medium text-slate-700 group-hover:text-blue-700 transition-colors line-clamp-1">
                    {tpl.title}
                  </span>
                  <ArrowRight size={12} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputValue);
        }}
        className="p-4 bg-white border-t border-slate-100 flex gap-2"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Nhập câu hỏi về nhân sự, chính sách, hợp đồng..."
          className="flex-1 px-4 py-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-sm rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white p-3 rounded-xl shadow-md shadow-blue-500/10 hover:shadow-blue-600/20 active:scale-95 transition-all shrink-0"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
