'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { CartDrawer } from './CartDrawer';
import { MarqueeTicker } from './MarqueeTicker';
import { Search, ShoppingBag, MessageCircle, Menu, X } from 'lucide-react';

export function Navbar() {
  const router = useRouter();
  const { cartCount, products } = useStore();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const searchResults = searchQuery.trim().length > 1
    ? products
        .filter((p) => p.active)
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 6)
    : [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      router.push(`/catalogo?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="w-full max-w-full overflow-x-clip font-sans">
      {/* Top Infinite Running Marquee */}
      <MarqueeTicker variant="top" />

      {/* Main Sticky Navigation Bar */}
      <nav className="sticky top-0 z-40 w-full bg-[#ffffff] border-b border-[#e6dac6] shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 sm:h-24 gap-2 sm:gap-4">
            
            {/* Brand Wordmark */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 py-2">
              <Link 
                href="/" 
                className="group flex flex-col focus:outline-none"
              >
                <div className="flex items-center gap-2">
                  <span className="font-display text-2xl sm:text-3xl lg:text-3xl xl:text-4xl tracking-tight text-[#1a1612] transition-colors group-hover:text-[#a67c3f] leading-none font-semibold">
                    AMANCAY
                  </span>
                  <span className="hidden md:inline-block px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#faf7f0] text-[#a67c3f] border border-[#e6dac6]">
                    Almagro · CABA
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs xl:text-sm text-[#5a524a] font-medium tracking-wide mt-1 hidden sm:block truncate max-w-[200px] lg:max-w-[220px] xl:max-w-none">
                  Mates de Autor · Bombillas · Perfumería
                </span>
              </Link>
            </div>

            {/* Desktop Navigation Links - STRICTLY MATES, BOMBILLAS, PERFUMES */}
            <div className="hidden lg:flex items-center gap-3.5 xl:gap-5 2xl:gap-6 text-sm font-semibold text-[#1a1612] whitespace-nowrap">
              <Link 
                href="/catalogo?rubro=mates" 
                className="hover:text-[#a67c3f] transition-colors py-1 hover:underline decoration-2 underline-offset-4"
              >
                Mates
              </Link>
              <Link 
                href="/catalogo?rubro=bombillas" 
                className="hover:text-[#a67c3f] transition-colors py-1 hover:underline decoration-2 underline-offset-4"
              >
                Bombillas
              </Link>
              <Link 
                href="/catalogo?rubro=perfumes" 
                className="hover:text-[#a67c3f] transition-colors py-1 hover:underline decoration-2 underline-offset-4"
              >
                Perfumes
              </Link>
              <Link 
                href="/catalogo" 
                className="hover:text-[#a67c3f] transition-colors py-1 hover:underline decoration-2 underline-offset-4 text-[#5a524a]"
              >
                Ver Todo
              </Link>
            </div>

            {/* Search + WhatsApp + Cart Drawer (shrink-0 ensures it NEVER overflows or cuts off) */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              
              {/* Autocomplete Search Bar */}
              <div ref={searchRef} className="relative hidden md:block w-36 lg:w-44 xl:w-56 2xl:w-64">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchOpen(true);
                    }}
                    onFocus={() => setIsSearchOpen(true)}
                    placeholder="Buscar productos..."
                    className="w-full bg-[#faf7f0] focus:bg-white text-xs sm:text-sm text-[#1a1612] placeholder-[#5a524a] pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 rounded-full border border-[#e6dac6] focus:border-[#a67c3f] focus:outline-none transition-all shadow-2xs"
                  />
                  <Search className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#5a524a] absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </form>

                {/* Dropdown Results */}
                {isSearchOpen && searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-md border border-[#e6dac6] overflow-hidden z-50 shadow-xl animate-fade-in-up">
                    <div className="divide-y divide-[#f4efe6] max-h-80 overflow-y-auto">
                      {searchResults.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => {
                            setIsSearchOpen(false);
                            setSearchQuery('');
                            router.push(`/producto/${product.id}`);
                          }}
                          className="w-full text-left p-3 hover:bg-[#faf7f0] transition-colors flex items-center gap-3 text-sm"
                        >
                          <img
                            src={product.images[0]}
                            alt=""
                            className="w-12 h-12 object-cover rounded-md bg-[#f4efe6] border border-[#e6dac6] shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-[#1a1612] truncate">{product.name}</p>
                            <div className="flex items-center gap-2 text-xs text-[#5a524a] mt-0.5">
                              <span className="capitalize font-medium text-[#a67c3f]">{product.category}</span>
                              <span>·</span>
                              <span>{product.brand}</span>
                            </div>
                            <p className="text-xs text-[#0b3821] font-medium">3 cuotas Galicia de ${(product.price / 3).toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
                          </div>
                          <span className="font-bold text-[#1a1612] shrink-0 tabular-nums">
                            ${product.price.toLocaleString('es-AR')}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="bg-[#faf7f0] p-2.5 text-center border-t border-[#e6dac6]">
                      <Link
                        href={`/catalogo?q=${encodeURIComponent(searchQuery)}`}
                        onClick={() => setIsSearchOpen(false)}
                        className="text-xs font-bold text-[#a67c3f] hover:text-[#8c652d] uppercase tracking-wider"
                      >
                        Ver todos los resultados ({searchResults.length}) →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* WhatsApp Quick Contact */}
              <a
                href="https://wa.me/5491136740676?text=Hola%20Amancay!%20Quiero%20hacer%20una%20consulta%20sobre%20sus%20productos."
                target="_blank"
                rel="noopener noreferrer"
                className="tap-interactive hidden sm:flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0b3821] bg-[#faf7f0] hover:bg-[#f4efe6] border border-[#e6dac6] px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-full transition-colors shrink-0"
                title="Consultas por WhatsApp"
              >
                <MessageCircle className="w-4 h-4 text-[#25d366] shrink-0" />
                <span className="hidden xl:inline">WhatsApp</span>
              </a>

              {/* Cart Drawer Trigger Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="tap-interactive flex items-center gap-1.5 sm:gap-2 bg-[#1a1612] hover:bg-[#2c2520] text-[#faf7f0] px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-wide shadow-sm shrink-0"
                aria-label={`Carrito de compra, ${cartCount} productos`}
              >
                <ShoppingBag className="w-4 h-4 text-[#a67c3f] shrink-0" />
                <span className="hidden sm:inline">Carrito</span>
                <span className="bg-[#a67c3f] text-[#ffffff] px-2 py-0.5 rounded-full text-xs font-bold tabular-nums">
                  {cartCount}
                </span>
              </button>

              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden tap-interactive p-2 text-[#1a1612] hover:bg-[#faf7f0] rounded-md border border-[#e6dac6] shrink-0"
                aria-label="Abrir menú de navegación"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </button>

            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-[#ffffff] border-t border-[#e6dac6] px-5 pt-4 pb-6 space-y-4 animate-fade-in-up shadow-lg">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar mates, bombillas o perfumes..."
                className="w-full bg-[#faf7f0] text-sm text-[#1a1612] placeholder-[#5a524a] pl-10 pr-4 py-3 rounded-md border border-[#e6dac6] focus:outline-none"
              />
              <Search className="w-5 h-5 text-[#5a524a] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </form>

            <div className="flex flex-col space-y-2 text-base font-semibold text-[#1a1612]">
              <Link
                href="/catalogo?rubro=mates"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2 px-3 rounded-md hover:bg-[#faf7f0] hover:text-[#a67c3f] transition-colors flex items-center justify-between"
              >
                <span>Mates de Autor</span>
                <span className="text-xs uppercase tracking-wider text-[#a67c3f] font-bold">Imperiales & Torpedos</span>
              </Link>
              <Link
                href="/catalogo?rubro=bombillas"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2 px-3 rounded-md hover:bg-[#faf7f0] hover:text-[#a67c3f] transition-colors flex items-center justify-between"
              >
                <span>Bombillas Cinceladas</span>
                <span className="text-xs uppercase tracking-wider text-[#a67c3f] font-bold">Alpaca & Acero</span>
              </Link>
              <Link
                href="/catalogo?rubro=perfumes"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2 px-3 rounded-md hover:bg-[#faf7f0] hover:text-[#a67c3f] transition-colors flex items-center justify-between"
              >
                <span>Perfumería Fina</span>
                <span className="text-xs uppercase tracking-wider text-[#a67c3f] font-bold">Esencias Exclusivas</span>
              </Link>
              <Link
                href="/catalogo"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2 px-3 rounded-md hover:bg-[#faf7f0] text-[#5a524a]"
              >
                Catálogo Completo
              </Link>
              <div className="pt-2 border-t border-[#e6dac6] flex flex-col gap-2">
                <a
                  href="https://wa.me/5491136740676?text=Hola%20Amancay!%20Quiero%20hacer%20una%20consulta."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-[#25d366] text-white rounded-md text-center font-bold text-sm flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Consultar por WhatsApp</span>
                </a>
                <Link
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-2.5 text-[#5a524a] hover:text-[#1a1612] text-center text-xs font-semibold"
                >
                  Acceso Mostrador / Panel Admin
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
}
