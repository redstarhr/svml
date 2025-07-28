// components/buttons/arrivalTimeButton.js
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
  customId: 'arrival_time_button', // ボタンのcustomId
  async handle(interaction) {
    // ボタン押下ユーザーが操作するチャンネル
    const guild = interaction.guild;

    // サーバー内のメンバーから選択肢を作成（例: キャストロールを持つメンバーのみ）
    // ここは必要に応じてフィルターをかけてください
    const members = await guild.members.fetch();
    const options = members
      .filter(member => !member.user.bot)
      .map(member => ({
        label: member.user.username,
        value: member.id,
      }))
      .slice(0, 25); // Discordセレクトは最大25選択肢まで

    if (options.length === 0) {
      await interaction.reply({ content: '選択可能なユーザーがいません。', ephemeral: true });
      return;
    }

    // セレクトメニューを作成
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('arrival_time_user_select')
      .setPlaceholder('出勤するユーザーを選択してください（複数選択可）')
      .setMinValues(1)
      .setMaxValues(Math.min(options.length, 25))
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
      content: '出勤するユーザーを選択してください。',
      components: [row],
      ephemeral: true,
    });
  },
};
