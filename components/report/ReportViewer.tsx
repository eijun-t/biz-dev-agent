'use client';

import { useState, useEffect } from 'react';
import { 
  ReportSection, 
  ComprehensiveBusinessReport, 
  QualityAssessment,
  GenerationProcess 
} from '@/lib/agents/report/types';
import ProcessVisualization from './ProcessVisualization';
import ReportChat from './ReportChat';

interface ReportViewerProps {
  reportData: ComprehensiveBusinessReport;
  sections: ReportSection[];
  qualityAssessment?: QualityAssessment;
  generationProcesses?: GenerationProcess[];
  isGenerating?: boolean;
  onRegenerateSection?: (sectionName: string) => void;
  onExportReport?: () => void;
}

const TAB_NAMES = [
  '概要',
  'ターゲット・課題', 
  'ソリューション',
  '市場・競合',
  '三菱地所の意義',
  '検証計画',
  'リスク分析'
] as const;

const TAB_MAPPING = {
  '概要': '概要',
  'ターゲット・課題': '想定ターゲットと課題',
  'ソリューション': 'ソリューション仮説・ビジネスモデル',
  '市場・競合': '市場規模・競合',
  '三菱地所の意義': '三菱地所が取り組む意義',
  '検証計画': '検証アクション',
  'リスク分析': 'リスク'
} as const;

