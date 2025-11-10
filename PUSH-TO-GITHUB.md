# 🚀 Guide pour pousser le projet sur GitHub

## Étapes pour créer le repository et pousser le code

### 1. Créer le repository sur GitHub

1. Va sur https://github.com/new
2. Configure :
   - **Repository name** : `planificateur-revision-kopio`
   - **Description** : `Outil open-source gratuit pour planifier tes révisions efficacement - KOPIO`
   - ✅ **Public**
   - ❌ Ne coche PAS "Add a README file" (on a déjà un README)
   - ❌ Ne coche PAS "Add .gitignore" (on a déjà un .gitignore)
   - ❌ Ne coche PAS "Choose a license" (on a déjà une LICENSE)
3. Clique sur **"Create repository"**

### 2. Initialiser Git et pousser le code

Dans le terminal, depuis le dossier du projet :

```bash
# Se placer dans le dossier du projet
cd /Users/karelletable/Desktop/Projet/planificateur-revision-kopio

# Initialiser Git (si pas déjà fait)
git init

# Ajouter tous les fichiers
git add .

# Faire le premier commit
git commit -m "feat: première version du planificateur de révision KOPIO"

# Ajouter le remote GitHub (remplace USERNAME par ton nom d'utilisateur GitHub)
git remote add origin https://github.com/USERNAME/planificateur-revision-kopio.git

# Renommer la branche en main (si nécessaire)
git branch -M main

# Pousser le code
git push -u origin main
```

### 3. Vérifier que tout est bien poussé

Va sur ton repository GitHub et vérifie que :
- ✅ Le README.md est présent
- ✅ Le LICENSE est présent
- ✅ Le code source est présent
- ✅ Le package.json est présent

### 4. Créer la première release

1. Dans le repository GitHub, clique sur **"Releases"** → **"Create a new release"**
2. Configure :
   - **Tag** : `v1.0.0` (crée un nouveau tag)
   - **Release title** : `v1.0.0 - Première version`
   - **Description** :
     ```markdown
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
     ```
3. Clique sur **"Publish release"**

### 5. Ajouter des topics au repository

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

### 6. Mettre à jour les liens sur le site web

Dans le projet `mindmatch-web-2`, mets à jour :
- `app/(public)/outils-open-source/page.tsx` : Remplace les liens GitHub par ton vrai repository
- Le lien est déjà dans le schema Organization de `app/(public)/a-propos/page.tsx`

## ✅ C'est fait !

Ton projet est maintenant sur GitHub et prêt à être partagé ! 🎉

## Prochaines étapes

- Développer de nouvelles fonctionnalités
- Ajouter des tests
- Configurer GitHub Actions pour CI/CD
- Ajouter des screenshots dans le README
- Promouvoir le projet

