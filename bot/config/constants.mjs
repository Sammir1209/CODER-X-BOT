import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const ROOT_DIR = join(__dirname, '../../');
export const USERS_DB_PATH = join(__dirname, '../../server/usersDb.json');
export const DIST_DIR = join(__dirname, '../../dist');
export const ZIP_PATH = join(__dirname, '../../dist/CODEX_R_Extension.zip');

export const BOT_TOKEN = process.env.BOT_TOKEN || '8953633941:AAE8E0o00iIlVBnP57_y3Q8UIk5I_-ZwRCw';
export const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

export const OWNER_IDS = ['7794982496', '7317734631'];
export const OWNER_1_LINK = 'https://t.me/S_14xx';
export const OWNER_2_LINK = 'https://t.me/mrcodexofc';

export const PORT = process.env.PORT || 10000;
