// interactionCreate.js

const {
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  InteractionType,
  StringSelectMenuBuilder,
  EmbedBuilder,
} = require('discord.js');
const { readFileNamesFromGCS, saveJsonToGCS } = require('../utils/gcs');

const BUCKET_NAME = process.env.GCS_BUCKET_NAME;

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // 環境変数が設定されていない場合は処理を中断
    if (!BUCKET_NAME) {
      console.error('❌ 環境変数 GCS_BUCKET_NAME が設定されていません。interactionCreate の処理を中止します。');
      return;
    }

    try {
      const guildId = interaction.guildId;
      if (!guildId) return; // DMなどギルド外は無視

      // --- 売上報告ボタン押下時 ---
      if (interaction.isButton() && interaction.customId === 'sales_report') {
        const modal = new ModalBuilder()
          .setCustomId('sales_modal')
          .setTitle('売上報告');

        const fields = [
          { id: 'date', label: '日付 (例: 7/7)', required: true },
          { id: 'total', label: '総売り (数字のみ)', required: true },
          { id: 'cash', label: '現金', required: false },
          { id: 'card', label: 'カード', required: false },
          { id: 'expense', label: '諸経費', required: false },
        ];

        fields.forEach(({ id, label, required }) => {
          const input = new TextInputBuilder()
            .setCustomId(id)
            .setLabel(label)
            .setStyle(TextInputStyle.Short)
            .setRequired(required);
          modal.addComponents(new ActionRowBuilder().addComponents(input));
        });

        await interaction.showModal(modal);
        return;
      }

      // --- 売上報告モーダル送信時 ---
      if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'sales_modal') {
        await interaction.deferReply({ ephemeral: true });

        const date = interaction.fields.getTextInputValue('date');
        const total = interaction.fields.getTextInputValue('total');
        const cash = interaction.fields.getTextInputValue('cash');
        const card = interaction.fields.getTextInputValue('card');
        const expense = interaction.fields.getTextInputValue('expense');

        const now = new Date();
        const year = now.getFullYear();
        const timestamp = now.toISOString();

        const fileName = `${year}_${date.replace(/\//g, '-')}_${interaction.user.id}.json`;
        const filePath = `data/${guildId}/sales/${fileName}`;

        const report = {
          user: {
            id: interaction.user.id,
            tag: interaction.user.tag,
          },
          date,
          total,
          cash,
          card,
          expense,
          submittedAt: timestamp,
        };

        await saveJsonToGCS(filePath, report);

        await interaction.editReply({
          content: `✅ 売上報告を保存しました。\nファイル名: \`${fileName}\``,
        });
        return;
      }

      // --- CSV セレクトメニュー選択時 ---
      if (interaction.isStringSelectMenu()) {
        const { customId, values } = interaction;
        if (!['select_date', 'select_month', 'select_quarter'].includes(customId)) return;

        await interaction.deferReply({ ephemeral: true });

        const prefixMap = {
          select_date: '',
          select_month: 'month_',
          select_quarter: 'quarter_',
        };

        const selected = values[0];
        const fileName = `${prefixMap[customId]}${selected}.csv`;
        const fileUrl = `https://storage.googleapis.com/${BUCKET_NAME}/data/${guildId}/csv/${fileName}`;

        const embed = new EmbedBuilder()
          .setTitle('📄 CSVダウンロード')
          .setDescription(`以下のリンクからCSVをダウンロードできます：\n[${fileName}](${fileUrl})`)
          .setColor(0x00AE86);

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      // --- CSVダウンロードボタン押下時 ---
      if (interaction.isButton() && ['csv_date', 'csv_month', 'csv_quarter'].includes(interaction.customId)) {
        await interaction.deferReply({ ephemeral: true });

        const type = interaction.customId.replace('csv_', '');
        const dirPath = `data/${guildId}/csv/`;

        const files = await readFileNamesFromGCS(dirPath);

        const filterPatterns = {
          date: /^\d{4}-\d{1,2}.*\.csv$/,
          month: /^month_\d{4}-\d{1,2}\.csv$/,
          quarter: /^quarter_\d{4}_Q[1-4]\.csv$/,
        };

        const filtered = files.filter(f => filterPatterns[type]?.test(f));

        if (filtered.length === 0) {
          await interaction.editReply({ content: '対象ファイルが見つかりませんでした。' });
          return;
        }

        if (filtered.length === 1) {
          const fileName = filtered[0];
          const fileUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${dirPath}${fileName}`;

          const embed = new EmbedBuilder()
            .setTitle('📄 CSVダウンロード')
            .setDescription(`[${fileName}](${fileUrl}) をダウンロードできます。`)
            .setColor(0x00AE86);

          await interaction.editReply({ embeds: [embed] });
          return;
        }

        // 複数ファイル → セレクトメニューを提示
        const options = filtered.slice(0, 25).map(f => ({
          label: f.replace(/^(month_|quarter_)?/, '').replace('.csv', ''),
          value: f.replace(/^(month_|quarter_)?/, '').replace('.csv', ''),
        }));

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(`select_${type}`)
          .setPlaceholder('ダウンロードするCSVを選択...')
          .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.editReply({
          content: 'ダウンロード対象を選択してください。',
          components: [row],
        });
      }
    } catch (error) {
      console.error('[interactionCreate] エラー:', error);

      if (!interaction.replied && !interaction.deferred) {
        try {
          await interaction.reply({
            content: '⚠️ 内部エラーが発生しました。管理者に連絡してください。',
            ephemeral: true,
          });
        } catch {}
      }
    }
  },
};
