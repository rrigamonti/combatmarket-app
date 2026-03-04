import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/integrations/supabase/db';
import { toast } from 'sonner';
import { ArrowLeft, Send } from 'lucide-react';

interface Mission {
  id: string;
  name: string;
  description: string | null;
  mission_type: string;
  reward_per_participant: number | null;
  evidence_type: string | null;
  status: string;
}

interface Participation {
  id: string;
  status: string;
}

interface Submission {
  id: string;
  status: string;
  evidence_url: string | null;
  evidence_notes: string | null;
  payout_amount: number | null;
  review_notes: string | null;
  created_at: string;
}

const FighterMissionDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mission, setMission] = useState<Mission | null>(null);
  const [participation, setParticipation] = useState<Participation | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    const fetchData = async () => {
      const { data: mData } = await db.from('missions').select('*').eq('id', id).single();
      setMission(mData as Mission | null);

      const { data: pData } = await db
        .from('mission_participations')
        .select('id, status')
        .eq('mission_id', id)
        .eq('fighter_id', user.id)
        .single();
      setParticipation(pData as Participation | null);

      const { data: sData } = await db
        .from('submissions')
        .select('*')
        .eq('mission_id', id)
        .eq('fighter_id', user.id)
        .order('created_at', { ascending: false });
      setSubmissions((sData as Submission[]) || []);
    };
    fetchData();
  }, [id, user]);

  const handleSubmit = async () => {
    if (!user || !id || !participation) return;
    setSubmitting(true);
    try {
      const { error } = await db.from('submissions').insert({
        mission_id: id,
        fighter_id: user.id,
        participation_id: participation.id,
        evidence_url: evidenceUrl || null,
        evidence_notes: evidenceNotes || null,
        evidence_type: mission?.evidence_type || 'text',
        status: 'pending',
      });
      if (error) throw error;

      // Update participation status
      await db.from('mission_participations')
        .update({ status: 'submitted' })
        .eq('id', participation.id);

      toast.success('Evidence submitted!');
      setEvidenceUrl('');
      setEvidenceNotes('');

      // Refresh
      const { data: sData } = await db
        .from('submissions')
        .select('*')
        .eq('mission_id', id)
        .eq('fighter_id', user.id)
        .order('created_at', { ascending: false });
      setSubmissions((sData as Submission[]) || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!mission) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/fighter/missions')}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Missions
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display">{mission.name}</h1>
          <p className="text-muted-foreground mt-1">{mission.description}</p>
        </div>
        <Badge variant="secondary" className="uppercase">{mission.mission_type}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Reward</CardTitle></CardHeader>
          <CardContent><span className="text-xl font-bold font-display">${mission.reward_per_participant || 0}</span></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Evidence Type</CardTitle></CardHeader>
          <CardContent><span className="text-xl font-bold font-display uppercase">{mission.evidence_type || 'Any'}</span></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Your Status</CardTitle></CardHeader>
          <CardContent><Badge>{participation?.status || 'Not joined'}</Badge></CardContent>
        </Card>
      </div>

      {/* Submit evidence */}
      {participation && !['submitted', 'approved', 'paid'].includes(participation.status) && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Submit Evidence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Evidence URL (link, image, etc.)</Label>
              <Input value={evidenceUrl} onChange={e => setEvidenceUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={evidenceNotes} onChange={e => setEvidenceNotes(e.target.value)} placeholder="Describe your submission..." />
            </div>
            <Button onClick={handleSubmit} disabled={submitting}>
              <Send className="h-4 w-4 mr-1" /> {submitting ? 'Submitting...' : 'Submit Evidence'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Submission history */}
      {submissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Your Submissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {submissions.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div>
                  <p className="text-sm">{s.evidence_notes || 'No notes'}</p>
                  <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()}</p>
                  {s.review_notes && <p className="text-xs text-yellow-400 mt-1">Review: {s.review_notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {s.payout_amount && <span className="text-sm font-mono text-green-400">${s.payout_amount}</span>}
                  <Badge variant={s.status === 'approved' ? 'default' : s.status === 'rejected' ? 'destructive' : 'secondary'}>
                    {s.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FighterMissionDetail;
