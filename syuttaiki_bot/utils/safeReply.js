async function safeReply(interaction, options) {
  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ ...options, ephemeral: true });
    } else {
      await interaction.reply({ ...options, ephemeral: true });
    }
  } catch (error) {
    console.error('safeReply error:', error);
  }
}

module.exports = { safeReply };
