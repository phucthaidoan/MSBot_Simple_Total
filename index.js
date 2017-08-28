const builder = require('botbuilder');
const restify = require('restify');

// Setup Restify Server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users
server.post('/api/messages', connector.listen());

// Receive messages from the user
const bot = new builder.UniversalBot(connector, [
    (session, args, next) => {
        const card = new builder.ThumbnailCard(session);
        card
            .buttons([
                new builder.CardAction(session)
                .title('Add a number')
                .value('Add')
                .type('imBack'),
                new builder.CardAction(session)
                .title('Get help')
                .value('Help')
                .type('imBack')
            ])
            .text('What would you like to do?');

        const message = new builder.Message(session);
        message.addAttachment(card);

        session.send(`Hi there! I'm the calculator bot! I can add numbers for you.`);
        const choices = ['Add', 'Help'];
        //builder.Prompts.choice(session, message, choices);

        session.endConversation(message);
    }
]);

bot
    .dialog('AddNumber', [
        (session, args, next) => {
            let message = null;
            if (!session.privateConversationData.runningTotal) {
                message = 'Give me the first number';
                session.privateConversationData.runningTotal = 0;
            } else {
                message = `Give me the next number, or say *total* to display the total`;
            }
            builder.Prompts.number(session, message, { maxRetries: 3 });
        },
        (session, results, next) => {
            if (results.response) {
                session.privateConversationData.runningTotal += results.response;
                session.replaceDialog('AddNumber');
            } else {
                session.endConversation(`Sorry, I don't understand. Let's start over.`)
            }
        }
    ])
    .triggerAction({
        matches: /^add$/i
    });