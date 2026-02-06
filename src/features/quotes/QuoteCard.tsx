import { useState, useEffect } from 'react';
import { Quote, RefreshCw } from 'lucide-react';

// Fallback quotes for offline use
const offlineQuotes = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.", author: "Stephen King" },
  { text: "Focus looks like saying no.", author: "Steve Jobs" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "It always seems impossible until it is done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
];

interface QuoteData {
  text: string;
  author: string;
}

const QUOTE_STORAGE_KEY = 'current_quote';

// Get a random offline quote
const getRandomOfflineQuote = (): QuoteData => {
  const randomIndex = Math.floor(Math.random() * offlineQuotes.length);
  return offlineQuotes[randomIndex];
};

// Get initial quote from storage or use day-based selection
const getInitialQuote = (): QuoteData => {
  const saved = sessionStorage.getItem(QUOTE_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // Invalid JSON, fall through
    }
  }
  // Day-based quote for initial load
  const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
  return offlineQuotes[dayOfYear % offlineQuotes.length];
};

// Fetch quote from API
const fetchQuoteFromAPI = async (): Promise<QuoteData | null> => {
  try {
    // Using quotable.io - a free quotes API with no API key required
    const response = await fetch('https://api.quotable.io/random?tags=inspirational|motivational|success|wisdom');
    if (!response.ok) throw new Error('API error');
    const data = await response.json();
    return {
      text: data.content,
      author: data.author
    };
  } catch {
    // Try alternative API
    try {
      const response = await fetch('https://type.fit/api/quotes');
      if (!response.ok) throw new Error('API error');
      const quotes = await response.json();
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      return {
        text: randomQuote.text,
        author: randomQuote.author?.replace(', type.fit', '') || 'Unknown'
      };
    } catch {
      return null; // Both APIs failed
    }
  }
};

export const QuoteCard: React.FC = () => {
  const [quote, setQuote] = useState<QuoteData>(getInitialQuote);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Save quote to session storage whenever it changes
  useEffect(() => {
    sessionStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify(quote));
  }, [quote]);

  const refreshQuote = async () => {
    setIsRefreshing(true);

    // Try to fetch from API first
    const apiQuote = await fetchQuoteFromAPI();

    if (apiQuote) {
      setQuote(apiQuote);
    } else {
      // Fall back to offline quotes
      setQuote(getRandomOfflineQuote());
    }

    setIsRefreshing(false);
  };

  return (
    <div className="quote-card">
      <div className="quote-icon">
        <Quote size={24} />
      </div>

      <button
        className={`refresh-btn ${isRefreshing ? 'spinning' : ''}`}
        onClick={refreshQuote}
        aria-label="New quote"
        disabled={isRefreshing}
      >
        <RefreshCw size={18} />
      </button>

      <blockquote className="quote-text">
        "{quote.text}"
      </blockquote>
      <div className="quote-author">— {quote.author}</div>

      <style>{`
        .quote-card {
          background: var(--color-bg-card);
          color: var(--color-text-primary);
          padding: 1.5rem;
          border-radius: var(--radius-lg);
          position: relative;
          overflow: hidden;
          border: 1px solid var(--color-border);
          min-height: 120px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .quote-icon {
          color: var(--color-primary);
          opacity: 0.1;
          position: absolute;
          top: 0.75rem;
          left: 0.75rem;
          transform: scale(1.2);
        }

        .refresh-btn {
            position: absolute;
            top: 0.75rem;
            right: 0.75rem;
            background: transparent;
            border: 1px solid var(--color-border);
            color: var(--color-text-secondary);
            padding: 0.4rem;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2;
        }

        .refresh-btn:hover:not(:disabled) {
            background: var(--color-bg-secondary);
            color: var(--color-primary);
            border-color: var(--color-primary);
        }

        .refresh-btn:disabled {
            cursor: not-allowed;
            opacity: 0.7;
        }
        
        .refresh-btn.spinning {
             animation: spin 0.5s linear infinite;
        }

        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        .quote-text {
          font-size: 1.125rem;
          font-weight: 500;
          font-style: italic;
          margin-bottom: 0.5rem;
          position: relative;
          z-index: 1;
          margin-top: 1rem;
          line-height: 1.5;
        }

        .quote-author {
          text-align: right;
          font-size: 0.875rem;
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
};
