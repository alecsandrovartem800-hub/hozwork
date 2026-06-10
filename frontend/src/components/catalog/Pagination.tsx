'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`/catalog?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-center space-x-2 py-4">
      {/* Prev */}
      <Button
        variant="secondary"
        size="sm"
        disabled={currentPage <= 1}
        onClick={() => handlePageChange(currentPage - 1)}
        className="cursor-pointer"
      >
        Назад
      </Button>

      {/* Pages list */}
      {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => handlePageChange(page)}
          className="w-9 h-9 p-0 rounded-xl cursor-pointer"
        >
          {page}
        </Button>
      ))}

      {/* Next */}
      <Button
        variant="secondary"
        size="sm"
        disabled={currentPage >= totalPages}
        onClick={() => handlePageChange(currentPage + 1)}
        className="cursor-pointer"
      >
        Вперед
      </Button>
    </div>
  );
}
