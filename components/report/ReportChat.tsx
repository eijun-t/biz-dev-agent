'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  ComprehensiveBusinessReport, 
  ChatMessage, 
  ChatContext 
} from '@/lib/agents/report/types';

interface ReportChatProps {
  reportData: ComprehensiveBusinessReport;
  currentSection: string;
  onClose: () => void;
}

export default function ReportChat({ 
  reportData, 
  currentSection, 
  onClose 
}: ReportChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: `こんにちは！「${reportData?.selected_business_idea?.title || reportData?.businessIdeaTitle || 'ビジネスアイデア'}」のレポートについて何でもお聞きください。現在「${currentSection}」セクションを表示しています。`,
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestedQuestions = [
    'この市場規模の根拠を教えて',
    '競合との差別化ポイントは？',
    'リスクの軽減策は？',
    '収益性の見通しは？',
    '三菱地所のシナジーを詳しく',
    '次のステップは何をすべき？'
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // セクション変更時にコンテキスト更新メッセージを追加
    if (messages.length > 1) {
      const contextMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `「${currentSection}」セクションに移動しました。このセクションについて質問をどうぞ。`,
        timestamp: new Date().toISOString(),
        related_section: currentSection
      };
      setMessages(prev => [...prev, contextMessage]);
    }
  }, [currentSection]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: messageContent,
      timestamp: new Date().toISOString(),
      related_section: currentSection
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // チャット API を呼び出し
      const response = await fetch('/api/agents/report/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messageContent,
          context: {
            report_data: reportData,
            current_section: currentSection,
            conversation_history: messages.slice(-10) // 直近10件の履歴
          }
        })
      });

      if (!response.ok) {
        throw new Error('チャット応答の取得に失敗しました');
      }

      const result = await response.json();
      
      if (result.success && result.message) {
        setMessages(prev => [...prev, result.message]);
      } else {
        throw new Error(result.error || 'チャット応答の処理に失敗しました');
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: '申し訳ありません。一時的にエラーが発生しました。しばらく後でもう一度お試しください。',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const handleSuggestedQuestion = (question: string) => {
    handleSendMessage(question);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border h-[600px] flex flex-col">
      {/* ヘッダー */}
      <div className="border-b p-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
            AI
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">レポートチャット</h3>
            <p className="text-xs text-gray-500">現在: {currentSection}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-[80%] rounded-lg px-4 py-2 text-sm
                ${message.type === 'user'
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800'
                }
              `}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              <div
                className={`
                  text-xs mt-1 opacity-70
                  ${message.type === 'user' ? 'text-purple-100' : 'text-gray-500'}
                `}
              >
                {formatTimestamp(message.timestamp)}
                {message.related_section && (
                  <span className="ml-2">📍 {message.related_section}</span>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2 text-sm text-gray-800">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span>回答を生成中...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* おすすめ質問 */}
      {messages.length <= 2 && (
        <div className="border-t p-3 bg-gray-50">
          <p className="text-xs text-gray-600 mb-2">💡 おすすめの質問:</p>
          <div className="flex flex-wrap gap-1">
            {suggestedQuestions.slice(0, 3).map((question, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedQuestion(question)}
                className="text-xs bg-white border rounded-full px-3 py-1 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                disabled={isLoading}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 入力エリア */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="レポートについて質問してください..."
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity text-sm font-medium"
          >
            送信
          </button>
        </form>
        
        <div className="mt-2 text-xs text-gray-500">
          💭 レポートの内容について、データの詳細や分析の根拠を聞いてみてください
        </div>
      </div>
    </div>
  );
}