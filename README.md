# Chameleon

Bot Discord permettant d'utiliser la commande `/say` pour faire parler un membre du serveur via un webhook temporaire.

<p align="center" width="100%">
    <img src="https://github.com/Snowphey/Chameleon/blob/19b5788c3dc35d11168145690469606c8c611f72/logo.png" alt="chameleon_logo"/ width=200>
</p>

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
   - Renseigne ton token de bot, ton clientId, le guildId de ton serveur Discord, et éventuellement une liste d'utilisateurs à exclure (blacklist) :
     ```json
     {
       "token": "VOTRE_BOT_TOKEN",
       "clientId": "VOTRE_CLIENT_ID",
       "guildId": "VOTRE_GUILD_ID",
       "blacklist": [
         "ID_UTILISATEUR_1",
         "ID_UTILISATEUR_2"
       ]
     }
     ```
   - La clé `blacklist` (optionnelle) permet d'exclure des utilisateurs (par leur ID Discord) de toutes les commandes du bot. Pour autoriser à nouveau un utilisateur, retire simplement son ID de la liste.

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