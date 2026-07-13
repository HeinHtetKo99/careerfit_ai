import { Card, Button } from './ui';

export default function DemoUpgradeGate({ title, description, actionLabel, onCreateAccount }) {
  return (
    <div className="mx-auto max-w-lg animate-fade-up text-center">
      <Card className="p-10" glow>
        <p className="text-xs font-semibold uppercase tracking-wider text-sky-600">Demo</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{description}</p>
        <Button variant="primary" size="lg" onClick={onCreateAccount} className="mt-8">
          {actionLabel}
        </Button>
      </Card>
    </div>
  );
}
