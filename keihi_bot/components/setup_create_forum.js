// commands/dev/deploy.js
const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deploy')
    .setDescription('スラッシュコマンドを Discord に登録します（管理者用）'),

  adminOnly: true, // ✅ 共通チェックのために追加

  async execute(interaction) {
    // ✅ ここでの重複チェックは不要（interactionCreate側で共通化済）
    const commands = [];
    const commandsPath = path.join(__dirname, '..', '..');

    const walk = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
          const command = require(fullPath);
          if (command.data && typeof command.execute === 'function') {
            commands.push(command.data.toJSON());
          }
        }
      }
    };

    walk(commandsPath);

    try {
      const guild = interaction.guild;
      await guild.commands.set(commands);

      await interaction.reply({
        content: `✅ ${commands.length} 件のコマンドを \`${guild.name}\` に登録しました。`,
        flags: 64
      });

      console.log(`🆕 /deploy により ${guild.name} にコマンド登録 (${commands.length}件)`);
    } catch (err) {
      console.error('❌ コマンド登録失敗:', err);
      await interaction.reply({
        content: '⚠️ コマンドの登録に失敗しました。',
        flags: 64
      });
    }
  }
};