export default function ReportViewer({
  reportData,
  sections,
  qualityAssessment,
  generationProcesses = [],
  isGenerating = false,
  onRegenerateSection,
  onExportReport
}: ReportViewerProps) {
  const [activeTab, setActiveTab] = useState<typeof TAB_NAMES[number]>(TAB_NAMES[0]);
  const [chatOpen, setChatOpen] = useState(false);
  const [showProcesses, setShowProcesses] = useState(isGenerating);

  useEffect(() => {
    setShowProcesses(isGenerating);
  }, [isGenerating]);

  const currentSection = sections.find(s => s.tab_name === TAB_MAPPING[activeTab as keyof typeof TAB_MAPPING]);

  const getTabIcon = (tabName: string) => {
    const icons = {
      '概要': '📋',
      'ターゲット・課題': '🎯',
      'ソリューション': '💡',
      '市場・競合': '📊',
      '三菱地所の意義': '🏢',
      '検証計画': '✅',
      'リスク分析': '⚠️'
    };
    return icons[tabName as keyof typeof icons] || '📄';
  };

  const getConfidenceColor = (level: 'low' | 'medium' | 'high') => {
    const colors = {
      'low': 'text-red-500 bg-red-50',
      'medium': 'text-yellow-600 bg-yellow-50',
      'high': 'text-green-600 bg-green-50'
    };
    return colors[level];
  };

  const getQualityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-500 bg-red-50';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100">
      {/* ヘッダー */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-700 mb-2">
                ビジネスアイデア分析レポート
              </h1>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent leading-tight">
                {reportData.selected_business_idea.title}
              </h2>
            </div>
            
            <div className="flex items-center space-x-4">
              {qualityAssessment && (
                <div className={`
                  px-3 py-1 rounded-full text-sm font-medium
                  ${getQualityScoreColor(qualityAssessment.overall_score)}
                `}>
                  品質スコア: {qualityAssessment.overall_score}点
                </div>
              )}
              
              <button
                onClick={() => setShowProcesses(!showProcesses)}
                className={`
                  px-4 py-2 rounded-lg border font-medium transition-colors
                  ${showProcesses 
                    ? 'bg-blue-100 text-blue-700 border-blue-300' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                {showProcesses ? 'プロセスを隠す' : 'プロセスを表示'}
              </button>

              <button
                onClick={() => setChatOpen(!chatOpen)}
                className={`
                  px-4 py-2 rounded-lg border font-medium transition-colors
                  ${chatOpen 
                    ? 'bg-purple-100 text-purple-700 border-purple-300' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                💬 チャット
              </button>

              {onExportReport && (
                <button
                  onClick={onExportReport}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                >
                  📄 エクスポート
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* メインコンテンツエリア */}
          <div className={`${chatOpen ? 'col-span-8' : 'col-span-12'} space-y-6`}>
            
            {/* プロセス可視化 */}
            {showProcesses && (
              <ProcessVisualization
                processes={generationProcesses}
                isActive={isGenerating}
              />
            )}

            {/* タブナビゲーション */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200">
                <nav className="grid grid-cols-4 gap-1 p-2">
                  {TAB_NAMES.map((tabName) => {
                    const originalTabName = TAB_MAPPING[tabName as keyof typeof TAB_MAPPING];
                    const section = sections.find(s => s.tab_name === originalTabName);
                    const isActive = activeTab === tabName;
                    const hasContent = section && section.content;
                    
                    return (
                      <button
                        key={tabName}
                        onClick={() => setActiveTab(tabName)}
                        className={`
                          flex items-center justify-center px-2 py-2 rounded text-xs font-medium transition-all duration-200 min-h-[36px] relative
                          ${isActive 
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md' 
                            : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800 hover:shadow-sm border border-gray-200'
                          }
                        `}
                      >
                        <span className="text-base mr-1">{getTabIcon(tabName)}</span>
                        <span className="font-medium text-xs leading-tight">{tabName}</span>
                        {hasContent && (
                          <div className={`
                            w-1 h-1 rounded-full absolute top-1 right-1
                            ${isActive ? 'bg-white' : 
                              (section?.confidence_level || 'medium') === 'high' ? 'bg-green-400' : 
                              (section?.confidence_level || 'medium') === 'medium' ? 'bg-yellow-400' : 'bg-red-400'}
                          `} />
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* タブコンテンツ */}
              <div className="p-6">
                {currentSection ? (
                  <div className="space-y-6">
                    {/* セクションヘッダー */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          {currentSection.title || activeTab}
                        </h2>
                        {currentSection.data_sources && currentSection.data_sources.length > 0 && (
                          <p className="text-sm text-gray-500 mt-1">
                            データソース: {currentSection.data_sources.join(', ')}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className={`
                          px-3 py-1 rounded-full text-xs font-medium
                          ${getConfidenceColor(currentSection.confidence_level || 'medium')}
                        `}>
                          信頼度: {(currentSection.confidence_level || 'medium') === 'high' ? '高' : 
                                  (currentSection.confidence_level || 'medium') === 'medium' ? '中' : '低'}
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          完成度: {currentSection.completeness_score || 0}%
                        </div>

                        {onRegenerateSection && (
                          <button
                            onClick={() => onRegenerateSection(TAB_MAPPING[activeTab as keyof typeof TAB_MAPPING])}
                            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                            disabled={isGenerating}
                          >
                            🔄 再生成
                          </button>
                        )}
                      </div>
                    </div>

                    {/* セクション内容 */}
                    <div className="prose max-w-none">
                      {currentSection.content ? (
                        <div 
                          dangerouslySetInnerHTML={{ __html: currentSection.content }}
                          className="report-content"
                        />
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <div className="text-4xl mb-2">📝</div>
                          <p>このセクションはまだ生成されていません</p>
                          {onRegenerateSection && (
                            <button
                              onClick={() => onRegenerateSection(TAB_MAPPING[activeTab as keyof typeof TAB_MAPPING])}
                              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              disabled={isGenerating}
                            >
                              セクションを生成
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* サブセクション */}
                    {currentSection.subsections && currentSection.subsections.length > 0 && (
                      <div className="space-y-4">
                        {currentSection.subsections.map((subsection, index) => (
                          <div key={index} className="border-l-4 border-purple-200 pl-4">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              {subsection.subtitle}
                            </h3>
                            <div 
                              dangerouslySetInnerHTML={{ __html: subsection.content }}
                              className="prose max-w-none"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 更新情報 */}
                    {currentSection.last_updated && (
                      <div className="border-t pt-4 text-xs text-gray-500">
                        最終更新: {new Date(currentSection.last_updated).toLocaleString('ja-JP')}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-4xl mb-2">📄</div>
                    <p>セクションが見つかりません</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右サイドバー（チャット） */}
          {chatOpen && (
            <div className="col-span-4">
              <ReportChat 
                reportData={reportData}
                currentSection={activeTab}
                onClose={() => setChatOpen(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* カスタムスタイル */}
      <style jsx global>{`
        .report-content h1, .report-content h2, .report-content h3 {
          color: #374151;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        
        .report-content h1 {
          font-size: 1.5rem;
        }
        
        .report-content h2 {
          font-size: 1.25rem;
        }
        
        .report-content h3 {
          font-size: 1.125rem;
        }
        
        .report-content p {
          line-height: 1.6;
          margin-bottom: 1rem;
        }
        
        .report-content ul, .report-content ol {
          margin-left: 1.5rem;
          margin-bottom: 1rem;
        }
        
        .report-content li {
          margin-bottom: 0.5rem;
        }
        
        .report-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
        }
        
        .report-content th, .report-content td {
          border: 1px solid #d1d5db;
          padding: 0.75rem;
          text-align: left;
        }
        
        .report-content th {
          background-color: #f9fafb;
          font-weight: 600;
        }
        
        .report-content blockquote {
          border-left: 4px solid #8b5cf6;
          margin: 1rem 0;
          padding-left: 1rem;
          font-style: italic;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}