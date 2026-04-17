import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Search, 
  BarChart3, 
  CheckCircle2, 
  AlertTriangle,
  Lightbulb,
  MousePointerClick,
  TrendingUp,
  Files
} from 'lucide-react';
import { analyzeArticle, ViralAnalysis } from '@/src/services/gemini';
import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';
import { auth, db, handleFirestoreError, OperationType } from '../services/firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';

export function ViralAnalyzer() {
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<ViralAnalysis | null>(null);

  const handleAnalyze = async () => {
    if (!content.trim()) return;
    setIsAnalyzing(true);
    try {
      const data = await analyzeArticle(content);
      setReport(data);

      // Save to Firestore
      const user = auth.currentUser;
      if (user) {
        const reportId = crypto.randomUUID();
        const reportRef = doc(db, 'analysis_reports', reportId);
        await setDoc(reportRef, {
          ...data,
          id: reportId,
          authorUid: user.uid,
          createdAt: Timestamp.now()
        });
      }
    } catch (error) {
       handleFirestoreError(error, OperationType.WRITE, 'analysis_reports');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const ScoreCard = ({ title, score, icon: Icon, color, isMain }: any) => (
    <Card className={`relative overflow-hidden shadow-sm border-border ${isMain ? 'ring-1 ring-accent/20' : ''}`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <div className={`p-2 rounded-lg ${isMain ? 'bg-accent/10' : `bg-${color}-500/10`}`}>
            <Icon className={`w-5 h-5 ${isMain ? 'text-accent' : `text-${color}-500`}`} />
          </div>
          <span className={`text-2xl font-extrabold ${isMain ? 'text-accent' : 'text-foreground'}`}>{score}</span>
        </div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
        <Progress value={score} className={`h-1.5 mt-4 ${isMain ? '[&>div]:bg-accent' : ''}`} />
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-[1200px] mx-auto p-8 space-y-8">
      <header className="flex justify-between items-start mb-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Viral Analysis</h1>
          <p className="text-sm text-muted-foreground">Monitoring viral trends and content DNA performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs font-semibold">Search Archives</Button>
          <Button size="sm" className="h-8 text-xs font-semibold bg-primary hover:bg-primary/90">
             + New Report
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Content Input</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder="Paste your article draft or content description here..."
                className="min-h-[300px] resize-none border-border bg-muted/5 focus-visible:ring-primary/20 text-sm leading-relaxed"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <Button 
                className="w-full h-11 text-sm font-bold uppercase tracking-wide bg-primary hover:bg-primary/90 transition-all rounded-lg" 
                onClick={handleAnalyze} 
                disabled={isAnalyzing || !content}
              >
                {isAnalyzing ? "Scanning Viral DNA..." : "Scan Viral Potential"}
                <Zap className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {report && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <Card className="shadow-sm border-border bg-white">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Viral Optimized Titles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {report.improvedTitles.map((t, i) => (
                    <div key={i} className="p-3 bg-muted/5 rounded-lg border border-border/60 text-sm hover:border-primary/40 transition-colors cursor-pointer text-foreground font-medium">
                      {t}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border bg-white">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-accent" />
                    Growth Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                   <ul className="space-y-3">
                     {report.suggestions.map((s, i) => (
                       <li key={i} className="flex gap-4 p-3 rounded-lg bg-muted/5 border border-transparent hover:border-border/50 transition-all">
                         <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                           <CheckCircle2 className="w-3 h-3 text-accent" />
                         </div>
                         <p className="text-sm text-muted-foreground">{s}</p>
                       </li>
                     ))}
                   </ul>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        <div className="space-y-6">
          {report ? (
            <div className="grid grid-cols-1 gap-4">
              <ScoreCard title="Avg. Viral Prediction" score={report.viralScore} icon={TrendingUp} isMain />
              <ScoreCard title="Title Hook Impact" score={report.titleScore} icon={MousePointerClick} color="blue" />
              <ScoreCard title="Opening Rhythm" score={report.hookScore} icon={Files} color="emerald" />
              <ScoreCard title="Content Structure" score={report.structureScore} icon={BarChart3} color="indigo" />
              
              <Card className="shadow-sm border-border bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Detected Patterns</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {report.patterns.map((p, i) => (
                    <Badge key={i} variant="secondary" className="px-2 py-0.5 text-[11px] font-semibold bg-primary/5 text-primary border-transparent">{p}</Badge>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : (
             <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-2xl bg-muted/5 border-border">
                <div className="w-16 h-16 rounded-full bg-white shadow-sm border border-border flex items-center justify-center mb-6">
                   <BarChart3 className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-bold text-lg text-foreground tracking-tight">No Analysis Ready</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-[200px] mx-auto">Enter content on the left to see the viral score and optimization roadmap.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
