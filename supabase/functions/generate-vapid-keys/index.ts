import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const keyPair = await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign", "verify"]
    );

    const publicKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
    const privateKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);

    // Convert public key to the uncompressed format used by Web Push
    const x = Uint8Array.from(atob(publicKeyJwk.x!.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
    const y = Uint8Array.from(atob(publicKeyJwk.y!.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
    const publicKeyRaw = new Uint8Array(65);
    publicKeyRaw[0] = 0x04;
    publicKeyRaw.set(x, 1);
    publicKeyRaw.set(y, 33);
    const publicKeyBase64Url = arrayBufferToBase64Url(publicKeyRaw.buffer);

    return new Response(
      JSON.stringify({
        publicKey: publicKeyBase64Url,
        privateKeyJwk: JSON.stringify(privateKeyJwk),
        instructions: "Store publicKey as VAPID_PUBLIC_KEY and privateKeyJwk as VAPID_PRIVATE_KEY in your secrets.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-vapid-keys error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
