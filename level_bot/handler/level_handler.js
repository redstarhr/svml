// level_bot/handlers/level_handler.js
const { readJsonFromGCS, saveJsonToGCS } = require('../../common/gcs/gcsUtils');
const { EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder } = require('discord.js');

const CONFIG_PATH = (guildId) => `level_bot/${guildId}/config.json`;

/**
 * Rebuilds the settings embed with the latest config.
 * @param {object} config The level bot configuration.
 * @returns {EmbedBuilder}
 */
function buildSettingsEmbed(config) {
    return new EmbedBuilder()
      .setTitle('📈 レベルアップ設定パネル')
      .setColor(0x00bfff)
      .addFields(
        { name: 'XP / 1メッセージ', value: `${config.xpPerMessage}`, inline: true },
        { name: 'クールダウン（秒）', value: `${config.cooldownSec}`, inline: true },
        { name: '通知チャンネル', value: config.notifyChannelId ? `<#${config.notifyChannelId}>` : '未設定', inline: true },
        { name: 'レベルアップ無効ロール', value: config.disabledRoles.length ? config.disabledRoles.map(id => `<@&${id}>`).join(', ') : '未設定' },
        { name: '登録済スタンプ', value: config.levelStamps.length ? config.levelStamps.join('\n') : '未登録' }
      );
}

async function handleRoleSelect(interaction) {
    const guildId = interaction.guild.id;
    const selectedRoles = interaction.values;

    let config = await readJsonFromGCS(CONFIG_PATH(guildId));
    if (!config) {
        return interaction.reply({ content: '設定ファイルが見つかりません。`/レベル設定`を再実行してください。', ephemeral: true });
    }

    config.disabledRoles = selectedRoles;
    await saveJsonToGCS(CONFIG_PATH(guildId), config);

    const updatedEmbed = buildSettingsEmbed(config);
    await interaction.update({ embeds: [updatedEmbed] });
}

async function handleAddStamp(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('addLevelStampModal')
        .setTitle('レベルアップスタンプ追加');

    const stampInput = new TextInputBuilder()
        .setCustomId('stampInput')
        .setLabel('追加するスタンプを入力 (例: 🎉)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(stampInput));
    await interaction.showModal(modal);
}

async function handleRemoveStamp(interaction) {
    const guildId = interaction.guild.id;
    const config = await readJsonFromGCS(CONFIG_PATH(guildId));

    if (!config || !config.levelStamps || config.levelStamps.length === 0) {
        return interaction.reply({ content: '削除できるスタンプが登録されていません。', ephemeral: true });
    }

    const options = config.levelStamps.map(stamp => ({
        label: stamp,
        value: stamp,
    }));

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('removeLevelStampSelect')
        .setPlaceholder('削除するスタンプを選択')
        .addOptions(options);

    await interaction.reply({
        content: '削除するスタンプを選択してください。',
        components: [new ActionRowBuilder().addComponents(selectMenu)],
        ephemeral: true,
    });
}

async function handleRemoveStampSelect(interaction) {
    const guildId = interaction.guild.id;
    const stampToRemove = interaction.values[0];

    let config = await readJsonFromGCS(CONFIG_PATH(guildId));
    if (!config) return interaction.reply({ content: '設定ファイルが見つかりません。', ephemeral: true });

    config.levelStamps = config.levelStamps.filter(s => s !== stampToRemove);
    await saveJsonToGCS(CONFIG_PATH(guildId), config);

    await interaction.reply({ content: `スタンプ「${stampToRemove}」を削除しました。\n設定パネルを更新するには、再度 \`/レベル設定\` を実行してください。`, ephemeral: true });
}

async function handleAddStampModal(interaction) {
    const guildId = interaction.guild.id;
    const newStamp = interaction.fields.getTextInputValue('stampInput');

    let config = await readJsonFromGCS(CONFIG_PATH(guildId));
    if (!config) return interaction.reply({ content: '設定ファイルが見つかりません。', ephemeral: true });

    if (!config.levelStamps) config.levelStamps = [];

    if (!config.levelStamps.includes(newStamp)) {
        config.levelStamps.push(newStamp);
        await saveJsonToGCS(CONFIG_PATH(guildId), config);
    }

    await interaction.reply({ content: `スタンプ「${newStamp}」を追加しました。\n設定パネルを更新するには、再度 \`/レベル設定\` を実行してください。`, ephemeral: true });
}

module.exports = {
    async execute(interaction) {
        if (interaction.isRoleSelectMenu() && interaction.customId === 'selectDisabledRoles') {
            await handleRoleSelect(interaction);
            return true;
        }
        if (interaction.isButton()) {
            if (interaction.customId === 'addLevelStamp') return await handleAddStamp(interaction), true;
            if (interaction.customId === 'removeLevelStamp') return await handleRemoveStamp(interaction), true;
        }
        if (interaction.isStringSelectMenu() && interaction.customId === 'removeLevelStampSelect') {
            await handleRemoveStampSelect(interaction);
            return true;
        }
        if (interaction.isModalSubmit() && interaction.customId === 'addLevelStampModal') {
            await handleAddStampModal(interaction);
            return true;
        }
        return false;
    }
};