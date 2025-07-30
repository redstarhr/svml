const {
  ActionRowBuilder,
  UserSelectMenuBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
} = require('discord.js');
const { getGuildConfig } = require('../utils/storeConfig');
const { updateUserProfile } = require('../utils/userConfig');
const logger = require('@common/logger');

const THREAD_NAME = 'ユーザー情報設定ログ';

module.exports = {
  async execute(interaction) {
    // 1. Initial button press
    if (interaction.isButton() && interaction.customId === 'config_register_user') {
      await this.handleRegisterUserButton(interaction);
      return true;
    }
    // 2. User selected
    if (interaction.isUserSelectMenu() && interaction.customId === 'config_select_user_for_registration') {
      await this.handleUserSelected(interaction);
      return true;
    }
    // 3. Store selected
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('config_select_store_for_')) {
      await this.handleStoreSelected(interaction);
      return true;
    }
    // 4. Modal submitted
    if (interaction.isModalSubmit() && interaction.customId.startsWith('config_real_name_modal_')) {
      await this.handleRealNameModal(interaction);
      return true;
    }
    return false;
  },

  /** 1. "ユーザー情報登録" ボタンの処理 */
  async handleRegisterUserButton(interaction) {
    const userSelect = new UserSelectMenuBuilder()
      .setCustomId('config_select_user_for_registration')
      .setPlaceholder('情報を登録するユーザーを選択してください。')
      .setMaxValues(1);

    const row = new ActionRowBuilder().addComponents(userSelect);

    await interaction.reply({
      content: 'どのユーザーの情報を登録しますか？',
      components: [row],
      ephemeral: true,
    });
  },

  /** 2. ユーザーが選択された後の処理 */
  async handleUserSelected(interaction) {
    const selectedUserId = interaction.values[0];
    const guildId = interaction.guild.id;
    const config = await getGuildConfig(guildId);
    const stores = config.stores || [];

    if (stores.length === 0) {
      return interaction.update({
        content: '⚠️ 店舗が登録されていません。先に「店舗名追加」から店舗を登録してください。',
        components: [],
      });
    }

    const storeSelect = new StringSelectMenuBuilder()
      .setCustomId(`config_select_store_for_${selectedUserId}`)
      .setPlaceholder('所属店舗を選択してください。')
      .addOptions(stores.map(store => ({
        label: store,
        value: store,
      })));

    const row = new ActionRowBuilder().addComponents(storeSelect);

    await interaction.update({
      content: `ユーザー <@${selectedUserId}> の所属店舗を選択してください。`,
      components: [row],
    });
  },

  /** 3. 店舗が選択された後の処理 */
  async handleStoreSelected(interaction) {
    const selectedStore = interaction.values[0];
    const userId = interaction.customId.replace('config_select_store_for_', '');

    const modal = new ModalBuilder()
      .setCustomId(`config_real_name_modal_${userId}_${selectedStore}`)
      .setTitle('本名の入力');

    const realNameInput = new TextInputBuilder()
      .setCustomId('real_name')
      .setLabel('本名を入力してください')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(realNameInput));
    await interaction.showModal(modal);
  },

  /** 4. 本名入力モーダルが送信された後の処理 */
  async handleRealNameModal(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const [,,, userId, store] = interaction.customId.split('_');
    const realName = interaction.fields.getTextInputValue('real_name');
    const guildId = interaction.guild.id;

    try {
      await updateUserProfile(guildId, userId, { realName, store });
      const user = await interaction.client.users.fetch(userId);

      await interaction.editReply({
        content: `✅ ユーザー **${user.tag}** の情報を登録しました。\n> 本名: \`${realName}\`\n> 所属店舗: \`${store}\``,
      });

      await this.logToThread(interaction, user, realName, store);

    } catch (error) {
      logger.error('ユーザー情報の保存中にエラーが発生しました。', { error, guildId, userId });
      await interaction.editReply({ content: '❌ 設定の保存中にエラーが発生しました。' });
    }
  },

  /** スレッドにログを記録する */
  async logToThread(interaction, user, realName, store) {
    try {
      const channel = interaction.channel;
      let thread = channel.threads.cache.find(x => x.name === THREAD_NAME && !x.archived);

      if (!thread) {
        const fetchedThreads = await channel.threads.fetchArchived();
        thread = fetchedThreads.threads.find(x => x.name === THREAD_NAME);
        if (thread) await thread.setArchived(false);
      }

      if (!thread) {
        thread = await channel.threads.create({ name: THREAD_NAME, reason: 'ユーザー情報設定のログ記録用' });
      }

      const logEmbed = new EmbedBuilder()
        .setTitle('👤 ユーザー情報登録ログ')
        .setDescription(`**操作者:** ${interaction.user}`)
        .addFields(
          { name: '対象ユーザー', value: `${user} (${user.tag})`, inline: false },
          { name: '本名', value: `\`${realName}\``, inline: true },
          { name: '所属店舗', value: `\`${store}\``, inline: true }
        )
        .setColor(0x3498DB) // Blue
        .setTimestamp();

      await thread.send({ embeds: [logEmbed] });
    } catch (error) {
      logger.error('ユーザー情報設定ログのスレッドへの記録に失敗しました。', { error, guildId: interaction.guildId });
    }
  },
};