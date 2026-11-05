'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import { OrderStatus, ProductCategory } from '@/lib/types';

export default function AdminPage() {
  const { 
    products, 
    orders, 
    updateProduct, 
    addProduct, 
    toggleProductActive, 
    applyMassPercentageIncrease, 
    importProductsFromCsvData,
    updateOrderStatus 
  } = useStore();

  const [activeTab, setActiveTab] = useState<'prices' | 'products' | 'orders' | 'metrics'>('prices');

  // Mass Price Increase Form State
  const [filterType, setFilterType] = useState<'all' | 'category' | 'brand'>('category');
  const [filterValue, setFilterValue] = useState<string>('mates');
  const [percentageInput, setPercentageInput] = useState<number>(12);
  const [massSuccessMsg, setMassSuccessMsg] = useState<string | null>(null);

  // Product List filters
  const [prodSearch, setProdSearch] = useState('');
  const [prodCategoryFilter, setProdCategoryFilter] = useState('all');

  // Inline editing product state
  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);

  // New Product Modal State
  const [isNewProdModalOpen, setIsNewProdModalOpen] = useState(false);
  const [newProdData, setNewProdData] = useState({
    name: '',
    category: 'mates' as ProductCategory,
    brand: '',
    description: '',
    price: 25000,
    stock: 15,
    sku: '',
    imageUrl: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80'
  });

  // Calculate KPIs
  const totalSales = orders
    .filter((o) => o.status !== 'pendiente')
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrdersCount = orders.filter((o) => o.status === 'en_preparacion' || o.status === 'pendiente').length;
  const lowStockProducts = products.filter((p) => p.stock < 10);

  // Available brands for filter
  const brands = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.brand))).filter(Boolean);
  }, [products]);

  // Mass price preview items
  const previewProducts = useMemo(() => {
    return products.filter((p) => {
      if (filterType === 'all') return true;
      if (filterType === 'category') return p.category === filterValue;
      if (filterType === 'brand') return p.brand.toLowerCase() === filterValue.toLowerCase();
      return true;
    });
  }, [products, filterType, filterValue]);

  const handleApplyMassIncrease = () => {
    if (!percentageInput || isNaN(percentageInput)) {
      alert('Ingresá un porcentaje válido.');
      return;
    }

    const res = applyMassPercentageIncrease(filterType, filterValue, percentageInput);
    setMassSuccessMsg(`Se actualizaron con éxito los precios de ${res.affectedCount} productos con un ${percentageInput > 0 ? '+' : ''}${percentageInput}%.`);
    setTimeout(() => setMassSuccessMsg(null), 5000);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    addProduct({
      name: newProdData.name,
      slug: newProdData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: newProdData.category,
      brand: newProdData.brand,
      description: newProdData.description,
      price: Number(newProdData.price),
      stock: Number(newProdData.stock),
      sku: newProdData.sku || `SKU-${Date.now().toString().slice(-4)}`,
      images: [newProdData.imageUrl],
      active: true,
      isNew: true
    });
    setIsNewProdModalOpen(false);
  };

  const exportCsv = () => {
    let csv = 'ID,SKU,Nombre,Marca,Categoria,Precio,Stock\n';
    products.forEach((p) => {
      csv += `"${p.id}","${p.sku}","${p.name}","${p.brand}","${p.category}",${p.price},${p.stock}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `amancay_catalogo_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length <= 1) return;

      const imported: Partial<any>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.replace(/^"|"$/g, '').trim());
        if (parts.length >= 6) {
          imported.push({
            id: parts[0],
            sku: parts[1],
            name: parts[2],
            brand: parts[3],
            category: parts[4] as ProductCategory,
            price: Number(parts[5]) || 0,
            stock: Number(parts[6]) || 0
          });
        }
      }

      if (imported.length > 0) {
        const count = importProductsFromCsvData(imported);
        alert(`Se importaron o actualizaron ${count} productos desde la planilla.`);
      }
    };
    reader.readAsText(file);
  };

  const startEditProduct = (prod: any) => {
    setEditingProdId(prod.id);
    setEditPrice(prod.price);
    setEditStock(prod.stock);
  };

  const saveEditProduct = (id: string) => {
    updateProduct(id, { price: Number(editPrice), stock: Number(editStock) });
    setEditingProdId(null);
  };

  const filteredCatalog = products
    .filter((p) => {
      if (prodCategoryFilter !== 'all' && p.category !== prodCategoryFilter) return false;
      if (prodSearch.trim()) {
        const q = prodSearch.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      }
      return true;
    });

  return (
    <div className="bg-[#fafaf9] min-h-screen pb-16 font-sans text-[#0f1712]">
      
      {/* Top Ledger Header */}
      <div className="bg-[#072415] text-[#f4efe6] py-6 select-none border-b border-[#165b37]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="text-sm font-semibold text-[#c5a059]">
              Gestión interna del comercio · Almagro
            </div>
            <h1 className="font-display text-2xl sm:text-3xl text-white tracking-tight mt-1">
              Mostrador Av. Corrientes 3666 — Backoffice
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="tap-interactive text-xs font-bold uppercase tracking-wider text-white bg-[#0b3821] hover:bg-[#165b37] border border-white/20 px-4 py-2.5 rounded-xs transition-colors"
            >
              ← Ir a la Tienda Pública
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-white border-b border-[#ede7dc] sticky top-20 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto py-2.5 pr-8">
          
          <button
            onClick={() => setActiveTab('prices')}
            className={`tap-interactive py-2.5 px-5 font-bold text-xs uppercase tracking-wider whitespace-nowrap rounded-xs transition-colors ${
              activeTab === 'prices'
                ? 'bg-[#0b3821] text-white shadow-xs'
                : 'text-[#0f1712] hover:bg-[#f4efe6]'
            }`}
          >
            Ajuste Masivo de Precios (%)
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`tap-interactive py-2.5 px-5 font-bold text-xs uppercase tracking-wider whitespace-nowrap rounded-xs transition-colors ${
              activeTab === 'products'
                ? 'bg-[#0b3821] text-white shadow-xs'
                : 'text-[#0f1712] hover:bg-[#f4efe6]'
            }`}
          >
            Inventario y Artículos ({products.length})
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`tap-interactive py-2.5 px-5 font-bold text-xs uppercase tracking-wider whitespace-nowrap rounded-xs transition-colors flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'bg-[#0b3821] text-white shadow-xs'
                : 'text-[#0f1712] hover:bg-[#f4efe6]'
            }`}
          >
            <span>Pedidos de Mostrador ({orders.length})</span>
            {pendingOrdersCount > 0 && (
              <span className="bg-[#a67c3f] text-white text-xs font-bold px-2 py-0.5 rounded-xs tabular-nums">
                {pendingOrdersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('metrics')}
            className={`tap-interactive py-3 px-5 font-medium text-sm whitespace-nowrap rounded-xs transition-colors ${
              activeTab === 'metrics'
                ? 'bg-[#2a1d17] text-white'
                : 'text-[#2a1d17] hover:bg-[#e5e1d8]'
            }`}
          >
            Libro Diario y Stock
          </button>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ========================================================
            TAB 1: ACTUALIZACIÓN MASIVA DE PRECIOS
            ======================================================== */}
        {activeTab === 'prices' && (
          <div className="space-y-6">
            
            {massSuccessMsg && (
              <div className="p-4 bg-[#456f3a]/15 text-[#456f3a] text-sm font-semibold rounded-xs">
                {massSuccessMsg}
              </div>
            )}

            {/* Mass Tool Box */}
            <div className="bg-[#dad5ca] p-6 sm:p-8 rounded-xs space-y-6">
              <div className="pb-4">
                <span className="text-sm font-semibold text-[#3e2d24] block mb-1">
                  Ajuste porcentual directo
                </span>
                <h2 className="font-display text-2xl sm:text-3xl text-[#2a1d17] tracking-tight">
                  Modificar Precios por Rubro o Marca
                </h2>
                <p className="text-sm text-[#3e2d24] mt-1">
                  Permite aplicar un aumento directo a una marca o rubro completo cuando el proveedor actualiza su lista.
                </p>
              </div>

              {/* Form Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <label className="block text-[#2a1d17] font-semibold text-sm mb-1.5">
                    Criterio de aplicación:
                  </label>
                  <select
                    value={filterType}
                    onChange={(e: any) => {
                      setFilterType(e.target.value);
                      if (e.target.value === 'category') setFilterValue('mates');
                      if (e.target.value === 'brand') setFilterValue(brands[0] || '');
                    }}
                    className="w-full bg-white p-3 text-sm text-[#2a1d17] rounded-xs focus:outline-none"
                  >
                    <option value="category">Por Rubro o Categoría</option>
                    <option value="brand">Por Marca o Fabricante</option>
                    <option value="all">Todo el Catálogo Completo</option>
                  </select>
                </div>

                {filterType !== 'all' && (
                  <div>
                    <label className="block text-[#2a1d17] font-semibold text-sm mb-1.5">
                      Seleccionar {filterType === 'category' ? 'rubro' : 'marca'}:
                    </label>
                    {filterType === 'category' ? (
                      <select
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                        className="w-full bg-white p-3 text-sm text-[#2a1d17] rounded-xs focus:outline-none"
                      >
                        <option value="mates">Mates de Autor</option>
                        <option value="bombillas">Bombillas Cinceladas</option>
                        <option value="perfumes">Perfumería Fina</option>
                      </select>
                    ) : (
                      <select
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                        className="w-full bg-white p-3 text-sm text-[#2a1d17] rounded-xs focus:outline-none"
                      >
                        {brands.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-[#2a1d17] font-semibold text-sm mb-1.5">
                    Porcentaje de variación (%):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={percentageInput}
                      onChange={(e) => setPercentageInput(Number(e.target.value))}
                      placeholder="Ej: 15"
                      className="w-full bg-white p-3 text-sm text-[#2a1d17] rounded-xs focus:outline-none font-semibold tabular-nums"
                    />
                    <button
                      onClick={handleApplyMassIncrease}
                      className="tap-interactive bg-[#2a1d17] hover:bg-[#456f3a] text-white px-6 py-3 rounded-xs text-sm font-semibold transition-colors shrink-0"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              </div>

              {/* Instant Simulation Preview Table */}
              <div className="pt-6">
                <span className="text-sm font-semibold text-[#2a1d17] block mb-3">
                  Vista previa ({previewProducts.length} artículos calculados):
                </span>

                <div className="overflow-x-auto rounded-xs bg-[#e5e1d8]">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-[#dad5ca] text-xs font-semibold text-[#2a1d17]">
                        <th className="py-3 px-4">SKU</th>
                        <th className="py-3 px-4">Producto</th>
                        <th className="py-3 px-4">Marca</th>
                        <th className="py-3 px-4 text-right">Precio Actual</th>
                        <th className="py-3 px-4 text-right">Nuevo Precio ({percentageInput > 0 ? '+' : ''}{percentageInput}%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dad5ca]">
                      {previewProducts.slice(0, 6).map((p) => {
                        const newPrice = Math.round(p.price * (1 + percentageInput / 100));
                        return (
                          <tr key={p.id}>
                            <td className="py-3 px-4 text-sm text-[#3e2d24]">{p.sku}</td>
                            <td className="py-3 px-4 font-medium text-[#2a1d17]">{p.name}</td>
                            <td className="py-3 px-4 text-[#3e2d24]">{p.brand}</td>
                            <td className="py-3 px-4 text-right tabular-nums text-[#2a1d17]">
                              ${p.price.toLocaleString('es-AR')}
                            </td>
                            <td className="py-3 px-4 text-right tabular-nums font-bold text-[#456f3a]">
                              ${newPrice.toLocaleString('es-AR')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* CSV Export & Import Options */}
            <div className="bg-[#dad5ca] p-6 sm:p-8 rounded-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-base text-[#2a1d17]">Planilla de Precios en Excel o CSV</h3>
                <p className="text-sm text-[#3e2d24] mt-1">
                  Exportá todo el catálogo actual para modificarlo en tu computadora o cargá una nueva lista del proveedor.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={exportCsv}
                  className="tap-interactive text-sm font-medium bg-[#e5e1d8] hover:bg-white text-[#2a1d17] px-5 py-3 rounded-xs transition-colors"
                >
                  Descargar CSV Actual
                </button>
                <label className="tap-interactive text-sm font-semibold bg-[#2a1d17] hover:bg-[#456f3a] text-white px-5 py-3 rounded-xs cursor-pointer transition-colors">
                  <span>Subir Archivo CSV</span>
                  <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
                </label>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================
            TAB 2: INVENTARIO & PRODUCTOS
            ======================================================== */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            
            {/* Filter and Add bar */}
            <div className="bg-[#dad5ca] p-5 rounded-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
                <input
                  type="text"
                  value={prodSearch}
                  onChange={(e) => setProdSearch(e.target.value)}
                  placeholder="Filtrar por nombre, SKU o marca..."
                  className="w-full sm:w-80 bg-white rounded-xs px-4 py-2.5 text-sm text-[#2a1d17] focus:outline-none"
                />
                <select
                  value={prodCategoryFilter}
                  onChange={(e) => setProdCategoryFilter(e.target.value)}
                  className="bg-white rounded-xs px-4 py-2.5 text-sm text-[#2a1d17] focus:outline-none"
                >
                  <option value="all">Todos los rubros</option>
                  <option value="mates">Mates de Autor</option>
                  <option value="bombillas">Bombillas Cinceladas</option>
                  <option value="perfumes">Perfumería Fina</option>
                </select>
              </div>

              <button
                onClick={() => setIsNewProdModalOpen(true)}
                className="tap-interactive bg-[#2a1d17] hover:bg-[#456f3a] text-white text-sm font-semibold px-5 py-2.5 rounded-xs transition-colors shrink-0"
              >
                + Nuevo Artículo
              </button>
            </div>

            {/* Inventory Table */}
            <div className="overflow-x-auto rounded-xs bg-[#dad5ca]">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-[#e5e1d8] text-xs font-semibold text-[#2a1d17]">
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Artículo</th>
                    <th className="py-3 px-4">Rubro</th>
                    <th className="py-3 px-4 text-right">Precio</th>
                    <th className="py-3 px-4 text-center">Stock</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e1d8] bg-white">
                  {filteredCatalog.map((prod) => {
                    const isEditing = editingProdId === prod.id;
                    const isLowStock = prod.stock < 10;

                    return (
                      <tr key={prod.id}>
                        <td className="py-3 px-4 text-sm text-[#3e2d24]">{prod.sku}</td>
                        <td className="py-3 px-4 font-medium text-[#2a1d17] max-w-xs truncate">
                          {prod.name}
                        </td>
                        <td className="py-3 px-4 text-[#3e2d24] capitalize">{prod.category}</td>
                        
                        <td className="py-3 px-4 text-right tabular-nums">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editPrice}
                              onChange={(e) => setEditPrice(Number(e.target.value))}
                              className="w-24 bg-[#e5e1d8] p-1 text-right text-sm rounded-xs"
                            />
                          ) : (
                            <span className="font-semibold text-[#2a1d17]">
                              ${prod.price.toLocaleString('es-AR')}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center tabular-nums">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editStock}
                              onChange={(e) => setEditStock(Number(e.target.value))}
                              className="w-16 bg-[#e5e1d8] p-1 text-center text-sm rounded-xs"
                            />
                          ) : (
                            <span className={isLowStock ? 'text-[#672d35] font-bold' : 'text-[#3e2d24]'}>
                              {prod.stock} {isLowStock && '(Bajo)'}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => toggleProductActive(prod.id)}
                            className={`tap-interactive text-xs font-semibold px-2.5 py-1 rounded-xs ${
                              prod.active ? 'bg-[#456f3a]/15 text-[#456f3a]' : 'bg-[#2a1d17]/10 text-[#3e2d24]'
                            }`}
                          >
                            {prod.active ? 'Activo' : 'Oculto'}
                          </button>
                        </td>

                        <td className="py-3 px-4 text-right space-x-2">
                          {isEditing ? (
                            <button
                              onClick={() => saveEditProduct(prod.id)}
                              className="tap-interactive text-sm font-semibold text-[#456f3a] hover:underline"
                            >
                              Guardar
                            </button>
                          ) : (
                            <button
                              onClick={() => startEditProduct(prod)}
                              className="tap-interactive text-sm text-[#2a1d17] hover:underline"
                            >
                              Editar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ========================================================
            TAB 3: GESTIÓN DE PEDIDOS
            ======================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            
            <div className="bg-[#dad5ca] p-5 rounded-xs flex justify-between items-center text-sm">
              <span className="text-[#3e2d24]">
                Total de órdenes registradas: <strong className="text-[#2a1d17]">{orders.length}</strong>
              </span>
              <span className="text-[#3e2d24]">
                Pendientes de retiro o despacho: <strong className="text-[#456f3a]">{pendingOrdersCount}</strong>
              </span>
            </div>

            <div className="overflow-x-auto rounded-xs bg-[#dad5ca]">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-[#e5e1d8] text-xs font-semibold text-[#2a1d17]">
                    <th className="py-3 px-4">Orden</th>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Entrega</th>
                    <th className="py-3 px-4">Pago</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4">Estado del Pedido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e1d8] bg-white">
                  {orders.map((ord) => (
                    <tr key={ord.id}>
                      <td className="py-3 px-4 font-bold text-[#2a1d17]">{ord.orderNumber}</td>
                      <td className="py-3 px-4 text-[#3e2d24]">{ord.createdAt}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#2a1d17]">{ord.customer.fullName}</div>
                        <div className="text-xs text-[#3e2d24]">{ord.customer.phone}</div>
                      </td>
                      <td className="py-3 px-4 text-[#3e2d24]">
                        {ord.shippingMethod === 'pickup' ? 'Retiro Corrientes 3666' : 'Envío Cadetería'}
                      </td>
                      <td className="py-3 px-4 capitalize text-[#3e2d24]">{ord.paymentMethod}</td>
                      <td className="py-3 px-4 text-right font-bold tabular-nums text-[#2a1d17]">
                        ${ord.total.toLocaleString('es-AR')}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={ord.status}
                          onChange={(e: any) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                          className="bg-[#e5e1d8] rounded-xs text-xs p-1.5 font-medium text-[#2a1d17] focus:outline-none"
                        >
                          <option value="pendiente">Pendiente de pago</option>
                          <option value="pagado">Pagado</option>
                          <option value="en_preparacion">En armado de paquete</option>
                          <option value="listo_para_retirar">Listo para retirar</option>
                          <option value="despachado">Despachado en moto/correo</option>
                          <option value="entregado">Entregado / Cerrado</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ========================================================
            TAB 4: LIBRO DIARIO & STOCK
            ======================================================== */}
        {activeTab === 'metrics' && (
          <div className="space-y-6">
            
            {/* KPI Cards: Pure Typography */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              <div className="bg-[#dad5ca] p-6 rounded-xs">
                <span className="text-sm font-semibold text-[#3e2d24] block mb-2">
                  Total de Ventas Registradas
                </span>
                <div className="font-display text-3xl sm:text-4xl text-[#2a1d17] tabular-nums tracking-tight">
                  ${totalSales.toLocaleString('es-AR')}
                </div>
                <p className="text-sm text-[#3e2d24] mt-2">
                  En {orders.length} pedidos totales de mostrador y web
                </p>
              </div>

              <div className="bg-[#dad5ca] p-6 rounded-xs">
                <span className="text-sm font-semibold text-[#3e2d24] block mb-2">
                  Artículos Activos en Catálogo
                </span>
                <div className="font-display text-3xl sm:text-4xl text-[#2a1d17] tabular-nums tracking-tight">
                  {products.filter((p) => p.active).length}
                </div>
                <p className="text-sm text-[#3e2d24] mt-2">
                  Distribuídos en 5 rubros comerciales
                </p>
              </div>

              <div className="bg-[#dad5ca] p-6 rounded-xs">
                <span className="text-sm font-semibold text-[#3e2d24] block mb-2">
                  Alertas de Stock Bajo
                </span>
                <div className="font-display text-3xl sm:text-4xl text-[#2a1d17] tabular-nums tracking-tight">
                  {lowStockProducts.length}
                </div>
                <p className="text-sm text-[#3e2d24] mt-2">
                  Artículos con menos de 10 unidades disponibles
                </p>
              </div>

            </div>

            {/* Low stock table */}
            {lowStockProducts.length > 0 && (
              <div className="bg-[#dad5ca] p-6 rounded-xs space-y-4">
                <span className="text-base font-semibold text-[#2a1d17] block">
                  Artículos que requieren reposición inmediata:
                </span>
                <div className="overflow-x-auto rounded-xs bg-white">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-[#e5e1d8] text-xs font-semibold text-[#2a1d17]">
                        <th className="py-3 px-4">SKU</th>
                        <th className="py-3 px-4">Artículo</th>
                        <th className="py-3 px-4">Marca</th>
                        <th className="py-3 px-4 text-center">Unidades Restantes</th>
                        <th className="py-3 px-4 text-right">Precio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e1d8]">
                      {lowStockProducts.map((p) => (
                        <tr key={p.id}>
                          <td className="py-3 px-4 text-sm text-[#3e2d24]">{p.sku}</td>
                          <td className="py-3 px-4 font-medium text-[#2a1d17]">{p.name}</td>
                          <td className="py-3 px-4 text-[#3e2d24]">{p.brand}</td>
                          <td className="py-3 px-4 text-center font-bold text-[#672d35]">{p.stock}</td>
                          <td className="py-3 px-4 text-right tabular-nums">${p.price.toLocaleString('es-AR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* New Product Modal */}
      {isNewProdModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2a1d17]/50 backdrop-blur-xs">
          <div className="bg-[#dad5ca] rounded-xs p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-3">
              <h3 className="font-display text-xl text-[#2a1d17]">Cargar Nuevo Artículo</h3>
              <button
                onClick={() => setIsNewProdModalOpen(false)}
                className="tap-interactive text-sm text-[#2a1d17]"
              >
                Cerrar ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-sm">
              <div>
                <label className="block text-[#2a1d17] font-semibold text-sm mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  value={newProdData.name}
                  onChange={(e) => setNewProdData({ ...newProdData, name: e.target.value })}
                  placeholder="Ej: Perfume Acqua di Colbert 100ml"
                  className="w-full bg-white rounded-xs p-2.5 text-[#2a1d17] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#2a1d17] font-semibold text-sm mb-1">Rubro</label>
                  <select
                    value={newProdData.category}
                    onChange={(e: any) => setNewProdData({ ...newProdData, category: e.target.value })}
                    className="w-full bg-white rounded-xs p-2.5 text-[#2a1d17] focus:outline-none"
                  >
                    <option value="mates">Mates de Autor</option>
                    <option value="bombillas">Bombillas Cinceladas</option>
                    <option value="perfumes">Perfumería Fina</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#2a1d17] font-semibold text-sm mb-1">Marca / Elaborador</label>
                  <input
                    type="text"
                    required
                    value={newProdData.brand}
                    onChange={(e) => setNewProdData({ ...newProdData, brand: e.target.value })}
                    placeholder="Ej: Colbert"
                    className="w-full bg-white rounded-xs p-2.5 text-[#2a1d17] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#2a1d17] font-semibold text-sm mb-1">Precio ($ ARS)</label>
                  <input
                    type="number"
                    required
                    value={newProdData.price}
                    onChange={(e) => setNewProdData({ ...newProdData, price: Number(e.target.value) })}
                    className="w-full bg-white rounded-xs p-2.5 text-[#2a1d17] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#2a1d17] font-semibold text-sm mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    required
                    value={newProdData.stock}
                    onChange={(e) => setNewProdData({ ...newProdData, stock: Number(e.target.value) })}
                    className="w-full bg-white rounded-xs p-2.5 text-[#2a1d17] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#2a1d17] font-semibold text-sm mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={newProdData.description}
                  onChange={(e) => setNewProdData({ ...newProdData, description: e.target.value })}
                  placeholder="Detalles sobre aroma, madera o modo de uso..."
                  className="w-full bg-white rounded-xs p-2.5 text-[#2a1d17] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewProdModalOpen(false)}
                  className="tap-interactive px-4 py-2 text-sm bg-[#e5e1d8] text-[#2a1d17] rounded-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="tap-interactive px-5 py-2 text-sm font-semibold bg-[#2a1d17] hover:bg-[#456f3a] text-white rounded-xs transition-colors"
                >
                  Guardar y Publicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
