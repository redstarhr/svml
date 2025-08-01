// uriage_bot/commands/uriage_config.js

const {
    SlashCommandBuilder,
    ActionRowBuilder,
    RoleSelectMenuBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    MessageFlags,
} = require('discord.js');
const { updateState, readState } = require('../utils/uriageStateManager');
const logger = require('@common/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('売上報告設定')
        .setDescription('売上報告を承認できるロールを設定します。')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('承認ロールを設定します。')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('show')
                .setDescription('現在の設定内容を表示します。')
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const subcommand = interaction.options.getSubcommand();

        try {
            if (subcommand === 'set') {
                await handleSet(interaction);
            } else if (subcommand === 'show') {
                await handleShow(interaction);
            }
        } catch (error) {
            logger.error('売上報告設定コマンドの実行中にエラーが発生しました。', { guildId: interaction.guildId, error });
            await interaction.editReply({
                content: '設定の読み込み中にエラーが発生しました。しばらくしてからもう一度お試しください。',
                embeds: [], components: []
            });
        }
    },
};

async function handleSet(interaction) {
    const currentSettings = await readState(interaction.guildId);
    const selectMenu = new RoleSelectMenuBuilder()
        .setCustomId('uriage_select_approval_roles')
        .setPlaceholder('承認ロールを選択（複数可）')
        .setMinValues(0)
        .setMaxValues(10)
        .setDefaultRoles(currentSettings.approvalRoleIds);

    await interaction.editReply({
        content: '売上報告を承認できるロールを設定してください。',
        components: [new ActionRowBuilder().addComponents(selectMenu)],
    });
}

async function handleShow(interaction) {
    const state = await readState(interaction.guildId);
    const approvalRoles = state.approvalRoleIds.map(id => `<@&${id}>`).join(', ') || '未設定';

    const embed = new EmbedBuilder()
        .setTitle('⚙️ 売上報告 現在の設定')
        .addFields({ name: '承認ロール', value: approvalRoles })
        .setColor(0x3498DB);

    await interaction.editReply({ embeds: [embed] });
}
