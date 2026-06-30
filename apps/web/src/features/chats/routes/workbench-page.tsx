import { SendIcon } from 'lucide-react';
import { WorkbenchLayout } from '@/app/workbench-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

export function WorkbenchPage() {
  return (
    <WorkbenchLayout>
      <div className="flex min-h-screen flex-col">
        <header className="px-4 py-3">
          <h1 className="text-base font-semibold">Chat workbench</h1>
        </header>
        <Separator />
        <div className="flex-1 px-4 py-6 text-sm text-muted-foreground">
          Select a character and start a session.
        </div>
        <Separator />
        <form className="flex gap-2 p-3">
          <Input aria-label="Message" />
          <Button type="button" size="icon" aria-label="Send message">
            <SendIcon data-icon="inline-start" />
          </Button>
        </form>
      </div>
    </WorkbenchLayout>
  );
}
