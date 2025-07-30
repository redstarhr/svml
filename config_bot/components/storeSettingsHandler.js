const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const { addStores } = require('../utils/storeConfig');
const logger = require('@common/logger');

const THREAD_NAME = '店舗名設定ログ';

module.exports = {
  async execute(interaction) {
    if (interaction.isButton() && interaction.customId === 'config_add_store') {
      await this.handleStoreAddButton(interaction);
      return true;
    }
    if (interaction.isModalSubmit() && interaction.customId === 'config_store_modal') {
      await this.handleStoreAddModal(interaction);
      return true;
    }
    return false;
  },

  /** 「店舗名追加」ボタンの処理 */
  async handleStoreAddButton(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('config_store_modal')
      .setTitle('🏪 店舗名の追加');

    const storesInput = new TextInputBuilder()
      .setCustomId('store_names')
      .setLabel('追加する店舗名 (改行で複数入力)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('例:\nSTAR\nマンマミーア')
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(storesInput));
    await interaction.showModal(modal);
  },

  /** 店舗名追加モーダルの送信処理 */
  async handleStoreAddModal(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const guildId = interaction.guild.id;
    const storeNamesRaw = interaction.fields.getTextInputValue('store_names');
    const newStores = storeNamesRaw.split('\n').map(s => s.trim()).filter(Boolean);

    if (newStores.length === 0) {
      return interaction.editReply({ content: '⚠️ 追加する店舗名が入力されていません。' });
    }

    try {
      const { added } = await addStores(guildId, newStores);

      if (added.length > 0) {
        await interaction.editReply({ content: `✅ ${added.length}件の店舗を追加しました: \`${added.join(', ')}\`` });
        await this.logToThread(interaction, added);
      } else {
        await interaction.editReply({ content: 'ℹ️ 入力された店舗はすべて登録済みです。' });
      }
    } catch (error) {
      logger.error('店舗名の保存中にエラーが発生しました。', { error, guildId });
      await interaction.editReply({ content: '❌ 設定の保存中にエラーが発生しました。' });
    }
  },

  /** スレッドにログを記録する */
  async logToThread(interaction, addedStores) {
    try {
      const channel = interaction.channel;
      let thread = channel.threads.cache.find(x => x.name === THREAD_NAME && !x.archived);

      if (!thread) {
        const fetchedThreads = await channel.threads.fetchArchived();
        thread = fetchedThreads.threads.find(x => x.name === THREAD_NAME);
        if (thread) await thread.setArchived(false);
      }

      if (!thread) {
        thread = await channel.threads.create({ name: THREAD_NAME, reason: '店舗名設定のログ記録用' });
      }

      const logEmbed = new EmbedBuilder()
        .setTitle('🏪 店舗名追加ログ')
        .setDescription(`**操作者:** ${interaction.user}`)
        .addFields({ name: '追加された店舗名', value: `\`\`\`\n${addedStores.join('\n')}\n\`\`\`` })
        .setColor(0x2ECC71) // Green
        .setTimestamp();

      await thread.send({ embeds: [logEmbed] });
    } catch (error) {
      logger.error('店舗名設定ログのスレッドへの記録に失敗しました。', { error, guildId: interaction.guildId });
    }
  },
};