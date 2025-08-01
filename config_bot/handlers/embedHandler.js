const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  MessageFlags,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const logger = require('@common/logger');

// --- Custom IDs ---
// 初期パネル
const NEW_BUTTON_ID = 'embed_builder_new';
const EDIT_BUTTON_ID = 'embed_builder_edit';

// ビルダーパネル
const SET_TITLE_ID = 'embed_set_title';
const SET_DESCRIPTION_ID = 'embed_set_description';
const SET_URL_ID = 'embed_set_url';
const SET_COLOR_ID = 'embed_set_color';
const SET_FOOTER_ID = 'embed_set_footer';
const SET_IMAGE_ID = 'embed_set_image';
const SET_THUMBNAIL_ID = 'embed_set_thumbnail';
const ADD_FIELD_ID = 'embed_add_field';
const EDIT_FIELD_ID = 'embed_edit_field';
const REMOVE_FIELD_ID = 'embed_remove_field';
const SEND_ID = 'embed_send';
const SAVE_ID = 'embed_save';
const DISCARD_ID = 'embed_discard';

// モーダル
const TITLE_MODAL_ID = 'embed_title_modal';
const TITLE_INPUT_ID = 'embed_title_input';
const DESCRIPTION_MODAL_ID = 'embed_description_modal';
const DESCRIPTION_INPUT_ID = 'embed_description_input';
const URL_MODAL_ID = 'embed_url_modal';
const URL_INPUT_ID = 'embed_url_input';
const COLOR_MODAL_ID = 'embed_color_modal';
const COLOR_INPUT_ID = 'embed_color_input';
const FOOTER_MODAL_ID = 'embed_footer_modal';
const FOOTER_TEXT_ID = 'embed_footer_text';
const IMAGE_MODAL_ID = 'embed_image_modal';
const IMAGE_URL_ID = 'embed_image_url';
const THUMBNAIL_MODAL_ID = 'embed_thumbnail_modal';
const THUMBNAIL_URL_ID = 'embed_thumbnail_url';
const ADD_FIELD_MODAL_ID = 'embed_add_field_modal';
const FIELD_NAME_ID = 'embed_field_name';
const FIELD_VALUE_ID = 'embed_field_value';

