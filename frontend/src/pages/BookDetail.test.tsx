import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserRole } from '../types';
import BookDetail from './BookDetail';
import { useAuth } from '../context/AuthContext';

const getBookMock = vi.fn();
const getMyExchangesMock = vi.fn();
const getMyOffersMock = vi.fn();
const createExchangeMock = vi.fn();
const acceptExchangeMock = vi.fn();
const rejectExchangeMock = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../services/api', () => ({
  booksAPI: {
    getBook: (...args: unknown[]) => getBookMock(...args),
  },
  exchangesAPI: {
    getMyExchanges: (...args: unknown[]) => getMyExchangesMock(...args),
    getMyOffers: (...args: unknown[]) => getMyOffersMock(...args),
    createExchange: (...args: unknown[]) => createExchangeMock(...args),
    acceptExchange: (...args: unknown[]) => acceptExchangeMock(...args),
    rejectExchange: (...args: unknown[]) => rejectExchangeMock(...args),
  },
}));

vi.mock('../utils/SEO', () => ({
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

function renderBookDetail() {
  render(
    <MemoryRouter initialEntries={['/book/1']}>
      <Routes>
        <Route path="/book/:id" element={<BookDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('BookDetail page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('allows a non-owner to create exchange request', async () => {
    const user = userEvent.setup();

    mockedUseAuth.mockReturnValue({
      user: {
        id: 2,
        email: 'reader@example.com',
        username: 'reader',
        full_name: null,
        city: 'Moscow',
        about: null,
        role: UserRole.USER,
        is_active: true,
        created_at: '2026-04-23T00:00:00Z',
      },
    } as never);
    getBookMock.mockResolvedValue({ data: book });
    getMyExchangesMock
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({
        data: [
          {
            id: 10,
            book_id: 1,
            requester_id: 2,
            owner_id: 1,
            status: 'pending',
            created_at: '2026-04-23T00:00:00Z',
          },
        ],
      });
    createExchangeMock.mockResolvedValue({ data: { id: 10 } });

    renderBookDetail();

    expect(await screen.findByText('Dune')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Предложить обмен' }));

    await waitFor(() => {
      expect(createExchangeMock).toHaveBeenCalledWith({
        book_id: 1,
        requester_id: 2,
        owner_id: 1,
      });
    });

    expect(await screen.findByText('Уже отправлено предложение обмена')).toBeInTheDocument();
  });

  it('loads owner offers instead of requester history', async () => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: 1,
        email: 'owner@example.com',
        username: 'owner',
        full_name: null,
        city: 'Moscow',
        about: null,
        role: UserRole.USER,
        is_active: true,
        created_at: '2026-04-23T00:00:00Z',
      },
    } as never);
    getBookMock.mockResolvedValue({ data: book });
    getMyOffersMock.mockResolvedValue({
      data: [
        {
          id: 10,
          book_id: 1,
          requester_id: 2,
          owner_id: 1,
          status: 'pending',
          created_at: '2026-04-23T00:00:00Z',
          requester: {
            id: 2,
            email: 'reader@example.com',
            username: 'reader',
            full_name: null,
            city: 'Kazan',
            about: null,
            role: UserRole.USER,
            is_active: true,
            created_at: '2026-04-23T00:00:00Z',
          },
        },
      ],
    });

    renderBookDetail();

    expect(await screen.findByText('Текущие предложения обмена')).toBeInTheDocument();
    expect(await screen.findByText(/Предложение от пользователя reader/)).toBeInTheDocument();
    expect(getMyOffersMock).toHaveBeenCalledTimes(1);
    expect(getMyExchangesMock).not.toHaveBeenCalled();
  });
});
