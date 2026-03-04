import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { db } from '@/integrations/supabase/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import combatMarketLogo from '@/assets/combat-market-logo.svg';
import { Store } from 'lucide-react';

const MerchantAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already authenticated as merchant
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: roles } = await db.from('user_roles').select('role').eq('user_id', session.user.id);
        if (roles?.some(r => ['owner', 'marketing', 'finance', 'analyst', 'support'].includes(r.role))) {
          navigate('/merchant', { replace: true });
        }
      }
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Welcome back!');
        navigate('/merchant');
      } else {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;

        if (signUpData.user) {
          // Create merchant record (pending status)
          const { data: merchantData, error: merchantError } = await db
            .from('merchants')
            .insert({
              name: businessName,
              website: website || null,
              status: 'pending',
            })
            .select('id')
            .single();

          if (merchantError) throw merchantError;

          // Assign owner role with merchant_id
          await db.from('user_roles').insert({
            user_id: signUpData.user.id,
            role: 'owner',
            merchant_id: (merchantData as any).id,
          });
        }

        toast.success('Account created! Your merchant account is pending admin approval. Check your email to verify.');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <img src={combatMarketLogo} alt="Combat Market" className="h-20 w-20" />
        </div>
        <Card className="border-border">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <Store className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-display text-xl">
              {isLogin ? 'Merchant Login' : 'Register as Merchant'}
            </CardTitle>
            <CardDescription>
              {isLogin ? 'Sign in to manage your missions and float' : 'Set up your business on Combat Market'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Your Full Name</Label>
                    <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Doe" required={!isLogin} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input id="businessName" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Acme Corp" required={!isLogin} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website (optional)</Label>
                    <Input id="website" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://example.com" />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@business.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Register Business'}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {isLogin ? "Don't have a merchant account? Register" : 'Already have an account? Sign in'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MerchantAuth;
