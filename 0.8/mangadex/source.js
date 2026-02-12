// MangaDex.js - Paperback Extension for MangaDex API
// Version: 1.0.0
// Author: oscar2504

const MANGADEX_API = 'https://api.mangadex.org';
const MANGADEX_COVERS_URL = 'https://uploads.mangadex.org/covers';

class MangaDex {
    constructor() {
        this.requestsPerSecond = 5;
        this.requestDelay = 1000 / this.requestsPerSecond;
        this.lastRequestTime = 0;
    }

    async rateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.requestDelay) {
            await new Promise(resolve => setTimeout(resolve, this.requestDelay - timeSinceLastRequest));
        }
        this.lastRequestTime = Date.now();
    }

    async request(url) {
        await this.rateLimit();
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }

    // Get manga details
    async getMangaDetails(mangaId) {
        const data = await this.request(`${MANGADEX_API}/manga/${mangaId}`);
        const manga = data.data;
        const attr = manga.attributes;
        const rels = manga.relationships;

        let coverFileName = '';
        for (const rel of rels) {
            if (rel.type === 'cover_art') {
                coverFileName = rel.attributes?.fileName || '';
                break;
            }
        }

        const image = coverFileName 
            ? `${MANGADEX_COVERS_URL}/${mangaId}/${coverFileName}.512.jpg`
            : '';

        return {
            id: mangaId,
            titles: [attr.title.en || Object.values(attr.title)[0]],
            image,
            status: this.parseStatus(attr.status),
            author: this.getAuthor(rels),
            artist: this.getArtist(rels),
            desc: attr.description?.en || ''
        };
    }

    // Get chapters for a manga
    async getChapters(mangaId) {
        const chapters = [];
        let offset = 0;
        const limit = 100;

        while (true) {
            const url = `${MANGADEX_API}/manga/${mangaId}/feed?limit=${limit}&offset=${offset}&translatedLanguage[]=en&order[chapter]=desc&includes[]=scanlation_group`;
            const data = await this.request(url);

            if (!data.data || data.data.length === 0) break;

            for (const chapter of data.data) {
                const attr = chapter.attributes;
                const chapterNum = parseFloat(attr.chapter) || 0;

                let group = 'Unknown';
                for (const rel of chapter.relationships) {
                    if (rel.type === 'scanlation_group') {
                        group = rel.attributes?.name || 'Unknown';
                        break;
                    }
                }

                chapters.push({
                    id: chapter.id,
                    mangaId: mangaId,
                    chapNum: chapterNum,
                    name: attr.title || `Chapter ${chapterNum}`,
                    langCode: 'en',
                    time: new Date(attr.publishAt),
                    group: group
                });
            }

            offset += limit;
            if (data.data.length < limit) break;
        }

        return chapters;
    }

    // Get chapter pages
    async getChapterDetails(mangaId, chapterId) {
        const data = await this.request(`${MANGADEX_API}/at-home/server/${chapterId}`);
        
        const baseUrl = data.baseUrl;
        const hash = data.chapter.hash;
        const pages = data.chapter.data;

        const pageUrls = pages.map(page => `${baseUrl}/data/${hash}/${page}`);

        return {
            id: chapterId,
            mangaId: mangaId,
            pages: pageUrls
        };
    }

    // Search manga
    async searchManga(query, page = 0) {
        const limit = 20;
        const offset = page * limit;
        const url = `${MANGADEX_API}/manga?limit=${limit}&offset=${offset}&title=${encodeURIComponent(query)}&includes[]=cover_art&availableTranslatedLanguage[]=en`;
        
        const data = await this.request(url);
        const results = data.data.map(manga => this.parseMangaTile(manga));

        return {
            results,
            hasMore: data.data.length === limit
        };
    }

    // Get popular manga
    async getPopularManga(page = 0) {
        const limit = 20;
        const offset = page * limit;
        const url = `${MANGADEX_API}/manga?limit=${limit}&offset=${offset}&includes[]=cover_art&order[followedCount]=desc&hasAvailableChapters=true&availableTranslatedLanguage[]=en`;
        
        const data = await this.request(url);
        return data.data.map(manga => this.parseMangaTile(manga));
    }

    // Get latest updates
    async getLatestUpdates(page = 0) {
        const limit = 20;
        const offset = page * limit;
        const url = `${MANGADEX_API}/manga?limit=${limit}&offset=${offset}&includes[]=cover_art&order[latestUploadedChapter]=desc&hasAvailableChapters=true&availableTranslatedLanguage[]=en`;
        
        const data = await this.request(url);
        return data.data.map(manga => this.parseMangaTile(manga));
    }

    // Helper: Parse manga tile
    parseMangaTile(data) {
        const attr = data.attributes;
        const rels = data.relationships;

        let coverFileName = '';
        for (const rel of rels) {
            if (rel.type === 'cover_art') {
                coverFileName = rel.attributes?.fileName || '';
                break;
            }
        }

        const image = coverFileName 
            ? `${MANGADEX_COVERS_URL}/${data.id}/${coverFileName}.256.jpg`
            : '';

        return {
            id: data.id,
            titles: [attr.title.en || Object.values(attr.title)[0]],
            image,
            status: this.parseStatus(attr.status),
            author: this.getAuthor(rels),
            artist: this.getArtist(rels)
        };
    }

    // Helper: Parse status
    parseStatus(status) {
        const statusMap = {
            'ongoing': 1,
            'completed': 0,
            'hiatus': 2,
            'cancelled': 3
        };
        return statusMap[status] || 0;
    }

    // Helper: Get author
    getAuthor(relationships) {
        for (const rel of relationships) {
            if (rel.type === 'author') {
                return rel.attributes?.name || 'Unknown';
            }
        }
        return 'Unknown';
    }

    // Helper: Get artist
    getArtist(relationships) {
        for (const rel of relationships) {
            if (rel.type === 'artist') {
                return rel.attributes?.name || 'Unknown';
            }
        }
        return 'Unknown';
    }
}

// Export for Paperback
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MangaDex;
}
