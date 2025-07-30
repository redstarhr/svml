// commands/dev/help.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('keihi_help')
    .setDescription('📘 経費申請Botの使い方を表示します'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('📘 経費申請Bot の使い方')
      .setColor(0x3498db)
      .setDescription('以下のスラッシュコマンドとボタンを使って経費申請を行えます。')
      .addFields(
        {
          name: '/keihi_setti',
          value: '📌 このチャンネルに経費申請ボタンを設置します。（管理者専用）',
        },
        {
          name: '/keihi_config',
          value: '⚙️ 経費申請の承認/閲覧ロールを設定します。（管理者専用）',
        },
        {
          name: '/keihi_rireki',
          value: '📊 承認待ちの経費申請を確認・処理します。（管理者専用）',
        },
        {
          name: '/keihi_csv',
          value: '📄 申請された経費をCSV形式でダウンロードします。（管理者専用）',
        },
        {
          name: '📩 経費申請ボタン',
          value: 'ボタンを押して表示されるフォームから経費を申請します。',
        }
      )
      .setFooter({ text: 'STAR管理bot © 2025' });

    await interaction.reply({ embeds: [embed], flags: 64 });
  }
};
