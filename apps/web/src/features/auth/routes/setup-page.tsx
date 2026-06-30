import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export function SetupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create admin</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="admin-email">Email</FieldLabel>
              <Input id="admin-email" type="email" />
            </Field>
            <Field>
              <FieldLabel htmlFor="admin-display-name">Display name</FieldLabel>
              <Input id="admin-display-name" />
            </Field>
            <Field>
              <FieldLabel htmlFor="admin-password">Password</FieldLabel>
              <Input id="admin-password" type="password" />
            </Field>
          </FieldGroup>
          <Button type="button">Create account</Button>
        </CardContent>
      </Card>
    </main>
  );
}
