import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

const ReportsPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display">Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> Mission Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Mission performance metrics will show eligible, started, submitted, approved, rejected, and paid counts.
              Coming with data integration.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Financial Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Financial summaries including reserved totals, paid totals, and unused budgets.
              Coming with data integration.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;
