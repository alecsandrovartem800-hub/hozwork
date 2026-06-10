import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ChatWindow } from '@/components/chat/ChatWindow';

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function ChatPage({ params }: PageProps) {
  const { orderId } = await params;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 space-y-6">
        {/* Navigation back and header */}
        <div className="flex items-center space-x-3">
          <Link href="/account" className="text-sm font-semibold text-green-700 hover:text-green-800">
            &larr; Назад в кабинет
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-xl font-bold text-gray-900">
            Чат по заказу <span className="font-mono text-gray-500">#{orderId.substring(0, 8)}</span>
          </h1>
        </div>

        {/* Chat window container */}
        <ChatWindow orderId={orderId} />
      </main>

      <Footer />
    </div>
  );
}
