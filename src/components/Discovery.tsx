import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Globe, TrendingUp, MessageSquare, Heart, Share2, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export function Discovery() {
  const [query, setQuery] = useState('');

  const trendingTopics = [
    { title: "AI in Workplace 2026", reach: "1.2M", posts: "420", growth: "+12%" },
    { title: "Sustainable Living Hack", reach: "850K", posts: "150", growth: "+5%" },
    { title: "Remote Work Efficiency", reach: "2.1M", posts: "890", growth: "+22%" },
    { title: "Digital Detox Trends", reach: "400K", posts: "95", growth: "-2%" },
  ];

  const results = [
    {
      title: "Why 2026 is the Year of the 'Quiet Creator'",
      account: "TechPulse China",
      reads: "100k+",
      likes: "1.2k",
      type: "Analysis",
      image: "https://picsum.photos/seed/tech/400/225"
    },
    {
      title: "10 Small Habits That Changed My Life in 30 Days",
      account: "Lifestyle Guru",
      reads: "50k+",
      likes: "800",
      type: "Emotional",
      image: "https://picsum.photos/seed/habits/400/225"
    },
    {
      title: "The Unspoken Rules of Workplace Communication",
      account: "Career Pro",
      reads: "80k+",
      likes: "1.5k",
      type: "Listicle",
      image: "https://picsum.photos/seed/work/400/225"
    }
  ];

  return (
    <div className="max-w-[1400px] mx-auto p-8 flex gap-8 h-[calc(100vh-64px)] overflow-hidden">
      {/* Search and Results */}
      <div className="flex-1 space-y-8 flex flex-col min-w-0">
        <header className="flex justify-between items-start">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Content Discovery</h1>
            <p className="text-sm text-muted-foreground">Monitoring global viral patterns and niche trend signals</p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Filter topics..." 
              className="pl-10 h-9 bg-white border-border text-xs"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </header>

        <ScrollArea className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
            {results.map((item, i) => (
              <Card key={i} className="overflow-hidden group cursor-pointer border-border bg-white shadow-sm hover:shadow-md transition-all">
                <div className="aspect-[21/9] relative overflow-hidden bg-muted">
                   <img 
                    src={item.image} 
                    alt={item.title} 
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-white/80 backdrop-blur text-[10px] font-bold uppercase tracking-widest text-primary border-none text-blue-600">
                      {item.type}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-bold leading-snug line-clamp-2 text-base text-foreground group-hover:text-primary transition-colors">{item.title}</h3>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{item.account}</p>
                  </div>
                  <div className="flex items-center gap-4 text-[12px] text-muted-foreground pt-2 border-t border-border/40">
                    <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> {item.reads}</span>
                    <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {item.likes}</span>
                    <Button variant="ghost" size="sm" className="ml-auto h-7 w-7 p-0 rounded-full hover:bg-primary/5">
                       <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Side Trends Bar */}
      <div className="w-[320px] space-y-6 shrink-0 h-full overflow-auto pr-2 pb-20">
        <Card className="shadow-sm border-border bg-white">
          <CardHeader className="pb-4 border-b border-border/50">
            <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              Trending Topics
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-1">
            {trendingTopics.map((topic, i) => (
              <div key={i} className="flex flex-col gap-1 py-3 border-b border-border/30 last:border-0 hover:bg-muted/5 transition-colors cursor-pointer rounded-lg px-2 -mx-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-foreground">{topic.title}</span>
                  <span className={`text-[10px] font-bold ${topic.growth.startsWith('+') ? 'text-accent' : 'text-red-500'}`}>
                    {topic.growth}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground/70 font-medium">
                  <span>{topic.reach} Potential Reach</span>
                  <span>{topic.posts} Posts</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Niche Clusters</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {['AI Productivity', 'Health & Wellness', 'Youth Lifestyle', 'Metaverse China', 'BNE Trends'].map(tag => (
              <Badge key={tag} variant="outline" className="text-[10px] py-0 px-2 font-medium border-border hover:bg-muted/50 transition-colors cursor-pointer">{tag}</Badge>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
