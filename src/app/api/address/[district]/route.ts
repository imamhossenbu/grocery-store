import { districtDetail, districtIds } from '@/lib/address/geo';

/**
 * Upazilas / city thanas and their unions for one district, loaded on demand
 * by the address picker. All 64 are prerendered at build time; the full
 * dataset never reaches the browser.
 */
export async function generateStaticParams() {
  return districtIds().map((district) => ({ district }));
}

async function getDetail(id: Promise<string>) {
  'use cache';
  return districtDetail(await id);
}

export async function GET(_request: Request, { params }: RouteContext<'/api/address/[district]'>) {
  const detail = await getDetail(params.then((p) => p.district));
  if (!detail) return Response.json({ error: 'Unknown district' }, { status: 404 });
  return Response.json(detail, {
    headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' },
  });
}
