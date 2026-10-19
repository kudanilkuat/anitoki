/**
 * lib/doodstream.js
 * DoodStream / Playmogo API Integration
 * Docs: https://doodstream.com/api-docs
 */

const API_BASE = 'https://doodapi.co/api';

/**
 * Mendapatkan API Key dari environment variable
 */
function getApiKey() {
    return process.env.DOODSTREAM_API_KEY || '';
}

/**
 * Ekstrak file_code dari URL Playmogo / DoodStream
 * Contoh:
 * - https://playmogo.com/e/z1gf2hc9oa0f -> z1gf2hc9oa0f
 * - https://dood.li/e/swd7ofkpa8um -> swd7ofkpa8um
 * - https://doodstream.com/d/swd7ofkpa8um -> swd7ofkpa8um
 */
function extractFileCode(url = '') {
    if (!url) return null;
    const match = url.match(/(?:playmogo\.com|dood(?:stream)?\.[a-z0-9]+)\/(?:e|d)\/([a-zA-Z0-9]+)/i);
    return match ? match[1] : null;
}

/**
 * Mencari folder ID berdasarkan nama, atau membuat folder baru jika belum ada
 * @param {string} folderName Default: 'Hentai Nekopoi'
 */
async function getOrCreateFolder(folderName = 'Hentai Nekopoi') {
    const key = getApiKey();
    if (!key) throw new Error('DOODSTREAM_API_KEY is not defined');

    // Cek apakah sudah didefinisikan di ENV
    if (process.env.DOODSTREAM_FOLDER_NAME === folderName && process.env.DOODSTREAM_FOLDER_ID) {
        return process.env.DOODSTREAM_FOLDER_ID;
    }

    try {
        const listRes = await fetch(`${API_BASE}/folder/list?key=${key}&fld_id=0`);
        const listJson = await listRes.json();
        const folders = listJson.result?.folders || [];
        const found = folders.find(f => f.name.toLowerCase() === folderName.toLowerCase());

        if (found) {
            return String(found.fld_id);
        }

        // Buat folder baru jika belum ada
        const createRes = await fetch(`${API_BASE}/folder/create?key=${key}&name=${encodeURIComponent(folderName)}`);
        const createJson = await createRes.json();
        if (createJson.status === 200 && createJson.result?.fld_id) {
            return String(createJson.result.fld_id);
        }

        throw new Error(createJson.msg || 'Gagal membuat folder di DoodStream');
    } catch (err) {
        console.error('[DoodStream] getOrCreateFolder Error:', err.message);
        return process.env.DOODSTREAM_FOLDER_ID || null;
    }
}

/**
 * Melakukan Clone / Copy file dari file_code Playmogo/Doodstream ke akun user
 * @param {string} fileCode 
 * @param {string} fldId 
 */
async function cloneDoodFile(fileCode, fldId = null) {
    const key = getApiKey();
    if (!key) throw new Error('DOODSTREAM_API_KEY is not defined');

    const folderParam = fldId ? `&fld_id=${fldId}` : '';
    const endpoint = `${API_BASE}/file/clone?key=${key}&file_code=${fileCode}${folderParam}`;

    const res = await fetch(endpoint);
    const json = await res.json();

    if (json.status !== 200 || !json.result) {
        throw new Error(json.msg || `Gagal clone file ${fileCode}`);
    }

    return {
        fileCode: json.result.filecode,
        embedUrl: json.result.embed_url || `https://playmogo.com/e/${json.result.filecode}`,
        downloadUrl: json.result.download_url || `https://playmogo.com/d/${json.result.filecode}`,
        protectedEmbed: json.result.protected_embed,
        protectedDownload: json.result.protected_download,
        raw: json.result,
    };
}

/**
 * Melakukan Remote Upload link video direct ke Doodstream
 * @param {string} uploadUrl URL direct link video
 * @param {string} title Judul video
 * @param {string} fldId ID Folder tujuan
 */
async function remoteUploadUrl(uploadUrl, title = '', fldId = null) {
    const key = getApiKey();
    if (!key) throw new Error('DOODSTREAM_API_KEY is not defined');

    const folderParam = fldId ? `&fld_id=${fldId}` : '';
    const titleParam = title ? `&new_title=${encodeURIComponent(title)}` : '';
    const endpoint = `${API_BASE}/upload/url?key=${key}&url=${encodeURIComponent(uploadUrl)}${folderParam}${titleParam}`;

    const res = await fetch(endpoint);
    const json = await res.json();

    if (json.status !== 200 || !json.result) {
        throw new Error(json.msg || `Gagal remote upload ${uploadUrl}`);
    }

    return {
        fileCode: json.result.filecode,
        embedUrl: `https://playmogo.com/e/${json.result.filecode}`,
        downloadUrl: `https://playmogo.com/d/${json.result.filecode}`,
        raw: json.result,
    };
}

/**
 * Helper all-in-one: Otomatis mendeteksi apakah stream link bisa di-clone langsung
 * atau perlu remote upload, lalu menyimpannya ke folder tujuan
 */
async function cloneOrRemoteStreamLink(streamUrl, title = '', folderName = 'Hentai Nekopoi') {
    const fldId = await getOrCreateFolder(folderName);
    const code = extractFileCode(streamUrl);

    if (code) {
        // Clone langsung via file_code (instan < 1 detik)
        const result = await cloneDoodFile(code, fldId);
        return {
            method: 'clone',
            originalUrl: streamUrl,
            fileCode: result.fileCode,
            embedUrl: result.embedUrl,
            downloadUrl: result.downloadUrl,
            folderId: fldId,
        };
    }

    // Jika bukan link dood/playmogo, lakukan remote upload direct link
    const result = await remoteUploadUrl(streamUrl, title, fldId);
    return {
        method: 'remote_upload',
        originalUrl: streamUrl,
        fileCode: result.fileCode,
        embedUrl: result.embedUrl,
        downloadUrl: result.downloadUrl,
        folderId: fldId,
    };
}

module.exports = {
    getApiKey,
    extractFileCode,
    getOrCreateFolder,
    cloneDoodFile,
    remoteUploadUrl,
    cloneOrRemoteStreamLink,
};
