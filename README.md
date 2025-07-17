# Chameleon

Bot Discord permettant d'utiliser la commande `/say` pour faire parler un membre du serveur via un webhook temporaire.

## Fonctionnalités principales
- **/say <user> <message>** : Impersonate un membre du serveur pour envoyer un message comme si c'était lui.

## Installation

1. **Cloner le dépôt**
   ```sh
   git clone <lien-du-repo>
   cd Chameleon
   ```

2. **Installer les dépendances**
   ```sh
   npm install discord.js
   ```

3. **Configurer le bot**
   - Remplir `config.json` comme suit :
   - Renseigne ton token de bot, ton clientId et le guildId de ton serveur Discord :
     ```json
     {
       "token": "VOTRE_BOT_TOKEN",
       "clientId": "VOTRE_CLIENT_ID",
       "guildId": "VOTRE_GUILD_ID"
     }
     ```

4. **Déployer les commandes**
   ```sh
   node deploy-commands.js
   ```

5. **Lancer le bot**
   ```sh
   node index.js
   ```

## Utilisation

Sur Discord, tape :
```
/say user:<@membre> message:Votre message ici
```
Le bot enverra le message dans le salon, en se faisant passer pour le membre choisi.

## Sécurité
- Le bot crée et supprime un webhook temporaire à chaque utilisation.