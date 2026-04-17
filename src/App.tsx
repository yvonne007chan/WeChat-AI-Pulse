/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  PenTool, 
  BarChart2, 
  Search, 
  Settings, 
  Sparkles,
  Bell,
  User as UserIcon,
  LogOut,
  LogIn
} from 'lucide-react';
import { WeChatEditor } from './components/WeChatEditor';
import { ViralAnalyzer } from './components/ViralAnalyzer';
import { Discovery } from './components/Discovery';
import { Button } from '@/components/ui/button';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ErrorBoundary } from './components/ErrorBoundary';
import { auth, db, googleProvider, syncUserProfile } from './services/firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await syncUserProfile(u);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Sparkles className="w-8 h-8 text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground animate-pulse">Initializing Pulse...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-muted/5">
        <Card className="w-[400px] p-8 space-y-6 text-center shadow-xl border-none">
          <div className="flex justify-center">
             <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center rotate-3">
                <Sparkles className="w-10 h-10 text-primary-foreground" />
              </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Welcome to AI Pulse</h1>
            <p className="text-sm text-muted-foreground">The all-in-one AI operating system for WeChat creators.</p>
          </div>
          <Button onClick={() => signInWithPopup(auth, googleProvider)} className="w-full h-12 text-lg">
            <LogIn className="w-5 h-5 mr-2" />
            Sign in with Google
          </Button>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

function Dashboard() {
  const [recentArticles, setRecentArticles] = useState<any[]>([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'articles'),
      where('authorUid', '==', user.uid),
      orderBy('updatedAt', 'desc'),
      limit(5)
    );

    return onSnapshot(q, (snapshot) => {
      setRecentArticles(snapshot.docs.map(doc => doc.data()));
    });
  }, []);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex justify-between items-start mb-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Production Dashboard</h1>
          <p className="text-sm text-muted-foreground">Monitoring viral trends and AI generation pipelines</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-border">Search Archives</Button>
          <Button className="bg-primary hover:primary">
            + New Article
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-border bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Avg. Viral Prediction</CardTitle>
            <span className="text-[10px] font-bold text-accent">↑ 12%</span>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-extrabold tracking-tighter text-accent">84.2</div>
            <p className="text-[11px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">High Viral Potential (Sector: Tech)</p>
            <p className="mt-4 text-[12px] text-muted-foreground leading-relaxed">
              Top factors: Curiosity Hook (92%), <br />Keyword Density (78%), Cover CTA (85%).
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border md:col-span-2 bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Trending Topic Clusters (Real-time)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border/50">
              {[
                { topic: '#GenerativeAI', growth: '340%', reads: '1.2M' },
                { topic: '#RemoteWorkEthics', growth: '180%', reads: '850K' },
                { topic: '#DigitalNomadChina', growth: '92%', reads: '410K' }
              ].map((row, i) => (
                <div key={i} className="py-3 flex justify-between items-center group cursor-pointer hover:bg-muted/5 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-foreground">{row.topic}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Growth in 24h: {row.growth} • {row.reads} Reads</p>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold uppercase transition-all opacity-0 group-hover:opacity-100">Analyze</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>Your last 5 article drafts and analysis reports.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentArticles.length > 0 ? recentArticles.map((article, i) => (
                <div key={article.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                      <PenTool className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{article.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {article.updatedAt?.toDate ? article.updatedAt.toDate().toLocaleString() : 'Just now'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">Draft</Badge>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground text-sm italic">
                  No articles yet. Start by generating one in the AI Creator!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Trending Patterns</CardTitle>
            <CardDescription>Viral structures frequently used this week.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
               <div className="flex items-center gap-4">
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[75%]"></div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">75%</span>
                  <span className="text-xs text-muted-foreground shrink-0 w-24">Emotional Hook</span>
               </div>
               <div className="flex items-center gap-4">
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[62%]"></div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">62%</span>
                  <span className="text-xs text-muted-foreground shrink-0 w-24">Listicle Structure</span>
               </div>
               <div className="flex items-center gap-4">
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[45%]"></div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">45%</span>
                  <span className="text-xs text-muted-foreground shrink-0 w-24">Storytelling</span>
               </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'creator':
        return <WeChatEditor />;
      case 'analyzer':
        return <ViralAnalyzer />;
      case 'discovery':
        return <Discovery />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ErrorBoundary>
      <AuthGuard>
        <SidebarProvider>
          <div className="min-h-screen flex w-full bg-background font-sans">
        <Sidebar className="w-60 border-r border-border">
          <SidebarHeader className="p-6 border-b">
            <div className="flex items-center gap-2">
              <span className="text-primary text-xl font-extrabold tracking-tighter">◈</span>
              <span className="font-extrabold text-lg tracking-tight text-foreground">WeChat AI Hub</span>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-4">
            <div className="mb-6 px-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Core Modules</p>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={activeTab === 'dashboard'} 
                    onClick={() => setActiveTab('dashboard')}
                    className="hover:bg-primary/10 active:scale-[0.98] transition-all rounded-lg"
                  >
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={activeTab === 'creator'} 
                    onClick={() => setActiveTab('creator')}
                    className="hover:bg-primary/10 active:scale-[0.98] transition-all rounded-lg"
                  >
                    <PenTool className="w-4 h-4 mr-2" />
                    AI Chat Generator
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={activeTab === 'analyzer'} 
                    onClick={() => setActiveTab('analyzer')}
                    className="hover:bg-primary/10 active:scale-[0.98] transition-all rounded-lg"
                  >
                    <BarChart2 className="w-4 h-4 mr-2" />
                    Viral Analysis
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={activeTab === 'discovery'} 
                    onClick={() => setActiveTab('discovery')}
                    className="hover:bg-primary/10 active:scale-[0.98] transition-all rounded-lg"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Content Discovery
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
            
            <div className="px-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">System</p>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton className="text-muted-foreground hover:bg-muted/50 rounded-lg">
                    <Settings className="w-4 h-4 mr-2" />
                    API Settings
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 border-b bg-background/50 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-8">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground capitalize">
                {activeTab}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background"></span>
              </Button>
              <div className="w-px h-6 bg-border mx-2" />
              <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => signOut(auth)}>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold">{auth.currentUser?.displayName || 'User'}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sign Out <LogOut className="inline w-2 h-2" /></p>
                </div>
                <div className="w-8 h-8 rounded-full bg-muted border flex items-center justify-center overflow-hidden">
                  {auth.currentUser?.photoURL ? <img src={auth.currentUser.photoURL} alt="Avatar" /> : <UserIcon className="w-4 h-4" />}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto bg-muted/5">
            {renderContent()}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
      </AuthGuard>
    </ErrorBoundary>
  );
}
