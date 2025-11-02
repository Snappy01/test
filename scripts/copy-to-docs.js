// Script pour copier le contenu de dist/ vers docs/
import { existsSync, rmSync, cpSync } from 'fs'
import { join } from 'path'

const distDir = join(process.cwd(), 'dist')
const docsDir = join(process.cwd(), 'docs')

// Vérifier que dist/ existe
if (!existsSync(distDir)) {
  console.error('❌ Erreur: Le dossier dist/ n\'existe pas. Lancez d\'abord "npm run build"')
  process.exit(1)
}

// Supprimer docs/ s'il existe déjà
if (existsSync(docsDir)) {
  console.log('🗑️  Suppression de l\'ancien dossier docs/...')
  rmSync(docsDir, { recursive: true, force: true })
}

// Copier dist/ vers docs/
console.log('📁 Copie de dist/ vers docs/...')
cpSync(distDir, docsDir, { recursive: true })

console.log('✅ Copie terminée ! Le dossier docs/ est prêt pour GitHub Pages.')
