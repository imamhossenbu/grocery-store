import type { Product, ProductSnapshot, ProductVariant } from '@/types/store';

/**
 * Product sizes (variants). A basket line is identified by product id plus,
 * for a product sold in sizes, the id of the chosen size.
 */

export const VARIANT_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function lineKey(line: { id: string; variantId?: string | null }): string {
  return line.variantId ? `${line.id}:${line.variantId}` : line.id;
}

export function hasVariants(p: Product | ProductSnapshot): boolean {
  return 'variants' in p ? (p.variants?.length ?? 0) > 0 : !!(p as ProductSnapshot).hasVariants;
}

/** The size to show first: the first one in stock, otherwise the first. */
export function defaultVariant(p: Product): ProductVariant | undefined {
  return p.variants?.find((v) => v.stock > 0) ?? p.variants?.[0];
}

/** Lowest price among the sizes (the product's own price when it has none). */
export function lowestPrice(p: Product): number {
  return p.variants?.length ? Math.min(...p.variants.map((v) => v.price)) : p.price;
}

/** What the basket, wishlist and "recently viewed" store for a product (or one size of it). */
export function toSnapshot(p: Product, variant?: ProductVariant): ProductSnapshot {
  const sized = (p.variants?.length ?? 0) > 0;
  return {
    id: p.id,
    name: p.name,
    unit: variant?.label ?? p.unit,
    price: variant?.price ?? p.price,
    oldPrice: variant ? variant.oldPrice : p.oldPrice,
    image: p.image,
    stock: variant?.stock ?? p.stock,
    ...(variant ? { variantId: variant.id } : {}),
    ...(sized ? { hasVariants: true } : {}),
  };
}

/**
 * The live snapshot for a basket line, or null when that line can no longer
 * be bought as it is: the size was removed, or the product is sold in sizes
 * now and the line has none (or the other way round).
 */
export function snapshotForLine(p: Product, variantId?: string | null): ProductSnapshot | null {
  const sized = (p.variants?.length ?? 0) > 0;
  if (!variantId) return sized ? null : toSnapshot(p);
  const variant = p.variants?.find((v) => v.id === variantId);
  return variant ? toSnapshot(p, variant) : null;
}
