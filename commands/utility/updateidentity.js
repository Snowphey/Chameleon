const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const identityManager = require('../../utils/identityManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('updateidentity')
        .setDescription('Modifier une identité enregistrée.')
        .addStringOption(option =>
            option.setName('character')
                .setDescription('Le nom de l\'identité à modifier')
                .setRequired(true)
                .setAutocomplete(true))
        .addStringOption(option =>
            option.setName('newname')
                .setDescription('Le nouveau nom de l\'identité')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('newavatar')
                .setDescription('La nouvelle URL de l\'avatar')
                .setRequired(false)),
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const userId = interaction.user.id;

        try {
            const identityNames = await identityManager.getAllIdentityNames(userId);
            const filtered = identityNames.filter(name => 
                name.toLowerCase().includes(focusedValue.toLowerCase())
            ).slice(0, 25); // Discord limite à 25 suggestions

            await interaction.respond(
                filtered.map(name => ({ name: name, value: name }))
            );
        } catch (error) {
            console.error('Erreur lors de l\'autocomplétion:', error);
            await interaction.respond([]);
        }
    },
    async execute(interaction) {
        const { blacklist } = require('../../config.json');
        if (blacklist && blacklist.includes(interaction.user.id)) {
            await interaction.reply({
                content: `⛔ Vous êtes exclu de l'utilisation de cette commande.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const characterName = interaction.options.getString('character');
        const newName = interaction.options.getString('newname');
        const newAvatarUrl = interaction.options.getString('newavatar');
        // Vérifier qu'au moins un paramètre de modification est fourni
        if (!newName && !newAvatarUrl) {
            await interaction.reply({
                content: `❌ Vous devez spécifier au moins un nouveau nom ou une nouvelle URL d'avatar.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        try {
            // Vérifier que l'identité existe
            const identity = await identityManager.getIdentity(characterName);
            if (!identity) {
                await interaction.reply({
                    content: `❌ Aucune identité trouvée avec le nom "${characterName}".`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            // Utiliser les anciennes valeurs si les nouvelles ne sont pas fournies
            const finalName = newName || identity.name;
            const finalAvatarUrl = newAvatarUrl || identity.avatar_url;

            // Valider la nouvelle URL d'avatar si elle est fournie
            if (newAvatarUrl) {
                // Validation basique de l'URL
                try {
                    new URL(newAvatarUrl);
                } catch (error) {
                    await interaction.reply({
                        content: `❌ L'URL de l'avatar n'est pas valide.`,
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }

                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                
                const isValidImage = await identityManager.validateAvatarUrl(newAvatarUrl);
                if (!isValidImage) {
                    await interaction.editReply({
                        content: `❌ L'URL fournie ne mène pas vers une image valide (PNG, JPG, WebP) ou n'est pas accessible.`
                    });
                    return;
                }
            } else {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            }

            // Mettre à jour l'identité
            const updated = await identityManager.updateIdentity(characterName, finalName, finalAvatarUrl);
            if (updated) {
                let message = `✅ L'identité a été modifiée avec succès.\n`;
                if (newName) message += `**Nouveau nom :** ${finalName}\n`;
                if (newAvatarUrl) message += `**Nouvel avatar :** ${finalAvatarUrl}`;
                
                await interaction.editReply({
                    content: message
                });
            } else {
                await interaction.editReply({
                    content: `❌ Erreur lors de la modification de l'identité.`
                });
            }
        } catch (error) {
            console.error('Erreur lors de la modification de l\'identité:', error);
            
            let errorMessage = `❌ Erreur lors de la modification de l'identité.`;
            if (error.message.includes('Une identité avec ce nom existe déjà')) {
                errorMessage = `❌ Une identité avec le nom "${newName}" existe déjà.`;
            }
            if (interaction.deferred) {
                await interaction.editReply({ content: errorMessage });
            } else {
                await interaction.reply({
                    content: errorMessage,
                    flags: MessageFlags.Ephemeral
                });
            }
        }
    },
};
