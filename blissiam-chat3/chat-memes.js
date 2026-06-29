// ============================================================
// Blissiam — Built-in Memes (ทำงานได้แม้ไม่มี Giphy API)
// ============================================================

const BUILTIN_MEMES = [
    { id: 'm01', label: 'หัวเราะ', url: 'https://media.giphy.com/media/13CoXDiaCcGy96/giphy.gif', tags: ['laugh', 'ฮา'] },
    { id: 'm02', label: 'โอเค', url: 'https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif', tags: ['ok', 'โอเค'] },
    { id: 'm03', label: 'กอด', url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH32/giphy.gif', tags: ['hug', 'กอด'] },
    { id: 'm04', label: 'ร้องไห้', url: 'https://media.giphy.com/media/1142wF0vIWijZe/giphy.gif', tags: ['cry', 'เศร้า'] },
    { id: 'm05', label: 'ปรบมือ', url: 'https://media.giphy.com/media/7rj2ZgTvgovYDJiEBq/giphy.gif', tags: ['clap', 'เก่ง'] },
    { id: 'm06', label: 'ดีใจ', url: 'https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif', tags: ['happy', 'ดีใจ'] },
    { id: 'm07', label: 'ชื่นชม', url: 'https://media.giphy.com/media/111ebatPfhSKJm/giphy.gif', tags: ['nice', 'เยี่ยม'] },
    { id: 'm08', label: 'สู้ๆ', url: 'https://media.giphy.com/media/3o7abldet0l7e6v0Na/giphy.gif', tags: ['fire', 'สู้'] },
    { id: 'm09', label: 'ขอบคุณ', url: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif', tags: ['thanks', 'ขอบคุณ'] },
    { id: 'm10', label: 'โบกมือ', url: 'https://media.giphy.com/media/3o6Zt6MLvBKVcJmXmM/giphy.gif', tags: ['wave', 'สวัสดี'] },
    { id: 'm11', label: 'นอน', url: 'https://media.giphy.com/media/3o6fJ1BM7R2EBRDnEK/giphy.gif', tags: ['sleep', 'เหนื่อย'] },
    { id: 'm12', label: 'คิด', url: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVy/giphy.gif', tags: ['think', 'คิด'] },
    { id: 'm13', label: 'ตกใจ', url: 'https://media.giphy.com/media/3oz8xAFtqoOUOmhNUQ/giphy.gif', tags: ['wow', 'ตกใจ'] },
    { id: 'm14', label: 'ชิล', url: 'https://media.giphy.com/media/l0HlBO7eyXasxjjry/giphy.gif', tags: ['chill', 'สบาย'] },
    { id: 'm15', label: 'หน้าตก', url: 'https://media.giphy.com/media/1MngtNpxLjDJz/giphy.gif', tags: ['shock', 'ช็อก'] },
    { id: 'm16', label: 'ยิ้ม', url: 'https://media.giphy.com/media/ICOgUjp0ZOprC/giphy.gif', tags: ['smile', 'ยิ้ม'] },
    { id: 'm17', label: 'หัวใจ', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif', tags: ['love', 'รัก'] },
    { id: 'm18', label: 'ฉลอง', url: 'https://media.giphy.com/media/11sBLlXs7Rj0a4/giphy.gif', tags: ['party', 'ฉลอง'] },
    { id: 'm19', label: 'กำลังใจ', url: 'https://media.giphy.com/media/l0MYC0LajboPehqs8/giphy.gif', tags: ['cheer', 'กำลังใจ'] },
    { id: 'm20', label: 'ไหว้', url: 'https://media.giphy.com/media/3o7aCTPPm4OHfRLSH6/giphy.gif', tags: ['pray', 'ไหว้'] },
    { id: 'm21', label: 'น่ารัก', url: 'https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif', tags: ['cute', 'น่ารัก'] },
    { id: 'm22', label: 'งง', url: 'https://media.giphy.com/media/3o6Zt4HU9qQqQqQqQq/giphy.gif', tags: ['confused', 'งง'] },
    { id: 'm23', label: 'เย้', url: 'https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif', tags: ['yay', 'เย้'] },
    { id: 'm24', label: 'โอ้โห', url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', tags: ['omg', 'โอ้โห'] },
];

const MEME_PREFIX = '[[MEME]]';

function isMemeMessage(msg) {
    if (!msg) return false;
    if (msg.message_type === 'meme') return true;
    return typeof msg.content === 'string' && msg.content.startsWith(MEME_PREFIX);
}

function getMemeUrl(msg) {
    if (!msg) return '';
    return isMemeMessage(msg) ? (msg.content || '').replace(MEME_PREFIX, '') : (msg.content || '');
}

function wrapMemeContent(url) {
    return MEME_PREFIX + url;
}

function searchBuiltinMemes(query) {
    const q = (query || '').trim().toLowerCase();
    if (!q) return BUILTIN_MEMES;
    return BUILTIN_MEMES.filter(m =>
        m.label.toLowerCase().includes(q) ||
        m.tags.some(t => t.includes(q))
    );
}

window.BlissiamMemes = {
    BUILTIN_MEMES,
    MEME_PREFIX,
    isMemeMessage,
    getMemeUrl,
    wrapMemeContent,
    searchBuiltinMemes,
};
