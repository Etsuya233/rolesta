import { describe, expect, it } from 'vitest';
import { RequestValidationPipe } from '../../http/request-validation.pipe.js';
import { AvatarCropRequestDto } from './character-requests.dto.js';

describe('AvatarCropRequestDto', () => {
  it('accepts normalized crop coordinates with browser precision', async () => {
    const pipe = new RequestValidationPipe();

    await expect(
      pipe.transform(
        {
          x: '0.123456789',
          y: '0.234567891',
          width: '0.5',
          height: '0.5',
        },
        { type: 'body', metatype: AvatarCropRequestDto },
      ),
    ).resolves.toMatchObject({
      x: 0.123456789,
      y: 0.234567891,
      width: 0.5,
      height: 0.5,
    });
  });
});
