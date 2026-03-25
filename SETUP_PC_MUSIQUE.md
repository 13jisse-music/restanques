# RESTANQUES — Setup PC Musique

## Étape 1 : Ouvre PowerShell sur le PC Musique et colle :

```powershell
# Clone le projet
cd C:\tmp
git clone https://github.com/13jisse-music/restanques.git
cd restanques

# Installe les dépendances
npm install

# Crée .env.local
@"
NEXT_PUBLIC_SUPABASE_URL=https://omivxkzvzfobylgjscvx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9taXZ4a3p2emZvYnlsZ2pzY3Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNzQwNDksImV4cCI6MjA4OTg1MDA0OX0.2V-aO_8jz0ki8sCf4poA3IYuyokFMwyQn2y8MwWWNMA
"@ | Out-File -FilePath .env.local -Encoding UTF8

# Désactive la mise en veille
powercfg /change standby-timeout-ac 0
powercfg /change monitor-timeout-ac 0

# Test build
$env:NODE_OPTIONS="--max-old-space-size=8192"
npx next build

Write-Host "✅ Projet installé ! Lance Claude Code avec : claude"
```

## Étape 2 : Lance Claude Code

```powershell
cd C:\tmp\restanques
claude
```

## Étape 3 : Colle le prompt de démarrage dans Claude Code

Colle le contenu de RESTANQUES_PROMPT_PCMUSIQUE.md (que Jisse te donnera)
puis les 5 CDC.

## Infos utiles
- Repo : https://github.com/13jisse-music/restanques (privé, compte 13jisse-music)
- Deploy : https://restanques.vercel.app
- Supabase : https://omivxkzvzfobylgjscvx.supabase.co
- 73 commits, 266 fichiers, ~5800 lignes de code
- Le PC Musique a 48 GB RAM → pas de problème de build
