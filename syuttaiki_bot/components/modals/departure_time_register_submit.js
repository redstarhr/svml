const { ModalSubmitInteraction } = require('discord.js');
const { updateDepartureTimes } = require('../../utils/departureTimeManager'); // 仮の処理関数（必要に応じて実装してください）
const { safeReply } = require('../../utils/safeReply');

module.exports = {
  customId: 'departure_time_register_submit',
  handle: async (interaction) => {
    // 入力された退勤時間を取得
    const departureTime = interaction.fields.getTextInputValue('departure_time_input');

    // 簡易バリデーション（HH:mm形式かどうか）
    if (!/^\d{1,2}:\d{2}$/.test(departureTime)) {
      await safeReply(interaction, { content: '退勤時間はHH:mm形式で入力してください。', ephemeral: true });
      return;
    }

    // 実際の退勤時間登録処理（例：DBやファイルへの保存）
    try {
      await updateDepartureTimes(interaction.guild.id, departureTime);
      await safeReply(interaction, { content: `退勤時間を「${departureTime}」として登録しました。`, ephemeral: true });
    } catch (error) {
      console.error('退勤時間登録中にエラー:', error);
      await safeReply(interaction, { content: '退勤時間の登録に失敗しました。', ephemeral: true });
    }
  },
};
