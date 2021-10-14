import { Bot } from '..';
import { promises as fs } from 'fs';

export const attach = (bot: Bot) => {

    console.log('Running summary feature...');

    const summarizeText = async (text: string) : Promise<string>  => {
        console.log('summarizing')
        return text
    }

    bot.on('left', async ({ meetURL }) => {
        console.log('i left a meeting!', meetURL);
        const id = meetURL.split('/').pop();
        const transcriptions = await (await fs.readFile(`meet-${id}.log`)).toString();
        const summary = summarizeText(transcriptions)
        console.log(summary)
    });

    bot.on('end', async ({ meetURL }) => {
        console.log('meeting ended!', meetURL);
        const id = meetURL.split('/').pop();
        const transcriptions = await (await fs.readFile(`meet-${id}.log`)).toString();     
        const summary = summarizeText(transcriptions)
        console.log(summary)
    });
};
