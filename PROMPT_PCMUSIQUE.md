# ═══════════════════════════════════════════════════════════
# RESTANQUES — PROMPT AUTONOME PC MUSIQUE
# ═══════════════════════════════════════════════════════════
# Colle ce prompt dans Claude Code sur le PC Musique.
# Claude va tout faire tout seul et notifier Jisse sur Telegram.
# ═══════════════════════════════════════════════════════════

Le jeu Restanques est dans C:\tmp\restanques
Déployé sur https://restanques.vercel.app
Supabase : https://omivxkzvzfobylgjscvx.supabase.co

## NOTIFICATIONS TELEGRAM

À CHAQUE étape importante, envoie un message Telegram à Jisse :

```bash
notify_telegram() {
  curl -s -X POST "https://api.telegram.org/bot8745661004:AAGJffmkzEK6GfI0wfgVj0K8XboyWDpiCRY/sendMessage" \
    -d chat_id=8064044229 \
    -d text="🎮 RESTANQUES: $1" \
    -d parse_mode=HTML > /dev/null 2>&1
}
```

Utilise cette fonction pour notifier :
- Au début : "🚀 Démarrage refonte v5.0 sur PC Musique"
- À chaque phase terminée : "✅ Phase 1 terminée - Fondations"
- À chaque deploy : "🌐 Deploy OK - teste sur restanques.vercel.app"
- En cas d'erreur bloquante : "❌ Erreur bloquante : [description]"
- À la fin : "🎉 Refonte v5.0 terminée ! 5 phases déployées"

## ÉTAPE 0 — VÉRIFICATION

```bash
cd C:\tmp\restanques
echo "=== VÉRIF ==="
node --version
npm --version
ls docs/CDC_PART*.md | wc -l
ls public/splash.png public/music/*.mp3 public/story/*.png 2>/dev/null | wc -l
cat .env.local | head -2
echo "=== OK ==="
```

Si les CDC ne sont pas dans docs/ → ARRÊTE-TOI et notifie :
"❌ Les fichiers CDC manquent dans docs/. Vérifie le clone."

## ÉTAPE 1 — LIS LES 5 CDC

Lis INTÉGRALEMENT les 5 fichiers :
- docs/CDC_PART1_VISION.md
- docs/CDC_PART2_CLASSES.md
- docs/CDC_PART3_COMBAT.md
- docs/CDC_PART4_MAISON.md
- docs/CDC_PART5_MONDE.md

Comprends TOUT avant de coder. Les CDC sont la BIBLE du projet.

## ÉTAPE 2 — SAUVEGARDE + NETTOYAGE

```bash
mkdir -p backup_v4
cp -r app/ backup_v4/app_$(date +%Y%m%d_%H%M)/ 2>/dev/null
echo "Ancien code sauvegardé"
```

NE SUPPRIME PAS l'ancien code — on le refactore progressivement.
Le code existant MARCHE (v4.3 déployée), on améliore par-dessus.

## ÉTAPE 3 — CODE LES 5 PHASES

Suis l'ordre défini dans les CDC. À chaque phase :

1. Code tout
2. Build : `NODE_OPTIONS="--max-old-space-size=8192" npx next build`
3. Si build OK → commit + deploy :
   ```bash
   git add -A && git commit -m "Phase X: description"
   npx vercel --prod --yes
   ```
4. Notifie Telegram : "✅ Phase X terminée + déployée"
5. Passe à la phase suivante

## CHECK PRE-DEPLOY (à chaque deploy)

```bash
echo "═══ CHECK ═══"
for f in theme.mp3 story.mp3 ending.mp3 gameover.mp3 combat.mp3 garrigue.mp3; do
  [ -f "public/music/$f" ] && echo "✅ $f" || echo "⚠️ $f (Web Audio fallback)"
done
echo "Story: $(ls public/story/*.png 2>/dev/null | wc -l) images"
[ -f "public/splash.png" ] && echo "✅ splash" || echo "❌ splash"
```

## IMPORTANT

- Le PC a 48 GB RAM → utilise NODE_OPTIONS="--max-old-space-size=8192"
- Ne demande PAS confirmation à Jisse sauf erreur bloquante
- Code TOUT, teste, déploie, notifie. Autonome.
- Si un build échoue → fix et retry. Ne reste pas bloqué.
- Les assets (splash, music, story images) sont DÉJÀ dans le repo, ne les supprime pas.
