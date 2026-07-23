// @deno-types="./types.d.ts"
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Configuration de test
const testConfig = {
  supabaseUrl: Deno.env.get('SUPABASE_URL') || '',
  supabaseKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
  testEmail: 'test@example.com',
  testName: 'Test User'
};

// Fonction utilitaire pour exécuter des tests
async function runTest(name: string, testFn: () => Promise<void>) {
  try {
    await testFn();
    console.log(`✅ ${name} - PASSED`);
    return true;
  } catch (error) {
    console.error(`❌ ${name} - FAILED`);
    console.error(error);
    return false;
  }
}

// Test 1: Vérification de la configuration
await runTest('Configuration', async () => {
  if (!testConfig.supabaseUrl) throw new Error('SUPABASE_URL non défini');
  if (!testConfig.supabaseKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY non défini');
  console.log('Configuration valide');
});

// Test 2: Connexion à Supabase
await runTest('Connexion à Supabase', async () => {
  const supabase = createClient(
    testConfig.supabaseUrl,
    testConfig.supabaseKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  
  // Tester une requête simple
  const { data, error } = await supabase.from('demandes_assurance').select('*').limit(1);
  if (error) throw error;
  console.log('Connexion réussie, données récupérées:', data?.length || 0);
});

// Test 3: Envoi d'email de test
await runTest('Envoi d\'email de test', async () => {
  const supabase = createClient(
    testConfig.supabaseUrl,
    testConfig.supabaseKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  
  const { error } = await supabase.auth.admin.inviteUserByEmail(testConfig.testEmail, {
    data: { name: testConfig.testName },
    redirectTo: `${testConfig.supabaseUrl}/confirmation`,
    emailRedirectTo: `${testConfig.supabaseUrl}/confirmation`
  });
  
  if (error) throw error;
  console.log('Email de test envoyé avec succès à', testConfig.testEmail);
});

console.log('\nTous les tests sont terminés.');
