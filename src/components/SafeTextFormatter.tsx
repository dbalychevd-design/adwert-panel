import React from 'react';

export function SafeTextFormatter({ text }: { text: string }) {
  if (!text) return null;

  const tokenRegex = /(https?:\/\/[^\s]+|cal\.com\/[^\s]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.includes('@') && !token.startsWith('http')) {
      parts.push(
        <a
          key={`email-${match.index}`}
          href={`mailto:${token}`}
          className="mb-link font-medium select-text"
          onClick={(e) => e.stopPropagation()}
        >
          {token}
        </a>
      );
    } else {
      const href = token.startsWith('http') ? token : `https://${token}`;
      parts.push(
        <a
          key={`link-${match.index}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-link font-medium select-text"
          onClick={(e) => e.stopPropagation()}
        >
          {token}
        </a>
      );
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <span className="selectable-text">{parts}</span>;
}
