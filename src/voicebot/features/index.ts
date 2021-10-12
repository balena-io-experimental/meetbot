import * as Flowdock from './flowdock';
import * as Storage from './storage';
import * as Comments from './comments';

export const all = [Flowdock, Storage, Comments];
export const flowdock = Flowdock;
export const storage = Storage;
export const comments = Comments;
