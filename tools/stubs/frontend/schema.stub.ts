import { z } from 'zod';

export const create{{Model}}Schema = z.object({
{{zodFields}}
});

export const update{{Model}}Schema = create{{Model}}Schema.partial();

export type Create{{Model}}Input = z.infer<typeof create{{Model}}Schema>;
export type Update{{Model}}Input = z.infer<typeof update{{Model}}Schema>;
