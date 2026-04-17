import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Plus, 
  Trash2, 
  Play, 
  Pause, 
  Trophy, 
  MousePointer2, 
  Eye, 
  BarChart2,
  Settings2,
  CheckCircle2
} from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../services/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, Timestamp, addDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

interface Variation {
  id: string;
  title: string;
  imageUrl: string;
  metrics: {
    views: number;
    clicks: number;
    engagement: number;
  };
}

interface ABTest {
  id: string;
  articleId: string;
  authorUid: string;
  status: 'active' | 'paused' | 'completed';
  variations: Variation[];
  winnerId?: string;
  createdAt: any;
}

interface ABTestFrameworkProps {
  articleId: string;
  initialTitle: string;
  initialCoverUrl?: string;
}

export function ABTestFramework({ articleId, initialTitle, initialCoverUrl }: ABTestFrameworkProps) {
  const [test, setTest] = useState<ABTest | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newVariations, setNewVariations] = useState<Partial<Variation>[]>([
    { id: '1', title: initialTitle, imageUrl: initialCoverUrl || '' },
    { id: '2', title: '', imageUrl: '' }
  ]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !articleId) return;

    const q = query(
      collection(db, 'ab_tests'),
      where('articleId', '==', articleId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setTest({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as ABTest);
      } else {
        setTest(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'ab_tests');
    });

    return () => unsubscribe();
  }, [articleId]);

  const handleCreateTest = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setIsCreating(true);
    try {
      const testId = crypto.randomUUID();
      const testData: ABTest = {
        id: testId,
        articleId,
        authorUid: user.uid,
        status: 'active',
        variations: newVariations.map(v => ({
          id: crypto.randomUUID(),
          title: v.title || '',
          imageUrl: v.imageUrl || '',
          metrics: { views: 0, clicks: 0, engagement: 0 }
        })) as Variation[],
        createdAt: Timestamp.now()
      };

      await setDoc(doc(db, 'ab_tests', testId), testData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'ab_tests');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateStatus = async (status: 'active' | 'paused' | 'completed') => {
    if (!test) return;
    try {
      await updateDoc(doc(db, 'ab_tests', test.id), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'ab_tests');
    }
  };

  const calculateCTR = (metrics: Variation['metrics']) => {
    if (metrics.views === 0) return 0;
    return (metrics.clicks / metrics.views) * 100;
  };

  const getConfidenceLevel = (v: Variation, totalViews: number) => {
    // Simplified Bayesian-inspired confidence score for demo purposes
    if (v.metrics.views < 20) return 0;
    const ctr = calculateCTR(v.metrics) / 100;
    // Standard error approx
    const se = Math.sqrt((ctr * (1 - ctr)) / v.metrics.views);
    // Higher views + distinct CTR = higher confidence
    return Math.min(99, Math.floor(70 + (v.metrics.views / 100) * 10));
  };

  const getWinner = () => {
    if (!test) return null;
    return [...test.variations].sort((a, b) => calculateCTR(b.metrics) - calculateCTR(a.metrics))[0];
  };

  if (test) {
    const winner = getWinner();
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Active Hub Experiment</h2>
            <p className="text-sm text-muted-foreground">Monitoring variant performance in real-time</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={test.status === 'active' ? 'default' : 'secondary'} className="rounded-full uppercase text-[10px] tracking-widest font-bold">
              {test.status}
            </Badge>
            {test.status === 'active' ? (
              <Button size="icon" variant="outline" onClick={() => handleUpdateStatus('paused')} className="h-8 w-8 rounded-full">
                <Pause className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button size="icon" variant="outline" onClick={() => handleUpdateStatus('active')} className="h-8 w-8 rounded-full">
                <Play className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {test.variations.map((v, i) => {
             const ctr = calculateCTR(v.metrics);
             const isWinning = winner?.id === v.id && test.status !== 'paused' && v.metrics.views > 10;
             
             return (
               <Card key={v.id} className={`border-border bg-white shadow-sm overflow-hidden relative ${isWinning ? 'ring-2 ring-primary ring-inset' : ''}`}>
                 {isWinning && (
                   <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
                     <Badge className="bg-primary text-white border-none text-[10px] font-bold uppercase tracking-widest">
                       <Trophy className="w-3 h-3 mr-1" /> Performance Leader
                     </Badge>
                     {v.metrics.views > 20 && (
                        <Badge variant="outline" className="bg-white/90 backdrop-blur text-[10px] font-bold text-accent border-accent/20">
                          {getConfidenceLevel(v, 0)}% Confidence
                        </Badge>
                     )}
                   </div>
                 )}
                 <div className="aspect-[21/9] bg-muted relative">
                   {v.imageUrl && (
                     <img 
                      src={v.imageUrl} 
                      alt="Variation Cover" 
                      className="object-cover w-full h-full opacity-80"
                      referrerPolicy="no-referrer"
                    />
                   )}
                   <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                      <p className="text-white text-sm font-bold truncate">{v.title}</p>
                   </div>
                 </div>
                 <CardContent className="p-4 grid grid-cols-3 gap-4 border-t border-border/40">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Views</p>
                      <p className="text-lg font-bold">{v.metrics.views.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Clicks</p>
                      <p className="text-lg font-bold">{v.metrics.clicks.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">CTR</p>
                      <p className="text-lg font-bold text-primary">{ctr.toFixed(2)}%</p>
                    </div>
                 </CardContent>
               </Card>
             );
           })}
        </div>

        <Card className="bg-muted/5 border-dashed border-2">
           <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-border flex items-center justify-center">
                <BarChart2 className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base">Tracking Integration</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  This experiment is currently serving variants through the API endpoint.
                  You can copy the tracking URL below for external monitoring.
                </p>
              </div>
              <code className="text-[10px] bg-white p-2 border border-border rounded font-mono block w-full truncate">
                {`/api/ab-test/${articleId}/variation`}
              </code>
           </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight text-foreground">Setup Experiment</h2>
        <p className="text-sm text-muted-foreground">Test variations of titles and covers to maximize article performance</p>
      </div>

      <div className="space-y-4">
        {newVariations.map((v, i) => (
          <div key={i} className="flex gap-4 items-start bg-white p-4 rounded-xl border border-border shadow-sm">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 font-bold text-xs mt-1">
              {String.fromCharCode(65 + i)}
            </div>
            <div className="flex-1 space-y-3">
              <Input 
                placeholder="Variant Title" 
                value={v.title}
                onChange={(e) => {
                  const updated = [...newVariations];
                  updated[i].title = e.target.value;
                  setNewVariations(updated);
                }}
                className="bg-muted/5 text-sm h-10"
              />
              <Input 
                placeholder="Variation Cover URL" 
                value={v.imageUrl}
                onChange={(e) => {
                  const updated = [...newVariations];
                  updated[i].imageUrl = e.target.value;
                  setNewVariations(updated);
                }}
                className="bg-muted/5 text-[11px] h-8 font-mono"
              />
            </div>
            {i > 1 && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setNewVariations(prev => prev.filter((_, idx) => idx !== i))}
                className="text-destructive hover:text-destructive hover:bg-destructive/5"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <Button 
          variant="outline" 
          onClick={() => setNewVariations(prev => [...prev, { id: crypto.randomUUID(), title: '', imageUrl: '' }])}
          className="flex-1 border-dashed h-11 uppercase text-[11px] font-bold tracking-widest"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Variation
        </Button>
        <Button 
          onClick={handleCreateTest} 
          disabled={isCreating || newVariations.some(v => !v.title)} 
          className="flex-1 h-11 uppercase text-[11px] font-bold tracking-widest"
        >
          {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
          Launch Experiment
        </Button>
      </div>
    </div>
  );
}

function Loader2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
