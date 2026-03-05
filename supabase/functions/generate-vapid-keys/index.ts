import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import webpush from "npm:web-push@3.6.7";

serve(async () => {
  const vapidKeys = webpush.generateVAPIDKeys();
  return new Response(JSON.stringify({
    publicKey: vapidKeys.publicKey,
    privateKey: vapidKeys.privateKey,
  }), { headers: { "Content-Type": "application/json" } });
});
