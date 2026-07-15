import Cropper, { type Area } from 'react-easy-crop';
import { ImagePlus, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { getCharacter, deleteCharacterAvatar, uploadCharacterAvatar } from '../api/characters-api';

export function CharacterAvatarEditor({
  characterId,
  name,
  avatar,
}: {
  characterId: string;
  name: string;
  avatar: { sources: Record<string, string> } | null;
}) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [pending, setPending] = useState(false);

  const closeCropper = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setArea(null);
  };

  const chooseFile = (next: File | undefined) => {
    if (!next) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(next);
    setPreviewUrl(URL.createObjectURL(next));
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const save = async () => {
    if (!file || !area) return;
    setPending(true);
    try {
      const image = await imageSize(previewUrl!);
      await uploadCharacterAvatar(characterId, file, {
        x: area.x / image.width,
        y: area.y / image.height,
        width: area.width / image.width,
        height: area.height / image.height,
      });
      await queryClient.invalidateQueries({ queryKey: ['characters'] });
      await queryClient.fetchQuery({
        queryKey: ['characters', characterId],
        queryFn: () => getCharacter(characterId),
      });
      closeCropper();
    } finally {
      setPending(false);
    }
  };

  const remove = async () => {
    setPending(true);
    try {
      await deleteCharacterAvatar(characterId);
      await queryClient.invalidateQueries({ queryKey: ['characters'] });
      await queryClient.fetchQuery({
        queryKey: ['characters', characterId],
        queryFn: () => getCharacter(characterId),
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3">
      <Avatar size="lg">
        {avatar ? (
          <AvatarImage alt={name} src={avatar.sources['128'] ?? avatar.sources['64']} />
        ) : null}
        <AvatarFallback className="bg-primary/10 font-semibold text-primary">
          {name.slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <input
        ref={inputRef}
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        type="file"
        onChange={(event) => chooseFile(event.target.files?.[0])}
      />
      <Button
        size="icon-sm"
        title="更换头像"
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlus />
      </Button>
      {avatar ? (
        <Button
          disabled={pending}
          size="icon-sm"
          title="删除头像"
          type="button"
          variant="ghost"
          onClick={() => void remove()}
        >
          <Trash2 />
        </Button>
      ) : null}
      {previewUrl ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-lg bg-background shadow-xl">
            <div className="relative aspect-square bg-muted">
              <Cropper
                aspect={1}
                crop={crop}
                image={previewUrl}
                zoom={zoom}
                onCropChange={setCrop}
                onCropComplete={(_, pixels) => setArea(pixels)}
                onZoomChange={setZoom}
              />
            </div>
            <div className="flex items-center gap-3 border-t p-3">
              <Input
                aria-label="缩放"
                max="3"
                min="1"
                step="0.01"
                type="range"
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
              />
              <Button disabled={pending} type="button" variant="outline" onClick={closeCropper}>
                取消
              </Button>
              <Button disabled={pending || !area} type="button" onClick={() => void save()}>
                保存
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function imageSize(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = reject;
    image.src = url;
  });
}
