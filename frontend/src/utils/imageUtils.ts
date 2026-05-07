import { Book } from '../types';
import { buildCoverFallbackUrl } from '../config';

export const getCoverUrl = (book: Book) => {
  if (book.cover_url) return book.cover_url;
  if (book.cover) return buildCoverFallbackUrl(book.cover);
  return null;
};

export const getFallbackCoverUrl = (filename: string | null | undefined) =>
  buildCoverFallbackUrl(filename);
