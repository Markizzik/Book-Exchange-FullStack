import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Catalog from './Catalog';

const getBooksMock = vi.fn();

vi.mock('../services/api', () => ({
  booksAPI: {
    getBooks: (...args: unknown[]) => getBooksMock(...args),
  },
}));

const paginatedResponse = (books: Array<Record<string, unknown>>, totalPages = 1) => ({
  data: {
    books,
    total_count: books.length,
    total_pages: totalPages,
    current_page: 1,
    limit: 10,
  },
});

const duneBook = {
  id: 1,
  title: 'Dune',
  author: 'Frank Herbert',
  description: 'Epic science fiction novel',
  genre: 'Фантастика',
  condition: 'good',
  cover: null,
  cover_url: null,
  owner_id: 1,
  owner: { id: 1, username: 'owner', city: 'Moscow', role: 'user' },
  status: 'available',
  created_at: '2026-04-23T00:00:00Z',
  updated_at: null,
};

describe('Catalog page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('loads catalog and submits search on enter', async () => {
    const user = userEvent.setup();

    getBooksMock
      .mockResolvedValueOnce(paginatedResponse([duneBook]))
      .mockResolvedValueOnce(paginatedResponse([duneBook]));

    render(
      <MemoryRouter>
        <Catalog />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Dune')).toBeInTheDocument();
    expect(getBooksMock).toHaveBeenNthCalledWith(1, { page: 1, limit: 10 });

    await user.type(screen.getByPlaceholderText('Название, автор или описание...'), 'Dune{enter}');

    await waitFor(() => {
      expect(getBooksMock).toHaveBeenNthCalledWith(2, { page: 1, limit: 10, search: 'Dune' });
    });
  });

  it('applies genre filter and shows empty state', async () => {
    const user = userEvent.setup();

    getBooksMock
      .mockResolvedValueOnce(paginatedResponse([duneBook]))
      .mockResolvedValueOnce(paginatedResponse([]));

    render(
      <MemoryRouter>
        <Catalog />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Dune')).toBeInTheDocument();

    await user.selectOptions(screen.getByDisplayValue('Все жанры'), 'Фантастика');

    await waitFor(() => {
      expect(getBooksMock).toHaveBeenNthCalledWith(2, { page: 1, limit: 10, genre: 'Фантастика' });
    });

    expect(await screen.findByText('Книги не найдены')).toBeInTheDocument();
  });
});
