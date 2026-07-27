import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function OffersPage() {
  const offers = await db.offer.findMany({
    include: { application: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Offers</h1>
        <p className="text-sm text-secondary mt-1">Side-by-side comparison of every offer you&apos;ve logged.</p>
      </div>

      {offers.length === 0 ? (
        <div className="glass-card p-8 text-center text-sm text-muted">
          No offers logged yet. Move an application to the Offer stage and fill in its offer details.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {offers.map((offer) => (
            <Link
              key={offer.id}
              href={`/applications/${offer.applicationId}`}
              className="glass-card glass-card-hover p-5 space-y-2"
            >
              <div className="h-8 w-8 rounded-lg gradient-orb stage-offer" />
              <p className="text-sm font-medium">{offer.application.company}</p>
              <p className="text-xs text-secondary">{offer.application.role}</p>
              <dl className="text-xs text-secondary space-y-1 pt-2">
                <div className="flex justify-between">
                  <dt className="text-muted">Comp</dt>
                  <dd>{offer.compensation || "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Location</dt>
                  <dd>{offer.location || "—"}</dd>
                </div>
                {offer.benefits && <p className="text-muted pt-1">{offer.benefits}</p>}
                {offer.growthNotes && <p className="text-muted">{offer.growthNotes}</p>}
              </dl>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
