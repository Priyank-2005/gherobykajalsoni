import { adminListCoupons } from "@/lib/services/coupon.service";
import { toNumber } from "@/lib/money";
import { PageHeader } from "@/components/admin/ui";
import { CouponManager } from "./coupon-manager";

export const metadata = { title: "Coupons" };

export default async function AdminCouponsPage() {
  const coupons = await adminListCoupons();
  return (
    <>
      <PageHeader title="Coupons" description="Discount codes customers can apply in their bag." />
      <CouponManager
        coupons={coupons.map((c) => ({
          id: c.id,
          code: c.code,
          type: c.type,
          applyOn: c.applyOn,
          discountValue: toNumber(c.discountValue),
          maxDiscount: c.maxDiscount === null ? null : toNumber(c.maxDiscount),
          minCartValue: c.minCartValue === null ? null : toNumber(c.minCartValue),
          maxUsage: c.maxUsage,
          perUserLimit: c.perUserLimit,
          isActive: c.isActive,
          startsAt: c.startsAt?.toISOString() ?? null,
          expiresAt: c.expiresAt?.toISOString() ?? null,
          usageCount: c.usageCount,
        }))}
      />
    </>
  );
}
