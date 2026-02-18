import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

export default async function handler(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,

      // Called BEFORE upload: decide what you allow
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // clientPayload is whatever you send from the browser (we’ll send a draftId or shipmentId)
        const shipmentKey = (clientPayload || '').trim();

        // Basic safety: require a key + restrict path to that key
        if (!shipmentKey) throw new Error('Missing shipment key.');
        if (!pathname.startsWith(`shipments/${shipmentKey}/goods/`)) {
          throw new Error('Invalid upload path.');
        }

        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
          addRandomSuffix: true, // makes URLs unguessable (recommended)
          tokenPayload: JSON.stringify({ shipmentKey }),
        };
      },

      // Called AFTER upload (by Vercel) — use this to update your DB if you want.
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Here you’d do: save blob.url to your shipment row in DB using shipmentKey from tokenPayload.
        // const { shipmentKey } = JSON.parse(tokenPayload);
        // await db.shipments.addPhoto(shipmentKey, blob.url);

        console.log('Upload completed:', blob.url, tokenPayload);
      },
    });

    return Response.json(jsonResponse);
  } catch (error) {
    return Response.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
