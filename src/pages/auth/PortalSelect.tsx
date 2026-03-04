import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import combatMarketLogo from '@/assets/combat-market-logo.svg';
import { Swords, Store, Shield } from 'lucide-react';

const portals = [
  {
    title: 'Fighter',
    description: 'Browse missions, complete tasks, and earn rewards',
    icon: Swords,
    path: '/fighter/login',
  },
  {
    title: 'Merchant',
    description: 'Create missions, manage float, and grow your brand',
    icon: Store,
    path: '/merchant/login',
  },
  {
    title: 'Admin',
    description: 'Manage the platform, review submissions, process payouts',
    icon: Shield,
    path: '/admin/login',
  },
];

const PortalSelect = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-center gap-3 mb-8">
          <img src={combatMarketLogo} alt="Combat Market" className="h-12 w-12" />
          <h1 className="text-4xl font-display tracking-wider">Combat Market</h1>
        </div>
        <p className="text-center text-muted-foreground mb-8">Choose your portal to get started</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {portals.map(portal => (
            <Card
              key={portal.title}
              className="border-border cursor-pointer hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200"
              onClick={() => navigate(portal.path)}
            >
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-3">
                  <portal.icon className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="font-display text-lg">{portal.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-xs">
                  {portal.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PortalSelect;
