import { currentUser } from "@/lib/auth";
import { invoiceFor } from "@/lib/expenses";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; expenseId: string }> }) {
  const { id, expenseId } = await params;
  const file = await invoiceFor(await currentUser(), id, expenseId);
  if (!file) return new Response("Forbidden", { status: 403 });
  return new Response(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.type,
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.name)}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
