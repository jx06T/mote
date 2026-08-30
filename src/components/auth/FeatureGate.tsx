import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { FEATURE_CONFIG, FeatureKey } from '../../config/features';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';

interface FeatureGateProps {
  feature: FeatureKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  compact?: boolean;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  compact = false,
}) => {
  const { checkAccess, openAuthModal } = useAuth();
  const config = FEATURE_CONFIG[feature];
  const isAllowed = checkAccess(feature);

  if (isAllowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (compact) {
    return (
      <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2">
          <Lock className="w-4 h-4 text-primary shrink-0" />
          <span className="text-text-soft">{config.upgradePrompt}</span>
        </div>
        <Button size="sm" onClick={openAuthModal} className="text-xs py-1 px-2.5 shrink-0">
          登入解鎖
        </Button>
      </div>
    );
  }

  return (
    <Card className="p-6 text-center space-y-4 max-w-md mx-auto bg-surface border-border-subtle shadow-xs">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
        <Lock className="w-6 h-6" />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-center space-x-2">
          <h3 className="font-display font-bold text-base text-text-main">
            {config.title}
          </h3>
          <Badge variant="warning">{config.badgeText}</Badge>
        </div>
        <p className="text-xs text-text-soft leading-relaxed max-w-xs mx-auto">
          {config.upgradePrompt}
        </p>
      </div>

      <Button size="md" onClick={openAuthModal} className="w-full rounded-xl">
        <Sparkles className="w-4 h-4 mr-1.5" />
        登入 Google 帳號免費解鎖
        <ArrowRight className="w-4 h-4 ml-1.5" />
      </Button>
    </Card>
  );
};
