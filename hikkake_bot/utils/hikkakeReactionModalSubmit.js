// hikkake_bot/utils/hikkakeReactionModalSubmit.js

const { readReactions, writeReactions } = require('./hikkakeReactionManager');

module.exports = {
  customId: /^hikkake_reaction_submit_(quest|tosu|horse)_(num|count)$/,
  async handle(interaction) {
    await interaction.deferReply({ flags: 64 }); // Ephemeral

    const match = interaction.customId.match(this.customId);
    const [, type, key] = match; // key is 'num' or 'count'

    const targetValueRaw = interaction.fields.getTextInputValue('target_value'); // e.g., "1人" or "3本"
    const newMessagesRaw = interaction.fields.getTextInputValue('reaction_messages');
    const newMessages = newMessagesRaw.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    const parsedValue = parseInt(targetValueRaw, 10);

    if (isNaN(parsedValue)) {
      await interaction.editReply({ content: `エラー: 「${targetValueRaw}」から数値を読み取れませんでした。半角数字で始めてください。` });
      return;
    }
    const valueKey = String(parsedValue);

    if (newMessages.length === 0) {
      await interaction.editReply({ content: '追加する反応文が入力されていません。' });
      return;
    }

    const guildId = interaction.guildId;

    try {
      const reactions = await readReactions(guildId);

      // Ensure the nested structure exists
      if (!reactions[type]) reactions[type] = {};
      if (!reactions[type][key]) reactions[type][key] = {};
      if (!reactions[type][key][valueKey]) reactions[type][key][valueKey] = [];

      // Add new messages, avoiding duplicates
      const existingMessages = new Set(reactions[type][key][valueKey]);
      newMessages.forEach(msg => existingMessages.add(msg));
      reactions[type][key][valueKey] = Array.from(existingMessages);

      await writeReactions(guildId, reactions);

      await interaction.editReply({
        content: `✅ 設定を保存しました。\n**対象:** ${type.toUpperCase()} / ${key === 'num' ? '人数' : '本数'} / ${parsedValue}\n**追加された反応文:**\n- ${newMessages.join('\n- ')}`,
      });
    } catch (error) {
      console.error('[hikkakeReactionModalSubmit] リアクション保存エラー:', error);
      await interaction.editReply({ content: 'エラーが発生し、設定を保存できませんでした。' });
    }
  },
};