import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface BookRecommendation {
  title: string;
  author: string;
  year: number;
  cover_id: number;
}

interface RecommendationsProps {
  bookId: number;
}

const Recommendations: React.FC<RecommendationsProps> = ({ bookId }) => {
  const [recommendations, setRecommendations] = useState<BookRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await api.get(`/books/${bookId}/recommendations`);
        if (response.data.recommendations && response.data.recommendations.length > 0) {
          setRecommendations(response.data.recommendations);
        }
      } catch (error) {
        console.error("Failed to load recommendations", error);
        // Graceful degradation: ничего не показываем при ошибке
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [bookId]);

  if (loading || recommendations.length === 0) return null;

  return (
    <section style={{ marginTop: '3rem' }}>
      <h3 style={{ marginBottom: '1.5rem' }}>Похожие книги (от Open Library)</h3>
      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
        {recommendations.map((book, index) => (
          <div key={index} style={{ 
            minWidth: '150px', 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px', 
            padding: '1rem',
            background: 'white'
          }}>
            {book.cover_id ? (
              <img 
                src={`https://covers.openlibrary.org/b/id/${book.cover_id}-S.jpg`} 
                alt={book.title}
                style={{ width: '100%', borderRadius: '4px', marginBottom: '0.5rem' }}
                loading="lazy"
              />
            ) : (
              <div style={{ height: '100px', background: '#f1f5f9', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
            )}
            <p style={{ fontWeight: 'bold', fontSize: '0.9rem', margin: '0 0 0.25rem 0' }}>{book.title}</p>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>{book.author}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Recommendations;