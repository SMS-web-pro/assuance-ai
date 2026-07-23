# Script de déploiement pour la fonction Edge
# Utilisation: .\deploy.ps1 -ProjectRef "votre-ref-projet" -Environment "production"

param (
    [Parameter(Mandatory=$true)]
    [string]$ProjectRef,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("production", "staging")]
    [string]$Environment = "production"
)

# Vérifier que supabase-cli est installé
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Error "supabase-cli n'est pas installé. Veuillez l'installer avec 'npm install -g supabase'"
    exit 1
}

# Se connecter à Supabase
Write-Host "🔑 Connexion à Supabase..."
supabase login

# Vérifier la configuration
if (-not $ProjectRef) {
    $ProjectRef = Read-Host "Entrez la référence de votre projet Supabase"
}

# Construire la commande de déploiement
$functionName = "send-quote-confirmation"
$deployCommand = "supabase functions deploy $functionName --project-ref $ProjectRef"

# Ajouter l'environnement si spécifié
if ($Environment -eq "staging") {
    $deployCommand += " --no-verify-jwt"
    Write-Host "🚀 Déploiement en environnement de staging..."
} else {
    Write-Host "🚀 Déploiement en production..."
}

# Exécuter la commande de déploiement
try {
    Invoke-Expression $deployCommand
    
    # Vérifier si le déploiement a réussi
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Déploiement réussi !" -ForegroundColor Green
        Write-Host "URL de la fonction: https://$ProjectRef.functions.supabase.co/$functionName"
    } else {
        Write-Error "❌ Échec du déploiement"
        exit 1
    }
} catch {
    Write-Error "❌ Erreur lors du déploiement: $_"
    exit 1
}

# Afficher les informations de débogage
Write-Host "\n🔍 Informations de débogage:"
Write-Host "- Référence du projet: $ProjectRef"
Write-Host "- Environnement: $Environment"
Write-Host "- Nom de la fonction: $functionName"

Write-Host "\nPour vérifier le statut de votre fonction, utilisez la commande:"
Write-Host "supabase functions list --project-ref $ProjectRef"
