'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Play, CheckCircle, XCircle } from 'lucide-react';

interface GenerationState {
  status: 'idle' | 'running' | 'completed' | 'error';
  sessionId: string | null;
  message: string;
  error: string | null;
}

export function GenerateReportForm() {
  const [topic, setTopic] = useState('');
  const [requirements, setRequirements] = useState('');
  const [generationState, setGenerationState] = useState<GenerationState>({
    status: 'idle',
    sessionId: null,
    message: '',
    error: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topic.trim()) {
      setGenerationState(prev => ({
        ...prev,
        status: 'error',
        error: 'トピックを入力してください'
      }));
      return;
    }

    setGenerationState({
      status: 'running',
      sessionId: null,
      message: 'エージェントワークフローを開始中...',
      error: null
    });

    try {
      const response = await fetch('/api/agents/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic.trim(),
          requirements: requirements.trim() || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'エージェントワークフローの開始に失敗しました');
      }

      setGenerationState({
        status: 'completed',
        sessionId: data.sessionId,
        message: 'エージェントワークフローセッションが正常に作成されました！',
        error: null
      });

    } catch (error) {
      console.error('Generation error:', error);
      setGenerationState({
        status: 'error',
        sessionId: null,
        message: '',
        error: error instanceof Error ? error.message : 'エラーが発生しました'
      });
    }
  };

  const handleReset = () => {
    setGenerationState({
      status: 'idle',
      sessionId: null,
      message: '',
      error: null
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          エージェントワークフローの開始
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">事業領域・テーマ *</Label>
            <Input
              id="topic"
              type="text"
              placeholder="例: スマートシティ、エネルギー効率化、デジタルトランスフォーメーション"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={generationState.status === 'running'}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">追加要件・制約条件</Label>
            <Textarea
              id="requirements"
              placeholder="例: B2B向け、初期投資1億円以内、3年以内の事業化"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              disabled={generationState.status === 'running'}
              className="min-h-20"
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={generationState.status === 'running' || !topic.trim()}
              className="flex-1"
            >
              {generationState.status === 'running' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  実行中...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  エージェントワークフローを開始
                </>
              )}
            </Button>
            
            {generationState.status !== 'idle' && (
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={generationState.status === 'running'}
              >
                リセット
              </Button>
            )}
          </div>
        </form>

        {/* 状態表示 */}
        {generationState.status === 'running' && (
          <Alert className="mt-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              {generationState.message}
            </AlertDescription>
          </Alert>
        )}

        {generationState.status === 'completed' && (
          <Alert className="mt-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>{generationState.message}</p>
                <p className="text-sm text-muted-foreground">
                  セッションID: {generationState.sessionId}
                </p>
                <p className="text-sm text-muted-foreground">
                  次のステップ: エージェントノードの実装でワークフローが自動実行されます
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {generationState.status === 'error' && (
          <Alert variant="destructive" className="mt-4">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              {generationState.error}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}