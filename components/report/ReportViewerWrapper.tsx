'use client';

import ReportViewer from './ReportViewer';
import { 
  ComprehensiveBusinessReport, 
  ReportSection,
  QualityAssessment,
  GenerationProcess 
} from '@/lib/agents/report/types';

interface ReportViewerWrapperProps {
  reportData: ComprehensiveBusinessReport;
  sections: ReportSection[];
  qualityAssessment?: QualityAssessment;
  generationProcesses?: GenerationProcess[];
  isGenerating?: boolean;
}

export default function ReportViewerWrapper({
  reportData,
  sections,
  qualityAssessment,
  generationProcesses,
  isGenerating = false
}: ReportViewerWrapperProps) {
  return (
    <ReportViewer
      reportData={reportData}
      sections={sections}
      qualityAssessment={qualityAssessment}
      generationProcesses={generationProcesses}
      isGenerating={isGenerating}
      onRegenerateSection={undefined}
      onExportReport={undefined}
    />
  );
}