'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Message } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth';
import { MessageBubble } from './MessageBubble';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';

interface ChatWindowProps {
  orderId: string;
}

export function ChatWindow({ orderId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, profile } = useAuthStore();
  const supabase = createClient();

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('order_id', orderId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (error: any) {
        console.error('Ошибка загрузки сообщений:', error);
        toast.error('Не удалось загрузить историю сообщений');
      }
    };

    fetchMessages();

    // Subscribe to realtime updates for this order's chat
    const channel = supabase
      .channel(`chat:${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // Добавляем только если его еще нет в списке
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, supabase]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;

    setSending(true);
    try {
      const senderName = profile?.role === 'admin' ? 'Администратор' : user.email || 'Клиент';
      
      const { error } = await supabase.from('chat_messages').insert({
        order_id: orderId,
        user_id: user.id,
        sender_name: senderName,
        message_text: inputText.trim(),
      });

      if (error) throw error;
      setInputText('');
    } catch (error: any) {
      console.error('Ошибка отправки сообщения:', error);
      toast.error('Не удалось отправить сообщение');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] border border-gray-100 rounded-2xl bg-white shadow-sm overflow-hidden">
      {/* Messages area */}
      <div className="flex-grow p-6 overflow-y-auto flex flex-col space-y-4 bg-gray-50/30">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm font-medium">Нет сообщений. Начните диалог с продавцом.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.user_id === user?.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-white flex items-center space-x-3">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Напишите сообщение..."
          disabled={sending}
          className="flex-grow bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700 disabled:opacity-50"
        />
        <Button
          type="submit"
          isLoading={sending}
          disabled={!inputText.trim()}
          className="px-5 py-3 rounded-xl font-bold cursor-pointer"
        >
          Отправить
        </Button>
      </form>
    </div>
  );
}
