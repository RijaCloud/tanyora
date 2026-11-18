# Regle d'encodage

- Tous les fichiers du projet doivent etre en UTF-8.
- On evite les copier-coller ou sauvegardes qui introduisent du mojibake (`Ã`, `Â`, `â€™`, etc.).
- Avant un commit sensible sur les textes, lancer `pnpm run check:mojibake`.
- Cette verification couvre le frontend ainsi que les includes du plugin WordPress associe.

## Rappel pratique

- Preferer des fichiers ASCII quand c'est possible pour les libelles techniques.
- Si un texte utilisateur contient des accents, verifier visuellement le rendu apres edition.
- Si un fichier commence a produire des caracteres etranges, le reencoder en UTF-8 avant toute autre modification.
