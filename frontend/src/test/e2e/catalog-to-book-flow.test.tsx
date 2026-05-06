import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Catalog from '../../pages/Catalog';
import BookDetail from '../../pages/BookDetail';
import { UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';

const getBooksMock = vi.fn();
const getBookMock = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  booksAPI: {
    getBooks: (...args: unknown[]) => getBooksMock(...args),
    getBook: (...args: unknown[]) => getBookMock(...args),
  },
  exchangesAPI: {
    getMyExchanges: vi.fn(),
    getMyOffers: vi.fn(),
    createExchange: vi.fn(),
    acceptExchange: vi.fn(),
    rejectExchange: vi.fn(),
  },
}));

vi.mock('../../utils/SEO', () => ({
  SEO: () => null,
}));

const mockedUseAuth = vi.mocked(useAuth);

const book = {
  id: 1,
  title: 'Dune',
  author: 'Frank Herbert',
  description: 'Epic science fiction novel',
  genre: 'Фантастика',
  condition: 'good',
  cover: null,
  cover_url: null,
  owner_id: 1,
  owner: { id: 1, username: 'owner', city: 'Moscow', role: UserRole.USER },
  status: 'available',
  created_at: '2026-04-23T00:00:00Z',
  updated_at: null,
};

describe('catalog to book flow', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedUseAuth.mockReturnValue({ user: null } as never);
  });

  it('navigates from catalog card to book detail page', async () => {
    const user = userEvent.setup();

    getBooksMock.mockResolvedValue({
      data: {
        books: [book],
        total_count: 1,
        total_pages: 1,
        current_page: 1,
        limit: 10,
      },
    });
    getBookMock.mockResolvedValue({ data: book });

    render(
      <MemoryRouter initialEntries={['/catalog']}>
        <Routes>
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/book/:id" element={<BookDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(await screen.findByText('Dune'));

    expect(await screen.findByText('Детальная информация о книге')).toBeInTheDocument();
    expect(await screen.findByText('Epic science fiction novel')).toBeInTheDocument();
  });
});
