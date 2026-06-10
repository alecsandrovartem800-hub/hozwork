import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-300 border-t border-gray-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand */}
          <div className="space-y-4">
            <h3 className="text-xl font-black text-white tracking-wider">HOZWORK</h3>
            <p className="text-sm text-gray-400">
              Поставка качественных хозяйственных товаров для клининга, офисов, производств и дома.
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Навигация</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/catalog" className="hover:text-green-500 transition-colors">
                  Каталог товаров
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-green-500 transition-colors">
                  О нас
                </Link>
              </li>
              <li>
                <Link href="/contacts" className="hover:text-green-500 transition-colors">
                  Контакты
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Contacts */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Контакты</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center space-x-2">
                <span>📍 г. Москва, ул. Ленина, д. 100</span>
              </li>
              <li className="flex items-center space-x-2">
                <span>📞 +7 (495) 000-00-00</span>
              </li>
              <li className="flex items-center space-x-2">
                <span>✉️ info@hozwork.ru</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Important warning */}
          <div className="bg-orange-950/40 border border-orange-900/30 rounded-2xl p-5 space-y-2">
            <h4 className="text-sm font-bold text-orange-400 flex items-center space-x-1.5">
              <span>⚠️ Важная информация</span>
            </h4>
            <p className="text-xs text-orange-200/80 leading-relaxed">
              Согласно политике магазина, после подтверждения заказа и оплаты залогового платежа, товар обмену и возврату не подлежит. Пожалуйста, внимательно проверяйте состав корзины.
            </p>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-gray-900 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 space-y-4 sm:space-y-0">
          <p>&copy; {new Date().getFullYear()} HOZWORK. Все права защищены.</p>
          <div className="flex space-x-4">
            <Link href="/privacy" className="hover:text-gray-400 transition-colors">
              Политика конфиденциальности
            </Link>
            <Link href="/terms" className="hover:text-gray-400 transition-colors">
              Пользовательское соглашение
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
