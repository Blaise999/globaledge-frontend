import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

export const runtime = "nodejs"; // safe default

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,

      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const shipmentKey =
          typeof clientPayload === "string"
            ? clientPayload.trim()
            : String((clientPayload as any)?.shipmentKey || "").trim();

        if (!shipmentKey) throw new Error("Missing shipment key.");
        if (!pathname.startsWith(`shipments/${shipmentKey}/goods/`)) {
          throw new Error("Invalid upload path.");
        }

        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ shipmentKey }),
        };
      },

      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Optional: persist blob.url to DB keyed by shipmentKey
        console.log("Upload completed:", blob.url, tokenPayload);
      },
    });

    return Response.json(jsonResponse);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
