import React from 'react';
import { QuoteNode } from '../types';
import { SafeTextFormatter } from './SafeTextFormatter';

export interface QuoteNodeItemProps {
  key?: React.Key;
  quote: QuoteNode;
  chatId: string;
  isExpanded: boolean;
  onToggle: (quoteId: string) => void;
  expandedQuoteMap: Record<string, boolean>;
}

export function QuoteNodeItem({
  quote,
  chatId,
  isExpanded,
  onToggle,
  expandedQuoteMap
}: QuoteNodeItemProps) {
  return (
    <div className="quote-rail my-2 select-text" data-quote-id={quote.id}>
      {/* Quote Header: On [date], [from] <[email]> wrote: */}
      <div className="quote-header text-xs leading-tight select-text py-0.5 font-sans" style={{ color: 'var(--quote-header-text)' }}>
        <span>On {quote.date}, </span>
        <span className="font-semibold select-text" style={{ color: 'var(--quote-header-from)' }}>{quote.from}</span>
        <span> &lt;</span>
        <a
          href={`mailto:${quote.email}`}
          className="mb-link select-text"
          onClick={(e) => e.stopPropagation()}
        >
          {quote.email}
        </a>
        <span>&gt; wrote:</span>
      </div>

      {/* Local Ellipsis Toggle Button */}
      <div className="py-1 select-none">
        <button
          type="button"
          onClick={() => onToggle(quote.id)}
          className="quote-ellipsis-btn"
          title={isExpanded ? 'Collapse quoted email' : 'Expand quoted email'}
        >
          …
        </button>
      </div>

      {/* Quoted Body (Selectable text) */}
      <div className="quote-body text-[13px] leading-relaxed whitespace-pre-line select-text pl-1 py-1 font-sans" style={{ color: 'var(--quote-body-text)' }}>
        <SafeTextFormatter text={isExpanded ? quote.body : quote.preview} />
      </div>

      {/* Recursive Children (Rendered if parent node is expanded) */}
      {isExpanded && quote.children && quote.children.length > 0 && (
        <div className="mt-1">
          {quote.children.map((child) => (
            <QuoteNodeItem
              key={child.id}
              quote={child}
              chatId={chatId}
              isExpanded={!!expandedQuoteMap[child.id]}
              onToggle={onToggle}
              expandedQuoteMap={expandedQuoteMap}
            />
          ))}
        </div>
      )}
    </div>
  );
}
