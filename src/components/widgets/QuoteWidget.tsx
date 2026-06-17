import React, { useState, useEffect } from "react";
import { RotateCw, Quote as QuoteIcon } from "lucide-react";

interface Quote {
  text: string;
  author: string;
}

const LOCAL_QUOTES: Quote[] = [
  { text: "The only limit to our realization of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "The mind is everything. What you think you become.", author: "Buddha" },
  { text: "An unexamined life is not worth living.", author: "Socrates" },
  { text: "The best way to predict your future is to create it.", author: "Abraham Lincoln" },
  { text: "Make each day your masterpiece.", author: "John Wooden" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "Do one thing every day that scares you.", author: "Eleanor Roosevelt" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle Onassis" },
  { text: "You must be the change you wish to see in the world.", author: "Mahatma Gandhi" },
  { text: "Write it on your heart that every day is the best day in the year.", author: "Ralph Waldo Emerson" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "All our dreams can come true, if we have the courage to pursue them.", author: "Walt Disney" },
  { text: "Happiness is not something ready made. It comes from your own actions.", author: "Dalai Lama" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Keep your face always toward the sunshine—and shadows will fall behind you.", author: "Walt Whitman" },
  { text: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.", author: "Ralph Waldo Emerson" },
];

interface QuoteWidgetProps {
  announce?: (text: string) => void;
}

export const QuoteWidget: React.FC<QuoteWidgetProps> = ({ announce }) => {
  const [quote, setQuote] = useState<Quote>(LOCAL_QUOTES[0]);

  const getRandomQuote = (isInitial = false) => {
    const currentIndex = LOCAL_QUOTES.indexOf(quote);
    let newIndex = currentIndex;
    
    // Ensure we actually get a different quote
    while (newIndex === currentIndex && LOCAL_QUOTES.length > 1) {
      newIndex = Math.floor(Math.random() * LOCAL_QUOTES.length);
    }
    
    const nextQuote = LOCAL_QUOTES[newIndex];
    setQuote(nextQuote);
    if (!isInitial) {
      announce?.(`New quote loaded: "${nextQuote.text}" by ${nextQuote.author}`);
    }
  };

  // Select a random quote on mount
  useEffect(() => {
    getRandomQuote(true);
  }, []);

  return (
    <div className="w-full h-full flex flex-col justify-between items-center p-2 relative text-center select-none group">
      
      {/* Decorative Quote Icon */}
      <div className="absolute top-2 left-2 opacity-5 text-[var(--color-text-main)] pointer-events-none" aria-hidden="true">
        <QuoteIcon className="w-16 h-16" />
      </div>

      {/* Main Quote Text */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 max-w-xl">
        <blockquote className="text-xl sm:text-2xl font-bold italic leading-relaxed text-[var(--color-text-main)] transition-all duration-300">
          "{quote.text}"
        </blockquote>
        <cite className="text-sm sm:text-base font-bold text-blue-400 not-italic mt-3 block tracking-wide">
          — {quote.author}
        </cite>
      </div>

      {/* Control bar */}
      <div className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 mt-2">
        <button
          onClick={() => getRandomQuote(false)}
          className="py-1.5 px-4 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] text-xs font-bold rounded-lg border border-[var(--color-card-border)] text-[var(--color-text-main)] flex items-center accessible-focus"
          aria-label="Get another random quote"
        >
          <RotateCw className="w-3.5 h-3.5 mr-1.5" /> Next Quote
        </button>
      </div>
    </div>
  );
};