module.exports = {
  async execute(interaction) {
    if (interaction.isButton()) {
      return this.handleButton(interaction);
    }
    if (interaction.isModalSubmit()) {
      return this.handleModal(interaction);
    }
    return false;
  },

  async handleButton(interaction) {
    const { customId } = interaction;

    if (customId === NEW_BUTTON_ID) {
      await this.showBuilderInterface(interaction);
      return true;
    }

    if (customId === EDIT_BUTTON_ID) {
      await interaction.update({ content: 'この機能は現在開発中です。', embeds: [], components: [] });
      return true;
    }

    if (customId === SET_TITLE_ID) {
      await this.showTitleModal(interaction);
      return true;
    }

    if (customId === SET_DESCRIPTION_ID) {
      await this.showDescriptionModal(interaction);
      return true;
    }

    if (customId === SET_URL_ID) {
      await this.showUrlModal(interaction);
      return true;
    }

    if (customId === SET_COLOR_ID) {
      await this.showColorModal(interaction);
      return true;
    }

    if (customId === SET_FOOTER_ID) {
      await this.showFooterModal(interaction);
      return true;
    }

    if (customId === SET_IMAGE_ID) {
      await this.showImageModal(interaction);
      return true;
    }

    if (customId === SET_THUMBNAIL_ID) {
      await this.showThumbnailModal(interaction);
      return true;
    }

    if (customId === ADD_FIELD_ID) {
      await this.showAddFieldModal(interaction);
      return true;
    }

    return false;
  },

  async handleModal(interaction) {
    const { customId } = interaction;

    if (customId === TITLE_MODAL_ID) {
      await this.handleTitleModalSubmit(interaction);
      return true;
    }

    if (customId === DESCRIPTION_MODAL_ID) {
      await this.handleDescriptionModalSubmit(interaction);
      return true;
    }

    if (customId === URL_MODAL_ID) {
      await this.handleUrlModalSubmit(interaction);
      return true;
    }

    if (customId === COLOR_MODAL_ID) {
      await this.handleColorModalSubmit(interaction);
      return true;
    }

    if (customId === FOOTER_MODAL_ID) {
      await this.handleFooterModalSubmit(interaction);
      return true;
    }

    if (customId === IMAGE_MODAL_ID) {
      await this.handleImageModalSubmit(interaction);
      return true;
    }

    if (customId === THUMBNAIL_MODAL_ID) {
      await this.handleThumbnailModalSubmit(interaction);
      return true;
    }

    if (customId === ADD_FIELD_MODAL_ID) {
      await this.handleAddFieldModalSubmit(interaction);
      return true;
    }

    if (customId === SEND_ID) {
      await this.handleSend(interaction);
      return true;
    }

    if (customId === DISCARD_ID) {
      await this.handleDiscard(interaction);
      return true;
    }

    return false;
  },

  /**
   * EmbedビルダーのUIを表示または更新します。
   * @param {import('discord.js').ButtonInteraction} interaction
   */
  async showBuilderInterface(interaction) {
    const previewEmbed = new EmbedBuilder()
      .setTitle('Embedプレビュー')
      .setDescription('上のボタンから各項目を設定してください。\n\n*ここにプレビューが表示されます*')
      .setColor(0x4E5058); // Discord Gray

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(SET_TITLE_ID).setLabel('タイトル').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(SET_DESCRIPTION_ID).setLabel('本文').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(SET_URL_ID).setLabel('URL').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(SET_COLOR_ID).setLabel('色').setStyle(ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(SET_FOOTER_ID).setLabel('フッター').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(SET_IMAGE_ID).setLabel('画像').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(SET_THUMBNAIL_ID).setLabel('サムネイル').setStyle(ButtonStyle.Secondary)
    );

    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(ADD_FIELD_ID).setLabel('フィールド追加').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(EDIT_FIELD_ID).setLabel('フィールド編集').setStyle(ButtonStyle.Primary).setDisabled(true), // TODO: 実装時に有効化
      new ButtonBuilder().setCustomId(REMOVE_FIELD_ID).setLabel('フィールド削除').setStyle(ButtonStyle.Primary).setDisabled(true) // TODO: 実装時に有効化
    );

    const row4 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(SEND_ID).setLabel('送信').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(SAVE_ID).setLabel('保存して終了').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(DISCARD_ID).setLabel('破棄').setStyle(ButtonStyle.Danger)
    );

    await interaction.update({
      embeds: [previewEmbed],
      components: [row1, row2, row3, row4],
    });
  },

  /**
   * タイトル設定用のモーダルを表示します。
   * @param {import('discord.js').ButtonInteraction} interaction
   */
  async showTitleModal(interaction) {
    const currentEmbed = EmbedBuilder.from(interaction.message.embeds[0]);

    const modal = new ModalBuilder()
      .setCustomId(TITLE_MODAL_ID)
      .setTitle('タイトルの設定');

    const titleInput = new TextInputBuilder()
      .setCustomId(TITLE_INPUT_ID)
      .setLabel('新しいタイトルを入力')
      .setStyle(TextInputStyle.Short)
      .setValue(currentEmbed.data.title?.replace(' (プレビュー)', '') ?? '')
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(titleInput));
    await interaction.showModal(modal);
  },

  /**
   * タイトル設定モーダルの送信を処理します。
   * @param {import('discord.js').ModalSubmitInteraction} interaction
   */
  async handleTitleModalSubmit(interaction) {
    const newTitle = interaction.fields.getTextInputValue(TITLE_INPUT_ID);
    const newEmbed = EmbedBuilder.from(interaction.message.embeds[0]).setTitle(`${newTitle} (プレビュー)`);

    await interaction.update({ embeds: [newEmbed] });
  },

  /**
   * 本文設定用のモーダルを表示します。
   * @param {import('discord.js').ButtonInteraction} interaction
   */
  async showDescriptionModal(interaction) {
    const currentEmbed = EmbedBuilder.from(interaction.message.embeds[0]);

    const modal = new ModalBuilder()
      .setCustomId(DESCRIPTION_MODAL_ID)
      .setTitle('本文の設定');

    const descriptionInput = new TextInputBuilder()
      .setCustomId(DESCRIPTION_INPUT_ID)
      .setLabel('新しい本文を入力')
      .setStyle(TextInputStyle.Paragraph) // 長文入力に対応
      .setValue(currentEmbed.data.description?.replace(/\n\n\*ここにプレビューが表示されます\*/, '') ?? '')
      .setRequired(false);

    modal.addComponents(new ActionRowBuilder().addComponents(descriptionInput));
    await interaction.showModal(modal);
  },

  /**
   * 本文設定モーダルの送信を処理します。
   * @param {import('discord.js').ModalSubmitInteraction} interaction
   */
  async handleDescriptionModalSubmit(interaction) {
    const newDescription = interaction.fields.getTextInputValue(DESCRIPTION_INPUT_ID);
    const newEmbed = EmbedBuilder.from(interaction.message.embeds[0]).setDescription(newDescription);

    await interaction.update({ embeds: [newEmbed] });
  },

  /**
   * URL設定用のモーダルを表示します。
   * @param {import('discord.js').ButtonInteraction} interaction
   */
  async showUrlModal(interaction) {
    const currentEmbed = EmbedBuilder.from(interaction.message.embeds[0]);

    const modal = new ModalBuilder()
      .setCustomId(URL_MODAL_ID)
      .setTitle('URLの設定');

    const urlInput = new TextInputBuilder()
      .setCustomId(URL_INPUT_ID)
      .setLabel('タイトルに設定するURLを入力')
      .setStyle(TextInputStyle.Short)
      .setValue(currentEmbed.data.url ?? '')
      .setPlaceholder('https://example.com')
      .setRequired(false);

    modal.addComponents(new ActionRowBuilder().addComponents(urlInput));
    await interaction.showModal(modal);
  },

  /**
   * URL設定モーダルの送信を処理します。
   * @param {import('discord.js').ModalSubmitInteraction} interaction
   */
  async handleUrlModalSubmit(interaction) {
    const newUrl = interaction.fields.getTextInputValue(URL_INPUT_ID);

    try {
      // URLが有効かどうかの簡易チェック
      if (newUrl) new URL(newUrl);

      const newEmbed = EmbedBuilder.from(interaction.message.embeds[0]).setURL(newUrl || null);
      await interaction.update({ embeds: [newEmbed] });
    } catch (error) {
      await interaction.reply({ content: '⚠️ 無効なURL形式です。正しいURLを入力してください。', flags: MessageFlags.Ephemeral });
    }
  },

  /**
   * 色設定用のモーダルを表示します。
   * @param {import('discord.js').ButtonInteraction} interaction
   */
  async showColorModal(interaction) {
    const currentEmbed = EmbedBuilder.from(interaction.message.embeds[0]);

    const modal = new ModalBuilder()
      .setCustomId(COLOR_MODAL_ID)
      .setTitle('色の設定');

    const colorInput = new TextInputBuilder()
      .setCustomId(COLOR_INPUT_ID)
      .setLabel('16進数カラーコードを入力 (例: 3498db)')
      .setStyle(TextInputStyle.Short)
      .setValue(currentEmbed.data.color?.toString(16).padStart(6, '0') ?? '4E5058')
      .setRequired(false);

    modal.addComponents(new ActionRowBuilder().addComponents(colorInput));
    await interaction.showModal(modal);
  },

  /**
   * 色設定モーダルの送信を処理します。
   * @param {import('discord.js').ModalSubmitInteraction} interaction
   */
  async handleColorModalSubmit(interaction) {
    const newColorHex = interaction.fields.getTextInputValue(COLOR_INPUT_ID);

    // 16進数カラーコードとして有効かチェック
    if (!/^[0-9a-fA-F]{6}$/.test(newColorHex)) {
      return interaction.reply({
        content: '⚠️ 無効なカラーコードです。`3498db` のような6桁の16進数コードを入力してください。',
        flags: MessageFlags.Ephemeral,
      });
    }

    const newColor = parseInt(newColorHex, 16);
    const newEmbed = EmbedBuilder.from(interaction.message.embeds[0]).setColor(newColor);
    await interaction.update({ embeds: [newEmbed] });
  },

  /**
   * フッター設定用のモーダルを表示します。
   * @param {import('discord.js').ButtonInteraction} interaction
   */
  async showFooterModal(interaction) {
    const currentEmbed = EmbedBuilder.from(interaction.message.embeds[0]);

    const modal = new ModalBuilder()
      .setCustomId(FOOTER_MODAL_ID)
      .setTitle('フッターの設定');

    const footerInput = new TextInputBuilder()
      .setCustomId(FOOTER_TEXT_ID)
      .setLabel('フッターに表示するテキストを入力')
      .setStyle(TextInputStyle.Short)
      .setValue(currentEmbed.data.footer?.text ?? '')
      .setRequired(false);

    modal.addComponents(new ActionRowBuilder().addComponents(footerInput));
    await interaction.showModal(modal);
  },

  /**
   * フッター設定モーダルの送信を処理します。
   * @param {import('discord.js').ModalSubmitInteraction} interaction
   */
  async handleFooterModalSubmit(interaction) {
    const newFooterText = interaction.fields.getTextInputValue(FOOTER_TEXT_ID);
    const newEmbed = EmbedBuilder.from(interaction.message.embeds[0]);

    if (newFooterText) {
      newEmbed.setFooter({ text: newFooterText });
    } else {
      newEmbed.setFooter(null);
    }

    await interaction.update({ embeds: [newEmbed] });
  },

  /**
   * 画像設定用のモーダルを表示します。
   * @param {import('discord.js').ButtonInteraction} interaction
   */
  async showImageModal(interaction) {
    const currentEmbed = EmbedBuilder.from(interaction.message.embeds[0]);

    const modal = new ModalBuilder()
      .setCustomId(IMAGE_MODAL_ID)
      .setTitle('画像の設定');

    const imageUrlInput = new TextInputBuilder()
      .setCustomId(IMAGE_URL_ID)
      .setLabel('画像のURLを入力')
      .setStyle(TextInputStyle.Short)
      .setValue(currentEmbed.data.image?.url ?? '')
      .setPlaceholder('https://example.com/image.png')
      .setRequired(false);

    modal.addComponents(new ActionRowBuilder().addComponents(imageUrlInput));
    await interaction.showModal(modal);
  },

  /**
   * 画像設定モーダルの送信を処理します。
   * @param {import('discord.js').ModalSubmitInteraction} interaction
   */
  async handleImageModalSubmit(interaction) {
    const newImageUrl = interaction.fields.getTextInputValue(IMAGE_URL_ID);

    try {
      // URLが有効かどうかの簡易チェック
      if (newImageUrl) new URL(newImageUrl);

      const newEmbed = EmbedBuilder.from(interaction.message.embeds[0]).setImage(newImageUrl || null);
      await interaction.update({ embeds: [newEmbed] });
    } catch (error) {
      await interaction.reply({ content: '⚠️ 無効なURL形式です。正しいURLを入力してください。', flags: MessageFlags.Ephemeral });
    }
  },

  /**
   * サムネイル設定用のモーダルを表示します。
   * @param {import('discord.js').ButtonInteraction} interaction
   */
  async showThumbnailModal(interaction) {
    const currentEmbed = EmbedBuilder.from(interaction.message.embeds[0]);

    const modal = new ModalBuilder()
      .setCustomId(THUMBNAIL_MODAL_ID)
      .setTitle('サムネイルの設定');

    const thumbnailUrlInput = new TextInputBuilder()
      .setCustomId(THUMBNAIL_URL_ID)
      .setLabel('サムネイル画像のURLを入力')
      .setStyle(TextInputStyle.Short)
      .setValue(currentEmbed.data.thumbnail?.url ?? '')
      .setPlaceholder('https://example.com/thumbnail.png')
      .setRequired(false);

    modal.addComponents(new ActionRowBuilder().addComponents(thumbnailUrlInput));
    await interaction.showModal(modal);
  },

  /**
   * サムネイル設定モーダルの送信を処理します。
   * @param {import('discord.js').ModalSubmitInteraction} interaction
   */
  async handleThumbnailModalSubmit(interaction) {
    const newThumbnailUrl = interaction.fields.getTextInputValue(THUMBNAIL_URL_ID);

    try {
      // URLが有効かどうかの簡易チェック
      if (newThumbnailUrl) new URL(newThumbnailUrl);

      const newEmbed = EmbedBuilder.from(interaction.message.embeds[0]).setThumbnail(newThumbnailUrl || null);
      await interaction.update({ embeds: [newEmbed] });
    } catch (error) {
      await interaction.reply({ content: '⚠️ 無効なURL形式です。正しいURLを入力してください。', flags: MessageFlags.Ephemeral });
    }
  },

  /**
   * フィールド追加用のモーダルを表示します。
   * @param {import('discord.js').ButtonInteraction} interaction
   */
  async showAddFieldModal(interaction) {
    const modal = new ModalBuilder()
      .setCustomId(ADD_FIELD_MODAL_ID)
      .setTitle('フィールドの追加');

    const fieldNameInput = new TextInputBuilder()
      .setCustomId(FIELD_NAME_ID)
      .setLabel('フィールド名 (タイトル)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const fieldValueInput = new TextInputBuilder()
      .setCustomId(FIELD_VALUE_ID)
      .setLabel('フィールド値 (内容)')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(fieldNameInput),
      new ActionRowBuilder().addComponents(fieldValueInput)
    );

    await interaction.showModal(modal);
  },

  /**
   * フィールド追加モーダルの送信を処理します。
   * @param {import('discord.js').ModalSubmitInteraction} interaction
   */
  async handleAddFieldModalSubmit(interaction) {
    const name = interaction.fields.getTextInputValue(FIELD_NAME_ID);
    const value = interaction.fields.getTextInputValue(FIELD_VALUE_ID);

    const newEmbed = EmbedBuilder.from(interaction.message.embeds[0]).addFields({
      name,
      value,
      inline: false, // Defaulting to not inline for now
    });

    await interaction.update({ embeds: [newEmbed] });
  },

  /**
   * [送信]ボタンの処理。作成したEmbedをチャンネルに投稿します。
   * @param {import('discord.js').ButtonInteraction} interaction
   */
  async handleSend(interaction) {
    const previewEmbed = EmbedBuilder.from(interaction.message.embeds[0]);

    // プレビュー用のテキストを削除
    if (previewEmbed.data.title?.endsWith(' (プレビュー)')) {
      previewEmbed.setTitle(previewEmbed.data.title.replace(' (プレビュー)', ''));
    }
    if (previewEmbed.data.description?.includes('*ここにプレビューが表示されます*')) {
      previewEmbed.setDescription(null);
    }

    try {
      await interaction.channel.send({ embeds: [previewEmbed] });
      await interaction.update({
        content: '✅ Embedを送信しました。',
        embeds: [],
        components: [],
      });
    } catch (error) {
      logger.error('Embedの送信中にエラーが発生しました。', { error, guildId: interaction.guildId });
      await interaction.followUp({
        content: '❌ Embedの送信中にエラーが発生しました。Botにチャンネルへの送信権限があるか確認してください。',
        flags: MessageFlags.Ephemeral,
      });
    }
  },

  async handleDiscard(interaction) {
    await interaction.update({
      content: '🗑️ Embedの作成を破棄しました。',
      embeds: [],
      components: [],
    });
  },
};