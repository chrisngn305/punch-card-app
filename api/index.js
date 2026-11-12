// Vercel serverless function: every /api/* request is rewritten here (see
// vercel.json) and keeps its original URL, so handler.js routes it as usual.
import { handleApi } from '../handler.js';

export default handleApi;
