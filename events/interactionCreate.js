const { Events, MessageFlags } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		// Gérer les commandes slash
		if (interaction.isChatInputCommand()) {
			const command = interaction.client.commands.get(interaction.commandName);

			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}

			try {
				await command.execute(interaction);
			} catch (error) {
				console.error(error);
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
				} else {
					await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
				}
			}
		}
		// Gérer les interactions de bouton pour la commande say
		else if (interaction.isButton()) {
			if (interaction.customId === 'say_confirm' || interaction.customId === 'say_cancel') {
				const message = interaction.message;
				const embed = message.embeds[0];
				if (!embed) return;
				if (interaction.customId === 'say_cancel') {
					await interaction.update({ content: 'Envoi annulé.', embeds: [], components: [], flags: MessageFlags.Ephemeral });
					return;
				}
				// Récupérer les infos depuis l'embed
				const displayName = embed.author?.name;
				const avatarURL = embed.author?.iconURL;
				const content = embed.description;
				const channel = interaction.channel;
				// Récupérer l'URL de l'image depuis l'embed (preview)
				const imageUrl = embed.image?.url;
				// Créer le webhook et envoyer le message
				const webhook = await channel.createWebhook({
					name: displayName,
					avatar: avatarURL
				});
				let webhookOptions = {
					content,
					username: displayName,
					avatarURL
				};
				if (imageUrl) {
					webhookOptions.files = [imageUrl];
				}
				await webhook.send(webhookOptions);
				await webhook.delete();
				await interaction.update({ content: `Message envoyé en tant que ${displayName}.`, embeds: [], components: [], flags: MessageFlags.Ephemeral });
			}
		}
		// Gérer l'autocomplétion
		else if (interaction.isAutocomplete()) {
			const command = interaction.client.commands.get(interaction.commandName);

			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}

			if (!command.autocomplete) {
				console.error(`Command ${interaction.commandName} does not have autocomplete function.`);
				return;
			}

			try {
				await command.autocomplete(interaction);
			} catch (error) {
				console.error('Error during autocomplete:', error);
			}
		}
	},
};
