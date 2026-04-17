import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Underline as UnderlineIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Send,
  LayoutTemplate,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  Palette,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'motion/react';
import { generateArticle, GeneratedArticle } from '@/src/services/gemini';
import { Badge } from '@/components/ui/badge';
import { auth, db, handleFirestoreError, OperationType } from '../services/firebase';
import { doc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { CoverImageGenerator } from './CoverImageGenerator';
import { ABTestFramework } from './ABTestFramework';

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'bg-muted shadow-inner' : ''}
      >
        <Bold className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'bg-muted shadow-inner' : ''}
      >
        <Italic className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={editor.isActive('underline') ? 'bg-muted shadow-inner' : ''}
      >
        <UnderlineIcon className="w-4 h-4" />
      </Button>
      <div className="w-px h-6 bg-border mx-1 my-auto" />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={editor.isActive('heading', { level: 1 }) ? 'bg-muted shadow-inner' : ''}
      >
        <Heading1 className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive('heading', { level: 2 }) ? 'bg-muted shadow-inner' : ''}
      >
        <Heading2 className="w-4 h-4" />
      </Button>
      <div className="w-px h-6 bg-border mx-1 my-auto" />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'bg-muted shadow-inner' : ''}
      >
        <List className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? 'bg-muted shadow-inner' : ''}
      >
        <ListOrdered className="w-4 h-4" />
      </Button>
    </div>
  );
};

export function WeChatEditor() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
  const [currentArticle, setCurrentArticle] = useState<GeneratedArticle | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('content');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: 'Write something amazing...',
      }),
    ],
    content: `<h1>Welcome to WeChat AI Hub</h1><p>Start generating your viral content using the AI assistant on the right.</p>`,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[500px] max-w-none p-4 px-8',
      },
    },
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const article = await generateArticle(prompt);
      setCurrentArticle(article);
      const articleId = crypto.randomUUID();
      setActiveArticleId(articleId);
      
      const htmlContent = `
        <h1>${article.title}</h1>
        <p><strong>${article.introduction}</strong></p>
        ${article.sections.map(s => `
          <div style="margin: 20px 0; border: 1px solid #eee; border-radius: 8px; padding: 15px; background: #fafafa;">
            <h2 style="color: #07c160; border-left: 4px solid #07c160; padding-left: 10px;">${s.title}</h2>
            <div>${s.content}</div>
          </div>
        `).join('')}
        <p>${article.conclusion}</p>
        <div style="background: #07c160; color: white; padding: 15px; border-radius: 4px; text-align: center; margin-top: 30px;">
          ${article.cta}
        </div>
      `;
      editor?.commands.setContent(htmlContent);

      // Save to Firestore
      const user = auth.currentUser;
      if (user) {
        const articleRef = doc(db, 'articles', articleId);
        await setDoc(articleRef, {
          id: articleId,
          title: article.title,
          content: htmlContent,
          introduction: article.introduction,
          sections: article.sections,
          conclusion: article.conclusion,
          cta: article.cta,
          authorUid: user.uid,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'articles');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectCover = async (imageUrl: string) => {
    setCoverImageUrl(imageUrl);
    if (activeArticleId) {
      try {
        await updateDoc(doc(db, 'articles', activeArticleId), {
          coverImageUrl: imageUrl,
          updatedAt: Timestamp.now()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, 'articles');
      }
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
      {/* Editor Main Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${showChat ? 'mr-0' : 'mr-0'}`}>
        <div className="border-b bg-white px-8 flex items-center justify-between h-14 shrink-0">
          <Tabs value={activeSection} onValueChange={setActiveSection} className="w-auto">
            <TabsList className="bg-muted/50 border border-border/50 h-9 p-1">
              <TabsTrigger value="content" className="text-[11px] font-bold uppercase tracking-widest px-4 h-7">
                 <LayoutTemplate className="w-3.5 h-3.5 mr-2" /> Content
              </TabsTrigger>
              <TabsTrigger value="design" disabled={!activeArticleId} className="text-[11px] font-bold uppercase tracking-widest px-4 h-7">
                 <Palette className="w-3.5 h-3.5 mr-2" /> Visuals
              </TabsTrigger>
              <TabsTrigger value="experiment" disabled={!activeArticleId} className="text-[11px] font-bold uppercase tracking-widest px-4 h-7">
                 <FlaskConical className="w-3.5 h-3.5 mr-2" /> Experiment
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground/60 border-none">
              Auto-saved to Cloud
            </Badge>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="max-w-[1000px] mx-auto py-8 px-8">
            <AnimatePresence mode="wait">
              {activeSection === 'content' && (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <Card className="border-border shadow-sm overflow-hidden bg-white">
                    <MenuBar editor={editor} />
                    <EditorContent editor={editor} />
                  </Card>
                </motion.div>
              )}

              {activeSection === 'design' && activeArticleId && currentArticle && (
                <motion.div
                  key="design"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <CoverImageGenerator 
                    title={currentArticle.title} 
                    content={editor?.getHTML() || ''} 
                    onSelectCover={handleSelectCover}
                  />
                </motion.div>
              )}

              {activeSection === 'experiment' && activeArticleId && currentArticle && (
                <motion.div
                  key="experiment"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <ABTestFramework 
                    articleId={activeArticleId} 
                    initialTitle={currentArticle.title}
                    initialCoverUrl={coverImageUrl || ''}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>

      {/* AI Assistant Sidebar */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="w-[360px] border-l border-border bg-white flex flex-col"
          >
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-sm uppercase tracking-wider">AI Prompt Assistant</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowChat(false)} className="rounded-full h-8 w-8">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-6">
              <div className="p-4 bg-background border-l-4 border-primary rounded-r-lg mb-6 shadow-sm">
                <p className="text-[13px] leading-relaxed text-muted-foreground italic">
                  "Based on recent trends, I suggest a listicle structure focused on 'future-proofing' your digital workspace. Shall I proceed with the generation?"
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">Generation Command</label>
                  <Textarea
                    placeholder="What article should we create today?"
                    className="resize-none h-40 border-border bg-muted/5 focus-visible:ring-primary/20 text-sm"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                </div>
              </div>
            </ScrollArea>

            <div className="p-6 border-t bg-white">
              <Button 
                className="w-full h-11 font-bold uppercase text-xs tracking-widest transition-all rounded-lg" 
                disabled={isGenerating || !prompt} 
                onClick={handleGenerate}
              >
                {isGenerating ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="mr-2"
                  >
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                ) : <Send className="w-4 h-4 mr-2" />}
                {isGenerating ? 'Generating...' : 'Accept & Proceed'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showChat && (
        <Button
          variant="secondary"
          className="fixed right-4 bottom-4 rounded-full w-12 h-12 p-0 shadow-lg border"
          onClick={() => setShowChat(true)}
        >
          <Sparkles className="w-6 h-6" />
        </Button>
      )}
    </div>
  );
}
