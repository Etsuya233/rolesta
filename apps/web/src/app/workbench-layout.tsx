import { PanelRightCloseIcon } from 'lucide-react';
import { useState } from 'react';
import type { PropsWithChildren } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function WorkbenchLayout({ children }: PropsWithChildren) {
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  return (
    <main className="grid min-h-screen grid-cols-1 bg-background text-foreground lg:grid-cols-[260px_minmax(0,1fr)_320px]">
      <aside className="hidden p-3 lg:block">
        <div className="text-sm font-semibold">Rolesta</div>
        <nav className="mt-4 grid gap-1 text-sm text-muted-foreground">
          <span>Chats</span>
          <span>Characters</span>
          <span>Worldbooks</span>
          <span>Presets</span>
        </nav>
      </aside>
      <Separator orientation="vertical" className="hidden lg:block" />
      <section className="min-w-0">{children}</section>
      {rightPanelOpen ? (
        <aside className="hidden p-3 lg:block">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Runtime</div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRightPanelOpen(false)}
              aria-label="Close runtime panel"
            >
              <PanelRightCloseIcon data-icon="inline-start" />
            </Button>
          </div>
          <Card className="mt-3">
            <CardHeader>
              <CardTitle>Generation context</CardTitle>
              <CardDescription>Debug and model context will appear here.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              No generation is running.
            </CardContent>
          </Card>
        </aside>
      ) : null}
    </main>
  );
}
