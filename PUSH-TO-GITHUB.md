# 🚀 Guide pour pousser le projet sur GitHub

## ⚠️ Important : Si tu as déjà créé le repository avec README/LICENSE

Si tu as déjà créé le repository GitHub avec README, LICENSE, etc., tu dois d'abord faire un pull pour récupérer ces fichiers avant de pousser ton code.

### Option 1 : Pull d'abord, puis push (recommandé)

```bash
# Se placer dans le dossier du projet
cd /Users/karelletable/Desktop/Projet/planificateur-revision-kopio

# Initialiser Git (si pas déjà fait)
git init

# Ajouter le remote GitHub
git remote add origin https://github.com/TKarelle/planificateur-revision-kopio.git

# Récupérer les fichiers du repository (README, LICENSE, etc.)
git pull origin main --allow-unrelated-histories

# Résoudre les conflits si nécessaire (garde les deux versions ou fusionne)

# Ajouter tous tes fichiers
git add .

# Faire le commit
git commit -m "feat: première version du planificateur de révision KOPIO"

# Pousser le code
git push -u origin main
```

### Option 2 : Forcer le push (écrase le repository distant)

⚠️ **Attention** : Cela va écraser le README et LICENSE que tu as créés sur GitHub !

```bash
# Se placer dans le dossier du projet
cd /Users/karelletable/Desktop/Projet/planificateur-revision-kopio

# Initialiser Git (si pas déjà fait)
git init

# Ajouter tous les fichiers
git add .

# Faire le premier commit
git commit -m "feat: première version du planificateur de révision KOPIO"

# Ajouter le remote GitHub
git remote add origin https://github.com/TKarelle/planificateur-revision-kopio.git

# Renommer la branche en main
git branch -M main

# Forcer le push (écrase le repository distant)
git push -u origin main --force
```

## ✅ Vérifier que tout est bien poussé

Va sur ton repository GitHub et vérifie que :

- ✅ Le README.md est présent
- ✅ Le LICENSE est présent
- ✅ Le code source est présent
- ✅ Le package.json est présent

## 📝 Créer la première release

1. Dans le repository GitHub, clique sur **"Releases"** → **"Create a new release"**
2. Configure :
   - **Tag** : `v1.0.0` (crée un nouveau tag)
   - **Release title** : `v1.0.0 - Première version`
   - **Description** :

     ````markdown
     ## 🎉 Première version du Planificateur de révision KOPIO

     ### Fonctionnalités

     - 📚 Gestion des matières
     - 📅 Planning hebdomadaire
     - ✅ Suivi de progression
     - 📊 Statistiques de révision

     ### Installation

     ```bash
     npm install
     npm run dev
     ```
     ````

     ```

     ```
3. Clique sur **"Publish release"**

## 🏷️ Ajouter des topics au repository

1. Dans le repository GitHub, clique sur l'engrenage ⚙️ à côté de "About"
2. Dans "Topics", ajoute :
   - `revision`
   - `planning`
   - `etudiant`
   - `education`
   - `productivity`
   - `kopio`
   - `open-source`
   - `react`
   - `typescript`

## 🔗 Mettre à jour les liens sur le site web

Dans le projet `mindmatch-web-2`, mets à jour :

- `app/(public)/outils-open-source/page.tsx` : Remplace les liens GitHub par ton vrai repository
- Le lien est déjà dans le schema Organization de `app/(public)/a-propos/page.tsx`

## ✅ C'est fait !

Ton projet est maintenant sur GitHub et prêt à être partagé ! 🎉
