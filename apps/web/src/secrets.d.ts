// Skrivnosti in neobvezne spremenljivke, ki jih `wrangler types` ne vidi (nastavljene v nadzorni plošči).
declare namespace Cloudflare {
  interface Env {
    TEST_CODE?: string;
    STRIPE_SECRET_KEY?: string;
    STRIPE_WEBHOOK_SECRET?: string;
    /** Resend: pošiljanje emailov je vklopljeno, ko sta nastavljena oba */
    RESEND_API_KEY?: string;
    EMAIL_FROM?: string;
  }
}
