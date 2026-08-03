import { promises as fs } from 'fs';

export async function compressPdf(filePath: string): Promise<void> {
  await fs.access(filePath);
}
