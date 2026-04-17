import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, ImageIcon, Layout, Palette, Check, Loader2, AlertCircle } from 'lucide-react';
import { generateCoverDesignOptions, generateImageFromPrompt, CoverOption } from '@/src/services/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CoverImageGeneratorProps {
  title: string;
  content: string;
  onSelectCover: (imageUrl: string) => void;
}

export function CoverImageGenerator({ title, content, onSelectCover }: CoverImageGeneratorProps) {
  const [options, setOptions] = useState<CoverOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [renderingIndex, setRenderingIndex] = useState<number | null>(null);
  const [renderedImages, setRenderedImages] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  const handleGenerateOptions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const designOptions = await generateCoverDesignOptions(title, content);
      setOptions(designOptions);
    } catch (err) {
      setError('Failed to generate design concepts. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenderImage = async (index: number, prompt: string) => {
    setRenderingIndex(index);
    setError(null);
    try {
      const imageUrl = await generateImageFromPrompt(prompt);
      setRenderedImages(prev => ({ ...prev, [index]: imageUrl }));
    } catch (err) {
      setError('Failed to render image. Ensure your Gemini API supports image generation.');
      console.error(err);
    } finally {
      setRenderingIndex(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">AI Cover Studio</h2>
          <p className="text-sm text-muted-foreground">Strategic visuals designed for high click-through rates</p>
        </div>
        {!options.length && (
          <Button onClick={handleGenerateOptions} disabled={isLoading} className="font-bold uppercase text-[11px] tracking-widest">
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {isLoading ? 'Ideating Concepts...' : 'Generate Design Options'}
          </Button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3 text-destructive text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 rounded-2xl bg-muted/20 animate-pulse border border-border/50" />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AnimatePresence>
          {options.map((option, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="overflow-hidden border-border bg-white shadow-sm hover:shadow-md transition-all h-full flex flex-col">
                <div className="aspect-[16/9] relative bg-muted flex items-center justify-center overflow-hidden">
                  {renderedImages[idx] ? (
                    <img 
                      src={renderedImages[idx]} 
                      alt="Rendered Cover" 
                      className="object-cover w-full h-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
                      <ImageIcon className="w-10 h-10" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Preview Pending</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-white/90 backdrop-blur text-[10px] font-bold text-primary border-none text-blue-600">
                      Option {idx + 1}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-5 flex-1 flex flex-col space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                      <Layout className="w-3 h-3" />
                      <span>{option.style}</span>
                    </div>
                    <p className="text-[12px] leading-relaxed text-muted-foreground line-clamp-3 italic">
                      "{option.reasoning}"
                    </p>
                  </div>

                  <div className="pt-4 border-t border-border/40 space-y-4 mt-auto">
                    <div className="flex items-center justify-between">
                       <div className="flex gap-1.5">
                        {option.colorPalette.map(color => (
                          <div 
                            key={color} 
                            className="w-4 h-4 rounded-full border border-black/5 shadow-sm"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                      <div className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-tighter">
                        {option.textPlacement.title}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {!renderedImages[idx] ? (
                        <Button 
                          onClick={() => handleRenderImage(idx, option.prompt)}
                          disabled={renderingIndex !== null}
                          variant="outline"
                          className="flex-1 h-9 text-[11px] font-bold uppercase border-border/60"
                        >
                          {renderingIndex === idx ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Render Image'}
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => onSelectCover(renderedImages[idx])}
                          className="flex-1 h-9 text-[11px] font-bold uppercase bg-accent hover:bg-accent/90 border-none"
                        >
                          <Check className="w-3.5 h-3.5 mr-2" />
                          Apply Best
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
