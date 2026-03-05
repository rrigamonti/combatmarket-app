import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { db } from '@/integrations/supabase/db';
import { toast } from 'sonner';
import { ArrowLeft, UserPlus, Users, Save } from 'lucide-react';

const AdminMissionManage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mission, setMission] = useState<any>(null);
  const [merchant, setMerchant] = useState<any>(null);
  const [fighters, setFighters] = useState<any[]>([]);
  const [assignedFighters, setAssignedFighters] = useState<string[]>([]);
  const [selectedFighters, setSelectedFighters] = useState<string[]>([]);
  const [instructions, setInstructions] = useState('');
  const [savingInstructions, setSavingInstructions] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchData();
  }, [id]);

  const fetchData = async () => {
    // Fetch mission
    const { data: m } = await db.from('missions').select('*').eq('id', id).single();
    setMission(m);
    if (m) setInstructions(m.instructions || '');
    if (m) {
      // Fetch merchant name
      const { data: merch } = await db.from('merchants').select('id, name').eq('id', m.merchant_id).single();
      setMerchant(merch);
    }

    // Fetch existing participations
    const { data: parts } = await db.from('mission_participations').select('fighter_id').eq('mission_id', id);
    const assigned = (parts || []).map(p => p.fighter_id);
    setAssignedFighters(assigned);

    // Fetch all fighters
    const { data: fighterRoles } = await db.from('user_roles').select('user_id').eq('role', 'fighter');
    const fighterIds = (fighterRoles || []).map(r => r.user_id);

    if (fighterIds.length > 0) {
      const { data: profiles } = await db.from('profiles').select('id, full_name, email');
      setFighters(
        (profiles || [])
          .filter(p => fighterIds.includes(p.id))
          .map(p => ({
            id: p.id,
            name: p.full_name || p.email || p.id.slice(0, 8),
            assigned: assigned.includes(p.id),
          }))
      );
    }
  };

  const toggleFighter = (fighterId: string) => {
    setSelectedFighters(prev =>
      prev.includes(fighterId) ? prev.filter(f => f !== fighterId) : [...prev, fighterId]
    );
  };

  const assignFighters = async () => {
    if (selectedFighters.length === 0) { toast.error('Select at least one fighter'); return; }
    setLoading(true);
    try {
      const participations = selectedFighters.map(fighterId => ({
        mission_id: id!,
        fighter_id: fighterId,
        status: 'joined' as const,
      }));
      const { error } = await db.from('mission_participations').insert(participations);
      if (error) throw error;
      toast.success(`${selectedFighters.length} fighter(s) assigned`);
      setSelectedFighters([]);
      fetchData();
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  if (!mission) return <div className="text-muted-foreground p-4">Loading...</div>;

  const unassignedFighters = fighters.filter(f => !f.assigned);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/admin/missions')}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        <h1 className="text-2xl font-display">Manage Mission</h1>
      </div>

      {/* Mission Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-display text-lg">{mission.name}</CardTitle>
            <Badge>{mission.status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-muted-foreground">Merchant:</span><br />{merchant?.name || '—'}</div>
            <div><span className="text-muted-foreground">Type:</span><br />{mission.mission_type}</div>
            <div><span className="text-muted-foreground">Budget:</span><br />${mission.budget?.toLocaleString() || '—'}</div>
            <div><span className="text-muted-foreground">Reward:</span><br />${mission.reward_per_participant || '—'}</div>
            <div><span className="text-muted-foreground">Participants:</span><br />{mission.current_participants || 0}/{mission.max_participants || '∞'}</div>
            <div><span className="text-muted-foreground">Evidence:</span><br />{mission.evidence_type}</div>
            <div><span className="text-muted-foreground">Validation:</span><br />{mission.validation_mode}</div>
          </div>
          {mission.description && <p className="mt-4 text-sm text-muted-foreground">{mission.description}</p>}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">📋 Fighter Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Step-by-step instructions visible to fighters</Label>
            <Textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              rows={6}
              placeholder={"1. Go to the merchant's location\n2. Complete the required action\n3. Take a photo as proof\n4. Upload the evidence"}
            />
          </div>
          <Button
            disabled={savingInstructions}
            onClick={async () => {
              setSavingInstructions(true);
              const { error } = await db.from('missions').update({ instructions: instructions || null }).eq('id', id!);
              setSavingInstructions(false);
              if (error) { toast.error(error.message); } else { toast.success('Instructions saved'); }
            }}
          >
            <Save className="h-4 w-4 mr-1" /> {savingInstructions ? 'Saving...' : 'Save Instructions'}
          </Button>
        </CardContent>
      </Card>

      {/* Assigned Fighters */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Users className="h-5 w-5" /> Assigned Fighters ({assignedFighters.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fighters.filter(f => f.assigned).length === 0 ? (
            <p className="text-sm text-muted-foreground">No fighters assigned yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {fighters.filter(f => f.assigned).map(f => (
                <Badge key={f.id} variant="secondary">{f.name}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign New Fighters */}
      {mission.status !== 'closed' && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <UserPlus className="h-5 w-5" /> Assign Fighters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {unassignedFighters.length === 0 ? (
              <p className="text-sm text-muted-foreground">All fighters are already assigned or no fighters registered.</p>
            ) : (
              <>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {unassignedFighters.map(f => (
                    <label key={f.id} className="flex items-center gap-3 p-3 rounded-md border border-border hover:bg-accent/50 cursor-pointer transition-colors">
                      <Checkbox checked={selectedFighters.includes(f.id)} onCheckedChange={() => toggleFighter(f.id)} />
                      <span className="font-medium text-sm">{f.name}</span>
                    </label>
                  ))}
                </div>
                <Button onClick={assignFighters} disabled={loading || selectedFighters.length === 0}>
                  <UserPlus className="h-4 w-4 mr-1" />
                  Assign {selectedFighters.length} Fighter(s)
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminMissionManage;
