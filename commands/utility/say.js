
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Impersonate un membre pour envoyer un message.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Le membre à impersonate')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Le message à envoyer')
                .setRequired(true)),
    async execute(interaction) {
        const { blacklist } = require('../../config.json');
        if (blacklist && blacklist.includes(interaction.user.id)) {
            await interaction.reply({
                content: `⛔ Vous êtes exclu de l'utilisation de cette commande.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const user = interaction.options.getUser('user');
        const message = interaction.options.getString('message');
        const channel = interaction.channel;

        // Récupérer le membre du serveur pour avoir le pseudo et la couleur
        const member = await interaction.guild.members.fetch(user.id);
        const displayName = member.displayName;
        // Chercher la couleur du rôle le plus haut (hors @everyone)
        const roleColor = member.roles.highest.color || null;

        // Créer un webhook temporaire
        const webhook = await channel.createWebhook({
            name: displayName,
            avatar: user.displayAvatarURL({ dynamic: true })
        });

        // Préparer les options du webhook (toujours texte simple)
        let options = {
            content: message,
            username: displayName,
            avatarURL: user.displayAvatarURL({ dynamic: true })
        };

        // Envoyer le message via le webhook
        await webhook.send(options);

        // Supprimer le webhook après envoi
        await webhook.delete();

        await interaction.reply({ 
            content: `Message envoyé en tant que ${displayName}.`, 
            flags: MessageFlags.Ephemeral
        });
    },
};
