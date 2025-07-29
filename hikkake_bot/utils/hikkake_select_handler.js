// hikkake_bot/utils/hikkake_select_handler.js
const arrivalSelectHandler = require('./hikkakeArrivalSelect.js');
const dohanSelectHandler = require('./hikkakeDohanSelect.js');
const orderSelectHandler = require('./hikkakeOrderSelect.js');
const plakamaSelectHandler = require('./hikkakePlakamaSelect.js');
const reactionDeleteSelectHandler = require('./hikkakeReactionDeleteSelect.js');
const resolveLogSelectHandler = require('./hikkakeResolveLogSelect.js');
const retireLogSelectHandler = require('./hikkakeRetireLogSelect.js');

const handlers = [
    arrivalSelectHandler,
    dohanSelectHandler,
    orderSelectHandler,
    plakamaSelectHandler,
    reactionDeleteSelectHandler,
    resolveLogSelectHandler,
    retireLogSelectHandler,
];

function findHandler(customId) {
    return handlers.find(h => h.customId.test(customId));
}

module.exports = {
    async execute(interaction) {
        if (!interaction.isAnySelectMenu()) return false;

        const handler = findHandler(interaction.customId);
        if (handler) {
            await handler.handle(interaction);
            return true;
        }
        return false;
    }
};