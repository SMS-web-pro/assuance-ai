// Déclaration des types pour Deno
interface DenoGlobal {
  env: {
    get(key: string): string | undefined;
  };
}

declare const Deno: DenoGlobal;

// Déclaration des types pour les modules externes
declare module "https://deno.land/std@0.177.0/http/server.ts" {
  interface ServeOptions {
    port?: number;
    hostname?: string;
  }

  export function serve(handler: (req: Request) => Promise<Response> | Response): Promise<void>;
  export function serve(addr: string | ServeOptions, handler: (req: Request) => Promise<Response> | Response): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2.38.4" {
  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: {
      auth?: {
        autoRefreshToken?: boolean;
        persistSession?: boolean;
        detectSessionInUrl?: boolean;
      };
    }
  ): {
    auth: {
      admin: {
        inviteUserByEmail: (
          email: string,
          options?: {
            data?: Record<string, unknown>;
            redirectTo?: string;
            emailRedirectTo?: string;
          }
        ) => Promise<{ error: Error | null }>;
      };
    };
    from: (table: string) => {
      update: (data: Record<string, unknown>) => {
        eq: (column: string, value: string) => Promise<{ error: Error | null }>;
      };
      select: (columns?: string) => {
        eq: (column: string, value: string) => Promise<{ data: any; error: Error | null }>;
        single: () => Promise<{ data: any; error: Error | null }>;
      };
    };
  };
}
