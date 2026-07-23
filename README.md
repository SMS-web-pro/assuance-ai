# Assure AI Connect - Tableau de Bord Administrateur

Application web moderne pour la gestion des utilisateurs et des données d'assurance, construite avec React, TypeScript, Vite et Supabase.

## 🚀 Fonctionnalités

- Authentification sécurisée avec Supabase
- Gestion des utilisateurs (CRUD)
- Tableau de bord administratif
- Interface utilisateur réactive avec Tailwind CSS et Radix UI
- Gestion d'état avec React Query
- Validation des formulaires avec Zod et React Hook Form

## 🛠 Configuration requise

- Node.js 18+ et npm 8+
- Compte Supabase
- Compte Vercel (pour le déploiement)

## 🚀 Démarrage rapide

1. **Cloner le dépôt**
   ```bash
   git clone <url-du-dépôt>
   cd assure-ai-connect-83-23
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   Créez un fichier `.env` à la racine du projet avec les variables suivantes :
   ```env
   VITE_SUPABASE_URL=votre_url_supabase
   VITE_SUPABASE_ANON_KEY=votre_cle_anon_supabase
   ```

4. **Démarrer l'environnement de développement**
   ```bash
   npm run dev
   ```

5. **Construire pour la production**
   ```bash
   npm run build:prod
   ```

## 🚀 Déploiement sur Vercel

1. **Préparer le projet**
   - Assurez-vous que toutes les variables d'environnement sont configurées dans les paramètres de votre projet Vercel
   - Vérifiez que le fichier `vercel.json` est correctement configuré

2. **Déployer**
   - Connectez votre dépôt GitHub à Vercel
   - Configurez les variables d'environnement dans les paramètres du projet Vercel
   - Déclenchez un nouveau déploiement

## 🛠 Scripts disponibles

- `npm run dev` - Démarrer le serveur de développement
- `npm run build` - Construire pour la production
- `npm run build:prod` - Construire pour la production avec optimisation
- `npm run preview` - Prévisualiser la version de production localement
- `npm run lint` - Linter le code
- `npm run lint:fix` - Corriger automatiquement les problèmes de linting
- `npm run type-check` - Vérifier les types TypeScript

## 📁 Structure du projet

```
src/
├── components/     # Composants réutilisables
├── pages/         # Pages de l'application
├── hooks/         # Hooks personnalisés
├── lib/           # Utilitaires et configurations
├── styles/        # Styles globaux
└── types/         # Définitions de types TypeScript
```

## 🔒 Sécurité

- Toutes les données sensibles sont stockées dans des variables d'environnement
- Les routes d'administration sont protégées
- Les en-têtes de sécurité sont configurés dans `vercel.json`
- La validation des entrées est effectuée avec Zod

## 📄 Licence

Ce projet est sous licence MIT.
