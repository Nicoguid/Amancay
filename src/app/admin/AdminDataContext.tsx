'use client';

import { createContext, useCallback, useContext, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Order, OrderStatus, Product } from '@/lib/types';
import type { CsvProductRow, MassFilter } from '@/lib/productUtils';
import {
  createProductAction,
  importCsvAction,
  massIncreaseAction,
  refundOrderAction,
  restorePricesAction,
  saveProductAction,
  setOrderStatusAction,
  setWithdrawalStatusAction,
  toggleProductActiveAction,
  type Withdrawal,
  type NewProductInput,
  type PriceSnapshot,
} from './dataActions';
import type { ActionResult } from '@/lib/server/adminGuard';
import type { CategoryInfo } from '@/lib/categories';
import {
  deleteCategoryAction,
  deleteProductAction,
  discardImagesAction,
  moveCategoryAction,
  saveCategoryAction,
  saveProductFullAction,
  uploadImageAction,
  type CategoryInput,
  type ProductInput,
} from './catalogActions';

/*
 * Datos y acciones del panel. Los datos llegan del servidor (la página los lee de Supabase);
 * cada acción llama a una Server Action y después refresca la página para traer lo guardado.
 */

type AdminData = {
  products: Product[];
  orders: Order[];
  withdrawals: Withdrawal[];
  /** Todos los rubros (también los ocultos), en orden. */
  categories: CategoryInfo[];
  /** Se mantiene por compatibilidad con los componentes: los datos ya vienen del servidor. */
  isHydrated: true;
  /** true mientras se refresca después de guardar. */
  isRefreshing: boolean;
  saveProduct: (id: string, patch: { price: number; stock?: number; variantStocks?: Record<string, number> }) => Promise<ActionResult>;
  toggleProductActive: (id: string) => Promise<ActionResult>;
  addProduct: (input: NewProductInput) => Promise<ActionResult<{ id: string }>>;
  applyMassPercentageIncrease: (filterType: MassFilter, filterValue: string, pct: number) => Promise<ActionResult<{ affectedCount: number; previous: PriceSnapshot[] }>>;
  restorePrices: (previous: PriceSnapshot[]) => Promise<ActionResult>;
  importProductsFromCsvData: (rows: CsvProductRow[]) => Promise<ActionResult<{ updated: number; created: number }>>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<ActionResult>;
  refundOrder: (orderId: string) => Promise<ActionResult<{ note: string }>>;
  setWithdrawalStatus: (id: string, status: Withdrawal['status']) => Promise<ActionResult>;
  saveProductFull: (id: string | null, input: ProductInput) => Promise<ActionResult<{ id: string }>>;
  deleteProduct: (id: string) => Promise<ActionResult>;
  /** Sube una foto (no refresca la página: devuelve el link para usarlo en el formulario). */
  uploadImage: (form: FormData) => Promise<ActionResult<{ url: string }>>;
  /** Borra fotos subidas que al final no se usaron (no refresca la página). */
  discardImages: (urls: string[]) => void;
  saveCategory: (id: string | null, input: CategoryInput) => Promise<ActionResult<{ id: string }>>;
  moveCategory: (id: string, direction: 'up' | 'down') => Promise<ActionResult>;
  deleteCategory: (id: string, moveTo?: string) => Promise<ActionResult<{ moved: number }>>;
};

const Ctx = createContext<AdminData | null>(null);

export function AdminDataProvider({
  products,
  orders,
  withdrawals,
  categories,
  children,
}: {
  products: Product[];
  orders: Order[];
  withdrawals: Withdrawal[];
  categories: CategoryInfo[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();

  // Envuelve una acción: si salió bien, vuelve a pedir los datos de la página.
  const run = useCallback(
    <A extends unknown[], T>(action: (...args: A) => Promise<ActionResult<T>>) =>
      async (...args: A): Promise<ActionResult<T>> => {
        let result: ActionResult<T>;
        try {
          result = await action(...args);
        } catch {
          result = { ok: false, error: 'No se pudo conectar con el servidor. Probá de nuevo.' };
        }
        if (result.ok) startTransition(() => router.refresh());
        return result;
      },
    [router]
  );

  const value = useMemo<AdminData>(
    () => ({
      products,
      orders,
      withdrawals,
      categories,
      isHydrated: true,
      isRefreshing,
      saveProduct: run(saveProductAction),
      toggleProductActive: run(toggleProductActiveAction),
      addProduct: run(createProductAction),
      applyMassPercentageIncrease: run(massIncreaseAction),
      restorePrices: run(restorePricesAction),
      importProductsFromCsvData: run(importCsvAction),
      updateOrderStatus: run(setOrderStatusAction),
      refundOrder: run(refundOrderAction),
      setWithdrawalStatus: run(setWithdrawalStatusAction),
      saveProductFull: run(saveProductFullAction),
      deleteProduct: run(deleteProductAction),
      uploadImage: async (form: FormData) => {
        try {
          return await uploadImageAction(form);
        } catch {
          return { ok: false as const, error: 'No se pudo subir la foto. Revisá la conexión y probá de nuevo.' };
        }
      },
      discardImages: (urls: string[]) => {
        if (urls.length) void discardImagesAction(urls).catch(() => {});
      },
      saveCategory: run(saveCategoryAction),
      moveCategory: run(moveCategoryAction),
      deleteCategory: run(deleteCategoryAction),
    }),
    [products, orders, withdrawals, categories, isRefreshing, run]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdmin(): AdminData {
  const value = useContext(Ctx);
  if (!value) throw new Error('useAdmin se usa dentro de <AdminDataProvider>.');
  return value;
}
