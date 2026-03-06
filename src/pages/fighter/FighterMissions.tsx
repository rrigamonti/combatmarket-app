import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/integrations/supabase/db';
import { toast } from 'sonner';
import { Target, Users, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Mission {
  id: string;
  name: string;
  description: string | null;
  mission_type: string;
  reward_per_participant: number | null;
  max_participants: number | null;
  current_participants: number;
  end_date: string | null;
  image_url: string | null;
}

const FighterMissions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: missionData } = await db
        .from('missions')
        .select('id, name, description, mission_type, reward_per_participant, max_participants, current_participants, end_date, image_url')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      setMissions((missionData as Mission[]) || []);

      const { data: participations } = await db
        .from('mission_participations')
        .select('mission_id')
        .eq('fighter_id', user.id);

      setJoinedIds(new Set((participations as any[] || []).map((p: any) => p.mission_id)));
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const joinMission = async (missionId: string) => {
    if (!user) return;
    try {
      const { error } = await db.from('mission_participations').insert({
        mission_id: missionId,
        fighter_id: user.id,
        status: 'joined',
      });
      if (error) throw error;
      setJoinedIds(prev => new Set(prev).add(missionId));
      toast.success('You joined the mission!');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) return <div className="text-muted-foreground">Loading missions...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display">Available Missions</h1>
      {missions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No active missions available right now. Check back soon!
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {missions.map(m => (
            <Card key={m.id} className="flex flex-col overflow-hidden">
              {m.image_url && (
                <div className="w-full h-40 overflow-hidden">
                  <img src={m.image_url} alt={m.name} className="w-full h-full object-cover" />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="font-display text-lg">{m.name}</CardTitle>
                  <Badge variant="secondary" className="uppercase text-xs">{m.mission_type}</Badge>
                </div>
                <CardDescription className="line-clamp-2">{m.description || 'No description'}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between gap-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    {m.reward_per_participant ? `$${m.reward_per_participant}` : 'TBD'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {m.current_participants}/{m.max_participants || '∞'}
                  </span>
                  {m.end_date && (
                    <span className="text-xs">Ends {new Date(m.end_date).toLocaleDateString()}</span>
                  )}
                </div>
                {joinedIds.has(m.id) ? (
                  <Button variant="outline" onClick={() => navigate(`/fighter/missions/${m.id}`)}>
                    View Mission
                  </Button>
                ) : (
                  <Button onClick={() => joinMission(m.id)}>
                    <Target className="h-4 w-4 mr-1" /> Join Mission
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FighterMissions;
