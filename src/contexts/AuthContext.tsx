import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { db } from '@/integrations/supabase/db';

interface UserRole {
  role: string;
  merchant_id: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: UserRole[];
  isAdmin: boolean;
  isFighter: boolean;
  isMerchant: boolean;
  merchantId: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  roles: [],
  isAdmin: false,
  isFighter: false,
  isMerchant: false,
  merchantId: null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<UserRole[]>([]);

  const fetchRoles = async (userId: string) => {
    const { data } = await db
      .from('user_roles')
      .select('role, merchant_id')
      .eq('user_id', userId);
    setRoles((data as UserRole[]) || []);
  };

  useEffect(() => {
    // Set up listener first (per Supabase docs, don't do async work inside callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Use setTimeout to avoid holding the auth lock
          setTimeout(() => {
            fetchRoles(session.user.id).then(() => setLoading(false));
          }, 0);
        } else {
          setRoles([]);
          setLoading(false);
        }
      }
    );

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRoles(session.user.id).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = roles.some(r => r.role === 'admin');
  const isFighter = roles.some(r => r.role === 'fighter');
  const isMerchant = roles.some(r => ['owner', 'marketing', 'finance', 'analyst', 'support'].includes(r.role));
  const merchantId = roles.find(r => r.merchant_id)?.merchant_id ?? null;

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, roles, isAdmin, isFighter, isMerchant, merchantId, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
