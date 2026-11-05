'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Order, OrderStatus, ProductCategory, ProductVariant } from '@/lib/types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS } from '@/lib/mockData';

export interface CartItem {
  id: string; // unique item key: productId + variantId
  product: Product;
  selectedVariant?: ProductVariant;
  quantity: number;
  unitPrice: number;
}

interface StoreContextType {
  products: Product[];
  orders: Order[];
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  // Admin Product Actions
  updateProduct: (id: string, updated: Partial<Product>) => void;
  addProduct: (newProd: Omit<Product, 'id'>) => void;
  toggleProductActive: (id: string) => void;
  applyMassPercentageIncrease: (
    filterType: 'all' | 'category' | 'brand',
    filterValue: string,
    percentage: number
  ) => { affectedCount: number };
  importProductsFromCsvData: (importedProducts: Partial<Product>[]) => number;
  // Admin Order Actions
  createOrder: (orderInput: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: 'amancay_products_v2',
  ORDERS: 'amancay_orders_v2',
  CART: 'amancay_cart_v2'
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on client mount
  useEffect(() => {
    try {
      const storedProds = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (storedProds) {
        setProducts(JSON.parse(storedProds));
      } else {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      }

      const storedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (storedOrders) {
        setOrders(JSON.parse(storedOrders));
      } else {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
      }

      const storedCart = localStorage.getItem(STORAGE_KEYS.CART);
      if (storedCart) {
        setCart(JSON.parse(storedCart));
      }
    } catch (e) {
      console.error('Error loading store data:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.error('Error saving products:', e);
    }
  }, [products, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.error('Error saving orders:', e);
    }
  }, [orders, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch (e) {
      console.error('Error saving cart:', e);
    }
  }, [cart, isLoaded]);

  // Cart operations
  const addToCart = (product: Product, quantity = 1, variant?: ProductVariant) => {
    const unitPrice = variant ? variant.price : product.price;
    const cartItemId = variant ? `${product.id}-${variant.id}` : product.id;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.id === cartItemId ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { id: cartItemId, product, selectedVariant: variant, quantity, unitPrice }];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const updateCartQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

  // Admin Actions
  const updateProduct = (id: string, updated: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((prod) => (prod.id === id ? { ...prod, ...updated } : prod))
    );
  };

  const addProduct = (newProd: Omit<Product, 'id'>) => {
    const id = `prod-${Date.now()}`;
    const product: Product = { ...newProd, id };
    setProducts((prev) => [product, ...prev]);
  };

  const toggleProductActive = (id: string) => {
    setProducts((prev) =>
      prev.map((prod) => (prod.id === id ? { ...prod, active: !prod.active } : prod))
    );
  };

  // Mass price adjustment (Percentage)
  const applyMassPercentageIncrease = (
    filterType: 'all' | 'category' | 'brand',
    filterValue: string,
    percentage: number
  ) => {
    const factor = 1 + percentage / 100;
    let affectedCount = 0;

    setProducts((prev) =>
      prev.map((prod) => {
        let matches = false;
        if (filterType === 'all') matches = true;
        if (filterType === 'category' && prod.category === filterValue) matches = true;
        if (filterType === 'brand' && prod.brand.toLowerCase() === filterValue.toLowerCase()) matches = true;

        if (!matches) return prod;
        affectedCount++;

        // Round to clean tens or hundreds (e.g. 38500 * 1.1 = 42350 -> rounded to nearest 50 or 100)
        const roundPrice = (p: number) => Math.round((p * factor) / 50) * 50;

        const newBasePrice = roundPrice(prod.price);
        const newOriginalPrice = prod.originalPrice ? roundPrice(prod.originalPrice) : undefined;

        const newVariants = prod.variants?.map((v) => ({
          ...v,
          price: roundPrice(v.price)
        }));

        return {
          ...prod,
          price: newBasePrice,
          originalPrice: newOriginalPrice,
          variants: newVariants
        };
      })
    );

    return { affectedCount };
  };

  // CSV Import (Bulk updates)
  const importProductsFromCsvData = (importedProducts: Partial<Product>[]) => {
    let count = 0;
    setProducts((prev) => {
      const map = new Map(prev.map((p) => [p.sku || p.id, p]));
      importedProducts.forEach((item) => {
        const key = item.sku || item.id;
        if (key && map.has(key)) {
          const current = map.get(key)!;
          map.set(key, { ...current, ...item });
          count++;
        } else if (item.name && item.price) {
          const newId = `prod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
          map.set(newId, {
            id: newId,
            name: item.name,
            slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            category: (item.category as ProductCategory) || 'mates',
            brand: item.brand || 'Amancay',
            description: item.description || '',
            price: Number(item.price),
            stock: Number(item.stock || 10),
            images: item.images || ['https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80'],
            sku: item.sku || `SKU-${Date.now()}`,
            active: true
          });
          count++;
        }
      });
      return Array.from(map.values());
    });
    return count;
  };

  // Order actions
  const createOrder = (orderInput: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>) => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newOrder: Order = {
      ...orderInput,
      id: `ord-${Date.now()}`,
      orderNumber: `#AMC-${randomNum}`,
      createdAt: new Date().toISOString()
    };

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status } : ord))
    );
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        orders,
        cart,
        cartCount,
        cartTotal,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        updateProduct,
        addProduct,
        toggleProductActive,
        applyMassPercentageIncrease,
        importProductsFromCsvData,
        createOrder,
        updateOrderStatus
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
