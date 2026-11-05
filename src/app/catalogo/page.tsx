'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { ProductCard } from '@/components/ProductCard';
import { Search, Sparkles, Filter, X, Store, CreditCard, ChevronDown } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', name: 'Todos los Productos', label: 'Todo el Catálogo' },
  { id: 'mates', name: 'Mates de Autor', label: 'Imperiales & Camioneros' },
  { id: 'bombillas', name: 'Bombillas Cinceladas', label: 'Alpaca & Acero 304' },
  { id: 'perfumes', name: 'Perfumería Fina', label: 'Fragancias de Autor' },
];

function CatalogContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('rubro') || searchParams.get('categoria') || 'all';
  const initialQuery = searchParams.get('q') || '';

  const { products } = useStore();

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>(initialQuery);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);

  // Extract unique brands
  const brands = useMemo(() => {
    const list = Array.from(new Set(products.map((p) => p.brand))).filter(Boolean);
    return ['all', ...list];
  }, [products]);

  // Filter & Sort logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => p.active)
      .filter((p) => {
        if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
        if (selectedBrand !== 'all' && p.brand !== selectedBrand) return false;
        if (onlyInStock && p.stock <= 0) return false;
        if (searchFilter.trim()) {
          const q = searchFilter.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchBrand = p.brand.toLowerCase().includes(q);
          const matchDesc = p.description.toLowerCase().includes(q);
          if (!matchName && !matchBrand && !matchDesc) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
      });
  }, [products, selectedCategory, selectedBrand, searchFilter, sortBy, onlyInStock]);

  return (
    <div className="bg-[#faf7f0] min-h-screen py-8 sm:py-12 font-sans text-[#1a1612]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Banner Header */}
        <div className="mb-8 rounded-xl bg-[#14110e] text-white overflow-hidden relative border border-[#2c2520] shadow-md">
          <img
            src="https://images.unsplash.com/photo-1583321500900-82807e458f3c?auto=format&fit=crop&w=1600&q=80"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-transparent" />
          <div className="relative px-6 sm:px-10 py-10 sm:py-14 space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2c2520] text-xs font-bold uppercase tracking-wider text-[#c5a059] border border-[#a67c3f]/40">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Catálogo Oficial Amancay</span>
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
              Mates, Bombillas & Perfumes
            </h1>
            <p className="text-xs sm:text-sm text-[#faf7f0]/85 leading-relaxed font-sans">
              Calabazas imperiales forjadas a mano, bombillas en alpaca de alta densidad y fragancias de autor en Av. Corrientes 3666. 3 cuotas sin interés con Banco Galicia (exclusivo Noviembre). Envíos a todo el país.
            </p>
            <p className="text-xs font-bold uppercase tracking-wider text-[#c5a059] pt-1">
              {filteredProducts.length} artículos disponibles para retiro o envío inmediato
            </p>
          </div>
        </div>

        {/* Quick Category Tabs (Matesur Style) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-4 mb-6">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`tap-interactive whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-[#1a1612] text-white shadow-sm'
                    : 'bg-[#ffffff] text-[#5a524a] hover:bg-[#f4efe6] hover:text-[#1a1612] border border-[#e6dac6]'
                }`}
              >
                <span>{cat.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                  isSelected ? 'bg-[#a67c3f] text-white' : 'bg-[#faf7f0] text-[#5a524a]'
                }`}>
                  {cat.id === 'all'
                    ? products.filter((p) => p.active).length
                    : products.filter((p) => p.active && p.category === cat.id).length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Grid Layout with Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1 space-y-5">
            <div className="bg-[#ffffff] p-5 rounded-xl border border-[#e6dac6] space-y-5 shadow-xs">
              
              {/* Search within catalog */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1a1612] mb-1.5">
                  Buscar en mostrador
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Ej: Imperial, alpaca, Kevin..."
                    className="w-full px-3.5 py-2 pl-9 bg-[#faf7f0] rounded-md text-xs text-[#1a1612] placeholder-[#5a524a] border border-[#e6dac6] focus:border-[#a67c3f] focus:outline-none"
                  />
                  <Search className="w-4 h-4 text-[#5a524a] absolute left-3 top-1/2 -translate-y-1/2" />
                  {searchFilter && (
                    <button
                      onClick={() => setSearchFilter('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#5a524a] hover:text-[#1a1612]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Brand Filter */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1a1612] mb-1.5">
                  Marca / Taller
                </label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full px-3 py-2 bg-[#faf7f0] rounded-md text-xs text-[#1a1612] border border-[#e6dac6] focus:outline-none"
                >
                  <option value="all">Todas las marcas</option>
                  {brands.filter((b) => b !== 'all').map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock Filter Checkbox */}
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#1a1612]">
                  <input
                    type="checkbox"
                    checked={onlyInStock}
                    onChange={(e) => setOnlyInStock(e.target.checked)}
                    className="rounded-xs text-[#1a1612] focus:ring-0 w-4 h-4 border-[#e6dac6]"
                  />
                  <span>Solo con stock disponible hoy</span>
                </label>
              </div>

              {/* Reset Filters */}
              {(selectedCategory !== 'all' || selectedBrand !== 'all' || searchFilter || onlyInStock) && (
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedBrand('all');
                    setSearchFilter('');
                    setOnlyInStock(false);
                  }}
                  className="tap-interactive w-full text-center text-xs font-bold uppercase tracking-wider text-[#672d35] hover:underline pt-1 transition-colors"
                >
                  Limpiar filtros ✕
                </button>
              )}

            </div>

            {/* Local Pickup Card Note */}
            <div className="p-5 bg-[#14110e] text-white rounded-xl border border-[#2c2520] space-y-2 shadow-sm">
              <div className="flex items-center gap-2 text-[#c5a059] text-xs font-bold uppercase tracking-wider">
                <Store className="w-4 h-4" />
                <span>Retiro en 1 Hora sin cargo</span>
              </div>
              <p className="text-xs text-[#faf7f0]/80 leading-relaxed font-sans">
                Av. Corrientes 3666 (Almagro). Confirmás tu pedido y lo retirás por el mostrador en el día.
              </p>
            </div>
          </aside>

          {/* Product Grid Area */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Sorting Bar */}
            <div className="bg-[#ffffff] p-3.5 rounded-xl border border-[#e6dac6] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
              <span className="text-[#5a524a] font-medium">
                Mostrando <strong className="text-[#1a1612]">{filteredProducts.length}</strong> artículos
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#5a524a] font-semibold">Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-[#faf7f0] border border-[#e6dac6] rounded-md px-3 py-1.5 text-xs text-[#1a1612] focus:outline-none"
                >
                  <option value="featured">Destacados de Mostrador</option>
                  <option value="price-asc">Menor precio</option>
                  <option value="price-desc">Mayor precio</option>
                  <option value="name">Nombre (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Product Grid */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#e6dac6] p-12 text-center text-[#5a524a] space-y-3">
                <p className="font-display text-2xl font-bold text-[#1a1612]">
                  No encontramos productos con esos filtros
                </p>
                <p className="text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
                  Probá modificando el término de búsqueda o seleccionando una de nuestras 3 especialidades (Mates, Bombillas, Perfumes).
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedBrand('all');
                    setSearchFilter('');
                    setOnlyInStock(false);
                  }}
                  className="tap-interactive text-xs font-bold uppercase tracking-wider bg-[#1a1612] text-white px-6 py-3 rounded-full hover:bg-[#a67c3f] transition-colors mt-2"
                >
                  Restablecer Catálogo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <div key={product.id}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center text-sm text-[#5a524a]">Cargando catálogo Amancay...</div>}>
      <CatalogContent />
    </Suspense>
  );
}
