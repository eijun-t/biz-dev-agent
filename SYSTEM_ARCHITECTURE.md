 # Business Development Agent - System Architecture

## システム全体の流れ

このシステムは以下の6段階のパイプラインで構成されています：

### 1. アイデエーションのための調査（Enhanced Research）
- 幅広い市場・技術トレンドの収集
- 複数のデータソース（Serper API、Yahoo News、e-Stat、arXiv等）から情報取得
- 業界横断的な調査を実施

### 2. 調査に基づくアイデエーション（Enhanced Ideator）
- Enhanced Researchの結果を分析
- 市場機会を特定し、具体的なビジネスアイデアを生成
- 複数のアイデア候補を提案

### 3. 生成されたアイデアの評価・選定（Enhanced Critic）
- Enhanced Ideatorが生成した複数のビジネスアイデアを総合評価
- 市場性、実現可能性、収益性、リスク等の多角的な評価基準で分析
- 最も有望な1つのビジネスアイデアを選定・推奨

### 4. 選定されたビジネスアイデアに関する情報調査の計画立案（Enhanced Planner）
- Enhanced Criticが選定した特定のビジネスアイデアに対する詳細調査計画を策定
- どのドメイン（技術、市場、競合、規制、財務）をどのような観点で調査するかを決定
- 調査の優先順位と範囲を定義

### 5. 立案された計画に基づく調査の実施（Specialized Research）
- Enhanced Plannerが作成した調査計画に基づいて実行
- 各専門ドメインモジュールが担当分野の詳細調査を実施：
  - **Technology Investigator**: 技術・特許・実装事例の調査
  - **Market Investigator**: 市場規模・セグメント・動向の調査  
  - **Competitor Investigator**: 直接競合の分析
  - **Regulatory Investigator**: 規制・法的要件の調査
  - **Financial Investigator**: 資金調達・収益性・投資環境の調査
- 各モジュールはEnhanced Researcherを使用して実データを取得
- 取得したデータを各専門分野の構造化された調査結果に変換

### 6. 調査で収集した情報の分析（Analyst）
- Specialized Researchの結果を統合分析
- クロスドメインでの洞察を抽出
- リスク・機会の特定と評価

### 7. レポートの出力（Writer）
- 分析結果を構造化されたビジネスレポートとして出力
- 意思決定に必要な情報を整理
- アクションプランの提案

## 重要な設計原則

1. **データ駆動**: 各段階で実データを使用し、モックデータは最小限に抑制
2. **モジュラー設計**: 各コンポーネントは独立して動作し、テスト・保守が容易
3. **柔軟性**: 任意のビジネスアイデアに対応できる汎用的な設計
4. **段階的実行**: 前段階の結果を次段階の入力として活用

## データフロー

```
Enhanced Research → Enhanced Ideator → Enhanced Critic → Enhanced Planner → Specialized Research → Analyst → Writer
      ↓                    ↓                ↓                ↓                     ↓              ↓         ↓
  市場トレンド        ビジネスアイデア    選定アイデア        調査計画           専門調査結果      統合分析    最終レポート
```