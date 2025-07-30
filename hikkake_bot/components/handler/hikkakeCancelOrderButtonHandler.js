const { readState, writeState } = require('../../utils/hikkakeStateManager');
const { updateAllHikkakePanels } = require('../../utils/hikkakePanelManager');
const { logToThread } = require('../../utils/threadLogger');
const { logHikkakeEvent } = require('../../utils/hikkakeCsvLogger');
const logger = require('@common/logger');
const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  customId: /^cancel_order_(quest|tosu|horse)_(.+)$/,
  async execute(interaction, client) {
    try {
      await