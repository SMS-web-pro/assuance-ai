# Fonction d'envoi de confirmation de devis

Cette fonction Edge Supabase envoie un email de confirmation aux clients après qu'ils aient soumis une demande de devis d'assurance.

## Configuration requise

- Compte Supabase avec un projet configuré
- Clé de rôle de service Supabase avec les permissions nécessaires
- Configuration SMTP configurée dans Supabase

## Variables d'environnement

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```env
SUPABASE_URL=votre-url-supabase
SUPABASE_SERVICE_ROLE_KEY=votre-cle-secrete
```

## Déploiement

1. Assurez-vous d'avoir installé l'interface en ligne de commande Supabase :
   ```bash
   npm install -g supabase
   ```

2. Connectez-vous à votre compte Supabase :
   ```bash
   supabase login
   ```

3. Déployez la fonction :
   ```bash
   supabase functions deploy send-quote-confirmation --project-ref votre-ref-projet
   ```

## Utilisation

Envoyez une requête POST à l'endpoint de la fonction avec le corps suivant :

```json
{
  "demandeId": "id-de-la-demande",
  "clientEmail": "email@client.com",
  "clientName": "Nom du client",
  "conversation": [
    {"role": "user", "content": "Message de l'utilisateur"},
    {"role": "assistant", "content": "Réponse de l'assistant"}
  ],
  "typeAssurance": "Auto"
}
```

## Réponse

En cas de succès :

```json
{
  "success": true,
  "message": "Email de confirmation envoyé avec succès",
  "demandeId": "id-de-la-demande"
}
```

En cas d'erreur :

```json
{
  "success": false,
  "error": "Message d'erreur détaillé"
}
```

## Sécurité

- La fonction doit être protégée par une authentification
- Utilisez toujours HTTPS pour les requêtes
- Limitez les origines autorisées avec CORS
- Ne stockez jamais de clés secrètes dans le code source

## Développement local

1. Installez Deno : https://deno.land/
2. Exécutez la fonction localement :
   ```bash
   deno task dev
   ```
3. Testez avec une requête HTTP :
   ```bash
   curl -X POST http://localhost:8000 -H "Content-Type: application/json" -d '{"demandeId":"test","clientEmail":"test@example.com","clientName":"Test User"}'
   ```
