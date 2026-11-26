import { AlertTriangle, CheckCircle2, Clock, Archive } from 'lucide-react';
import { AlertSeverity, BatchHealthStatus, GrowthStage } from '../../types/harvestiq';

interface StatusLabelProps {
  status: BatchHealthStatus | AlertSeverity;
}

export function HealthStatusLabel({ status }: StatusLabelProps) {
  if (status === 'Healthy') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-[#C6DBC8] bg-[#E8F0E8] px-2 py-0.5 text-xs font-medium text-[#153F32] whitespace-nowrap shrink-0">
        <CheckCircle2 className="h-3.5 w-3.5 text-[#287A55]" aria-hidden="true" />
        Healthy
      </span>
    );
  }
  if (status === 'Attention') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-[#EBD5A9] bg-[#FDF6E9] px-2 py-0.5 text-xs font-medium text-[#8C5B14] whitespace-nowrap shrink-0">
        <Clock className="h-3.5 w-3.5 text-[#D7A65B]" aria-hidden="true" />
        Attention
      </span>
    );
  }
  if (status === 'Critical') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-[#F5C2C2] bg-[#FEF2F2] px-2 py-0.5 text-xs font-medium text-[#991B1B] whitespace-nowrap shrink-0">
        <AlertTriangle className="h-3.5 w-3.5 text-[#DC2626]" aria-hidden="true" />
        Critical
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-[#DFE6DD] bg-[#F1F3F0] px-2 py-0.5 text-xs font-medium text-[#5B6660] whitespace-nowrap shrink-0">
      <Archive className="h-3.5 w-3.5 text-[#78847D]" aria-hidden="true" />
      Harvested
    </span>
  );
}

export function GrowthStageText({ stage }: { stage: GrowthStage }) {
  const colorMap: Record<GrowthStage, string> = {
    'Early Growth': 'text-[#5B6660]',
    'Vegetative Growth': 'text-[#287A55]',
    'Approaching Maturity': 'text-[#9E6816]',
    'Ready for Harvest': 'text-[#153F32] font-semibold',
  };
  return <span className={`text-xs font-medium ${colorMap[stage]} whitespace-nowrap`}>{stage}</span>;
}

export function DemoDisclaimerBanner({
  text = 'DEMONSTRATION DATA — Stage 1 rule-based estimate, not validated against live farm ML models',
}: {
  text?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#EBD5A9] bg-[#FDF8EE] px-3.5 py-2 text-xs text-[#7D5112]">
      <span className="font-medium tracking-tight">{text}</span>
      <span className="font-mono text-[11px] text-[#9E6816]">STAGE 1 PREVIEW</span>
    </div>
  );
}
