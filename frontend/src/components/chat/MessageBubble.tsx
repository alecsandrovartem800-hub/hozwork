import React from 'react';
import { Message } from '@/types';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <div
      className={cn('flex flex-col max-w-[75%] space-y-1', {
        'self-end items-end': isOwn,
        'self-start items-start': !isOwn,
      })}
    >
      {/* Sender Name */}
      {!isOwn && (
        <span className="text-xs font-semibold text-gray-500 pl-2">
          {message.sender_name}
        </span>
      )}
      
      {/* Message Box */}
      <div
        className={cn('px-4 py-2.5 rounded-2xl text-sm font-sans', {
          'bg-green-700 text-white rounded-tr-none': isOwn,
          'bg-gray-100 text-gray-800 rounded-tl-none': !isOwn,
        })}
      >
        <p className="leading-relaxed whitespace-pre-wrap">{message.message_text}</p>
      </div>

      {/* Date */}
      <span className="text-[10px] text-gray-400 px-2">
        {formatDate(message.created_at)}
      </span>
    </div>
  );
}
