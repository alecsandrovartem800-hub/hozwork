import { OrderStatus } from '@/types';

export function cn(...inputs: (string | undefined | null | boolean | { [key: string]: boolean })[]) {
  const classes: string[] = [];
  
  inputs.forEach((input) => {
    if (!input) return;
    
    if (typeof input === 'string') {
      classes.push(input);
    } else if (typeof input === 'object') {
      Object.entries(input).forEach(([key, value]) => {
        if (value) classes.push(key);
      });
    }
  });

  return classes.join(' ');
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(price)
    .replace('₽', '₽'); // Гарантирует правильный символ рубля
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function calculateDeposit(price: number, percent: number = 30): number {
  return Math.round((price * percent) / 100);
}

export function getStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pending: 'Ожидает оплаты залога',
    deposit_paid: 'Залог оплачен',
    processing: 'В обработке',
    shipped: 'Отправлен',
    delivered: 'Доставлен',
    completed: 'Выполнен',
    cancelled: 'Отменён',
    refunded: 'Залог возвращен',
  };
  return labels[status] || status;
}

export function getStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    deposit_paid: 'bg-orange-100 text-orange-800 border-orange-200',
    processing: 'bg-blue-100 text-blue-800 border-blue-200',
    shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    delivered: 'bg-teal-100 text-teal-800 border-teal-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    refunded: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}
