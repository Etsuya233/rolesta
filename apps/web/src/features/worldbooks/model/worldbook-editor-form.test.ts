import { describe, expect, it } from 'vitest';
import { emptyWorldbookEntryEditorForm } from './worldbook-editor-form.js';

describe('emptyWorldbookEntryEditorForm', () => {
  it('uses the SillyTavern default insertion depth', () => {
    expect(emptyWorldbookEntryEditorForm.depth).toBe(4);
  });
});
