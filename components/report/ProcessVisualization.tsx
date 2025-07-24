'use client';

import { useState, useEffect } from 'react';
import { GenerationProcess } from '@/lib/agents/report/types';

interface ProcessVisualizationProps {
  processes: GenerationProcess[];
  isActive: boolean;
  onProcessUpdate?: (processes: GenerationProcess[]) => void;
}

export default function ProcessVisualization({ 
  processes, 
  isActive, 
  onProcessUpdate 
}: ProcessVisualizationProps) {
  const [displayProcesses, setDisplayProcesses] = useState<GenerationProcess[]>(processes);
  const [currentStep, setCurrentStep] = useState<string | null>(null);

  useEffect(() => {
    setDisplayProcesses(processes);
    const activeProcess = processes.find(p => p.status === 'in_progress');
    setCurrentStep(activeProcess?.step_id || null);
  }, [processes]);

  const getAgentIcon = (agent: string) => {
    const icons = {
      'writer': '📝',
      'critic': '🔍',
      'researcher': '🔬',
      'analyst': '📊',
      'enhanced_analyst': '🧠',
      'enhanced_researcher': '🔍',
      'enhanced_ideator': '💡',
      'enhanced_critic': '⚖️',
      'advanced_planner': '📋',
      'specialized_researcher': '🔬'
    };
    return icons[agent as keyof typeof icons] || '🤖';
  };

  const getAgentDisplayName = (agent: string) => {
    const names = {
      'writer': 'Writerエージェント',
      'critic': 'Criticエージェント',
      'researcher': 'Researcherエージェント',
      'analyst': 'Analystエージェント',
      'enhanced_analyst': 'Enhanced Analystエージェント',
      'enhanced_researcher': 'Enhanced Researcherエージェント',
      'enhanced_ideator': 'Enhanced Ideatorエージェント',
      'enhanced_critic': 'Enhanced Criticエージェント',
      'advanced_planner': 'Advanced Plannerエージェント',
      'specialized_researcher': 'Specialized Researcherエージェント'
    };
    return names[agent as keyof typeof names] || `${agent}エージェント`;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'pending': 'text-gray-400 bg-gray-100',
      'in_progress': 'text-blue-600 bg-blue-100 animate-pulse',
      'completed': 'text-green-600 bg-green-100',
      'failed': 'text-red-600 bg-red-100'
    };
    return colors[status as keyof typeof colors] || 'text-gray-400 bg-gray-100';
  };

  const getOverallProgress = () => {
    if (displayProcesses.length === 0) return 0;
    const completedCount = displayProcesses.filter(p => p.status === 'completed').length;
    return Math.round((completedCount / displayProcesses.length) * 100);
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    const duration = Math.round((end - start) / 1000);
    
    if (duration < 60) return `${duration}秒`;
    if (duration < 3600) return `${Math.round(duration / 60)}分`;
    return `${Math.round(duration / 3600)}時間`;
  };

  if (!isActive && displayProcesses.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-6 text-center text-gray-500">
        <div className="text-4xl mb-2">⚡</div>
        <p>レポート生成を開始すると、プロセスがここに表示されます</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {/* ヘッダー */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            レポート生成プロセス
          </h3>
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-600">
              進捗: {getOverallProgress()}%
            </div>
            <div className="w-20 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getOverallProgress()}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* プロセスリスト */}
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {displayProcesses.map((process, index) => (
          <div
            key={process.step_id}
            className={`rounded-lg border p-3 transition-all duration-200 ${
              process.step_id === currentStep 
                ? 'border-blue-300 bg-blue-50 shadow-sm' 
                : 'border-gray-200'
            }`}
          >
            <div className="flex items-start space-x-3">
              {/* エージェントアイコン */}
              <div className={`
                flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm
                ${getStatusColor(process.status)}
              `}>
                {getAgentIcon(process.agent)}
              </div>

              {/* プロセス詳細 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {process.action}
                  </h4>
                  <div className="flex items-center space-x-2">
                    {process.status === 'in_progress' && (
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    )}
                    <span className={`
                      px-2 py-1 text-xs rounded-full font-medium
                      ${getStatusColor(process.status)}
                    `}>
                      {process.status === 'pending' && '待機中'}
                      {process.status === 'in_progress' && '実行中'}
                      {process.status === 'completed' && '完了'}
                      {process.status === 'failed' && '失敗'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-sm text-gray-600">
                    {getAgentDisplayName(process.agent)}
                  </p>
                  <span className="text-xs text-gray-400">•</span>
                  <p className="text-sm text-gray-500">
                    {process.description}
                  </p>
                </div>

                {/* 進捗バー（実行中の場合） */}
                {process.status === 'in_progress' && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>進捗状況</span>
                      <span>{process.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${process.progress_percentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* 実行時間・結果 */}
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <div className="flex items-center space-x-2">
                    <span>⏱️ {formatDuration(process.start_time, process.end_time)}</span>
                    {process.output_summary && (
                      <span className="truncate max-w-40">
                        📄 {process.output_summary}
                      </span>
                    )}
                  </div>
                  {process.error_message && (
                    <span className="text-red-500 truncate max-w-32">
                      ⚠️ {process.error_message}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* 次のステップ予告 */}
        {isActive && displayProcesses.length > 0 && (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-3 text-center">
            <div className="text-gray-400 text-sm">
              {displayProcesses.every(p => p.status === 'completed') 
                ? '🎉 全プロセス完了！' 
                : '次のステップを準備中...'}
            </div>
          </div>
        )}
      </div>

      {/* フッター統計 */}
      {displayProcesses.length > 0 && (
        <div className="border-t p-3 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex space-x-4">
              <span>
                完了: {displayProcesses.filter(p => p.status === 'completed').length}
              </span>
              <span>
                実行中: {displayProcesses.filter(p => p.status === 'in_progress').length}
              </span>
              <span>
                待機中: {displayProcesses.filter(p => p.status === 'pending').length}
              </span>
            </div>
            <div>
              総実行時間: {
                displayProcesses
                  .filter(p => p.duration)
                  .reduce((total, p) => total + (p.duration || 0), 0)
              }秒
            </div>
          </div>
        </div>
      )}
    </div>
  );
}