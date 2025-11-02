# 📋 LISTE DES ÉLÉMENTS NON UTILISÉS

## 🗑️ FICHIERS À SUPPRIMER

### 1. Composants React non utilisés
- ✅ **`src/components/Galaxy.jsx`** (334 lignes)
  - Non importé/utilisé nulle part
  - Utilise `ogl` uniquement

- ✅ **`src/components/Cubes.jsx`** (288 lignes)
  - Non importé/utilisé nulle part
  - Utilise `gsap` (mais gsap est utilisé ailleurs, donc à garder)

### 2. Fichiers CSS non utilisés
- ✅ **`src/styles/Galaxy.css`**
  - Importé uniquement dans `Galaxy.jsx` (non utilisé)

- ✅ **`src/styles/Cubes.css`**
  - Importé uniquement dans `Cubes.jsx` (non utilisé)

### 3. Assets potentiellement inutilisés
- ⚠️ **`src/assets/react.svg`**
  - Non référencé dans le code
  - Probablement asset par défaut Vite, peut être supprimé

## 📦 DÉPENDANCES NPM

### ⚠️ À VÉRIFIER AVANT SUPPRESSION
- ❌ **`ogl@^1.0.11`**
  - Utilisé UNIQUEMENT dans `Galaxy.jsx`
  - Si Galaxy supprimé → peut être désinstallé
  - **Taille estimée** : ~50-100KB

### ✅ À GARDER (utilisées)
- ✅ **`framer-motion@^12.23.24`**
  - ❗ **IMPORTANT** : Utilisé par HeroUI (dépendance transitive)
  - Ne PAS supprimer, nécessaire pour les composants HeroUI
  - Dépendance de : `@heroui/react` et tous ses sous-composants

- ✅ **`gsap@^3.13.0`**
  - Utilisé dans `SplitText.jsx` (animations Header)
  - À garder

## 📊 RÉSUMÉ

### Fichiers à supprimer (4 fichiers)
1. `src/components/Galaxy.jsx` - 334 lignes
2. `src/components/Cubes.jsx` - 288 lignes  
3. `src/styles/Galaxy.css`
4. `src/styles/Cubes.css`

### Dépendances à désinstaller (1 si Galaxy supprimé)
1. `ogl@^1.0.11` (uniquement si Galaxy supprimé)

### Assets optionnels
1. `src/assets/react.svg` (si non utilisé)

### ⚠️ NE PAS SUPPRIMER
- `framer-motion` (dépendance de HeroUI)
- `gsap` (utilisé dans SplitText)

## 💾 GAIN ESTIMÉ

- **Code supprimé** : ~622 lignes
- **Bundle size** : ~50-150KB économisés (ogl + code mort)
- **Maintenabilité** : ⬆️ Codebase plus propre

