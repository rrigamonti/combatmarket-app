import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminReports = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display">System Reports</h1>
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">System-Wide Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Comprehensive system reports including total float across all merchants, 
            mission performance aggregates, and payout summaries. Full reporting will be available with more data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReports;
