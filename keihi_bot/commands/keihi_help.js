// commands/dev/help.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('📘 経費申請Botの使い方を表示します'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('📘 経費申請Bot の使い方')
      .setColor(0x3498db)
      .setDescription('以下のスラッシュコマンドとボタンを使って経費申請を行えます。')
      .addFields(
        {
          name: '/経費申請設置',
          value: '📌 経費申請ボタンの設置（管理者専用）',
        },
        {
          name: '/経費申請履歴',
          value: '📊 自分の過去の申請履歴を確認（選択式）',
        },
        {
          name: '/経費申請embed',
          value: '📎 経費申請embedを再送信（必要に応じて使用）',
        },
        {
          name: '📩 経費申請ボタン',
          value: 'フォーム入力 → 申請送信 → スレッド or シートに保存されます',
        }
      )
      .setFooter({ text: 'STAR管理bot © 2025' });

    await interaction.reply({ embeds: [embed], flags: 64 });
  }
};
