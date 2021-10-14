import { Bot } from '..';
const { NlpManager } = require('node-nlp');

const trainModel = () => {

    console.log("training model")

    // Adds the utterances and intents for the NLP
    manager.addDocument('en', 'goodbye for now', 'greetings.bye');
    manager.addDocument('en', 'bye bye take care', 'greetings.bye');
    manager.addDocument('en', 'okay see you later', 'greetings.bye');
    manager.addDocument('en', 'bye for now', 'greetings.bye');
    manager.addDocument('en', 'i must go', 'greetings.bye');
    manager.addDocument('en', 'hello', 'greetings.hello');
    manager.addDocument('en', 'howdy', 'greetings.hello');
    manager.addDocument('en', 'hi', 'greetings.hello');

    // Train also the NLG
    manager.addAnswer('en', 'greetings.bye', 'Till next time');
    manager.addAnswer('en', 'greetings.bye', 'see you soon!');
    manager.addAnswer('en', 'greetings.hello', 'Hey there!');
    manager.addAnswer('en', 'greetings.hello', 'Greetings!');

    // Train and save the model.
    (async () => {
        await manager.train();
        manager.save();
        console.log('model saved')
    })();
}

const logfn = (status:any, time:any) => console.log(status, time);
const manager = new NlpManager({ languages: ['en'], nlu: { log: logfn } });

trainModel()

export const attach = (bot: Bot) => {

    console.log('Running intent detection feature...');

    bot.on('caption', async (data) => {
        const response = await manager.process('en', data.caption.text);
        console.log(response);
    });
};
