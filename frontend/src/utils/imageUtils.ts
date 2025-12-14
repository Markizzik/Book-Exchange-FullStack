import { Book } from '../types';

export const getCoverUrl = (book: Book) => {
  if (book.cover_url) return book.cover_url;
  if (book.cover) return `http://localhost:8000/uploads/covers/${book.cover}`;
  return null;
};