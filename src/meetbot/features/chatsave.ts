import { Bot } from ".."
import { GoogleDoc } from '../google-doc';

export const attach = (bot: Bot): void => {
    const doc = new GoogleDoc();
    let docId: string;
    console.log('Attached Chat Saver');
    
    bot.on('joined', async ({ meetURL }) => {
        const meetId = meetURL.split('/').pop();
        const docName = `Meeting ${meetId} (${new Date().toISOString()}) Chat`;
        docId = await doc.create(docName);
    });
    bot.on('chat', async ({timestamp, sender, text}) => {
        await doc.addEntry(docId, {timestamp: timestamp as string, author: sender as string, text});
    });
}
