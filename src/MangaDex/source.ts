import {
    Source,
    Manga,
    Chapter,
    ChapterDetails,
    HomeSection,
    SearchRequest,
    PagedResults,
    SourceInfo,
    ContentRating,
    RequestManager,
    Response,
    TagSection
} from 'paperback-extensions-common'

const MANGADEX_API = 'https://api.mangadex.org'
const MANGADEX_COVERS_URL = 'https://uploads.mangadex.org/covers'

export const MangaDexInfo: SourceInfo = {
    version: '1.0.0',
    name: 'MangaDex',
    icon: 'icon.png',
    author: 'Julian',
    authorWebsite: 'https://github.com/yourusername',
    description: 'Extension for reading manga from MangaDex using their official API',
    contentRating: ContentRating.EVERYONE,
    websiteBaseURL: 'https://mangadex.org',
    sourceTags: [
        {
            text: 'English',
            type: TagSection.TagSectionType.INFO
        },
        {
            text: 'Official API',
            type: TagSection.TagSectionType.INFO
        }
    ]
}

export class MangaDex extends Source {
    requestManager: RequestManager = createRequestManager({
        requestsPerSecond: 5,
        requestTimeout: 20000
    })

    override getMangaShareUrl(mangaId: string): string {
        return `https://mangadex.org/title/${mangaId}`
    }

    async getMangaDetails(mangaId: string): Promise<Manga> {
        const request = createRequestObject({
            url: `${MANGADEX_API}/manga/${mangaId}`,
            method: 'GET'
        })

        const response = await this.requestManager.schedule(request, 1)
        const json = JSON.parse(response.data)
        const data = json.data

        const attributes = data.attributes
        const relationships = data.relationships

        // Get cover art
        let coverFileName = ''
        for (const rel of relationships) {
            if (rel.type === 'cover_art') {
                coverFileName = rel.attributes?.fileName || ''
                break
            }
        }

        const image = coverFileName 
            ? `${MANGADEX_COVERS_URL}/${mangaId}/${coverFileName}.512.jpg`
            : ''

        return createManga({
            id: mangaId,
            titles: [attributes.title.en || Object.values(attributes.title)[0]],
            image,
            status: this.parseStatus(attributes.status),
            author: this.getAuthor(relationships),
            artist: this.getArtist(relationships),
            desc: attributes.description?.en || '',
            tags: this.parseTags(attributes.tags)
        })
    }

    async getChapters(mangaId: string): Promise<Chapter[]> {
        const chapters: Chapter[] = []
        let offset = 0
        const limit = 100

        while (true) {
            const request = createRequestObject({
                url: `${MANGADEX_API}/manga/${mangaId}/feed`,
                method: 'GET',
                param: `?limit=${limit}&offset=${offset}&translatedLanguage[]=en&order[chapter]=desc&includes[]=scanlation_group`
            })

            const response = await this.requestManager.schedule(request, 1)
            const json = JSON.parse(response.data)

            if (!json.data || json.data.length === 0) break

            for (const chapter of json.data) {
                const attr = chapter.attributes
                const chapterNum = parseFloat(attr.chapter) || 0

                // Get scanlation group name
                let group = 'Unknown'
                for (const rel of chapter.relationships) {
                    if (rel.type === 'scanlation_group') {
                        group = rel.attributes?.name || 'Unknown'
                        break
                    }
                }

                chapters.push(createChapter({
                    id: chapter.id,
                    mangaId: mangaId,
                    chapNum: chapterNum,
                    name: attr.title || `Chapter ${chapterNum}`,
                    langCode: 'en',
                    time: new Date(attr.publishAt),
                    group: group
                }))
            }

            offset += limit
            if (json.data.length < limit) break
        }

        return chapters
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const request = createRequestObject({
            url: `${MANGADEX_API}/at-home/server/${chapterId}`,
            method: 'GET'
        })

        const response = await this.requestManager.schedule(request, 1)
        const json = JSON.parse(response.data)

        const baseUrl = json.baseUrl
        const hash = json.chapter.hash
        const pages = json.chapter.data // Original quality

        const pageUrls = pages.map((page: string) => 
            `${baseUrl}/data/${hash}/${page}`
        )

        return createChapterDetails({
            id: chapterId,
            mangaId: mangaId,
            pages: pageUrls
        })
    }

    async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
        // Popular Manga Section
        const popularSection = createHomeSection({
            id: 'popular',
            title: 'Popular Manga',
            view_more: true
        })

        const popularRequest = createRequestObject({
            url: `${MANGADEX_API}/manga`,
            method: 'GET',
            param: '?limit=20&includes[]=cover_art&order[followedCount]=desc&hasAvailableChapters=true&availableTranslatedLanguage[]=en'
        })

        const popularResponse = await this.requestManager.schedule(popularRequest, 1)
        const popularJson = JSON.parse(popularResponse.data)

        popularSection.items = popularJson.data.map((manga: any) => this.parseMangaTile(manga))
        sectionCallback(popularSection)

        // Latest Updates Section
        const latestSection = createHomeSection({
            id: 'latest',
            title: 'Latest Updates',
            view_more: true
        })

        const latestRequest = createRequestObject({
            url: `${MANGADEX_API}/manga`,
            method: 'GET',
            param: '?limit=20&includes[]=cover_art&order[latestUploadedChapter]=desc&hasAvailableChapters=true&availableTranslatedLanguage[]=en'
        })

        const latestResponse = await this.requestManager.schedule(latestRequest, 1)
        const latestJson = JSON.parse(latestResponse.data)

        latestSection.items = latestJson.data.map((manga: any) => this.parseMangaTile(manga))
        sectionCallback(latestSection)
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        const page = metadata?.page ?? 0
        const limit = 20
        const offset = page * limit

        let orderParam = ''
        if (homepageSectionId === 'popular') {
            orderParam = 'order[followedCount]=desc'
        } else if (homepageSectionId === 'latest') {
            orderParam = 'order[latestUploadedChapter]=desc'
        }

        const request = createRequestObject({
            url: `${MANGADEX_API}/manga`,
            method: 'GET',
            param: `?limit=${limit}&offset=${offset}&includes[]=cover_art&${orderParam}&hasAvailableChapters=true&availableTranslatedLanguage[]=en`
        })

        const response = await this.requestManager.schedule(request, 1)
        const json = JSON.parse(response.data)

        const manga = json.data.map((m: any) => this.parseMangaTile(m))

        return createPagedResults({
            results: manga,
            metadata: { page: page + 1 }
        })
    }

    async getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
        const page = metadata?.page ?? 0
        const limit = 20
        const offset = page * limit

        let param = `?limit=${limit}&offset=${offset}&includes[]=cover_art&availableTranslatedLanguage[]=en`

        if (query.title) {
            param += `&title=${encodeURIComponent(query.title)}`
        }

        const request = createRequestObject({
            url: `${MANGADEX_API}/manga`,
            method: 'GET',
            param: param
        })

        const response = await this.requestManager.schedule(request, 1)
        const json = JSON.parse(response.data)

        const manga = json.data.map((m: any) => this.parseMangaTile(m))

        return createPagedResults({
            results: manga,
            metadata: { page: page + 1 }
        })
    }

    // Helper Methods
    parseMangaTile(data: any): Manga {
        const attributes = data.attributes
        const relationships = data.relationships

        let coverFileName = ''
        for (const rel of relationships) {
            if (rel.type === 'cover_art') {
                coverFileName = rel.attributes?.fileName || ''
                break
            }
        }

        const image = coverFileName 
            ? `${MANGADEX_COVERS_URL}/${data.id}/${coverFileName}.256.jpg`
            : ''

        return createManga({
            id: data.id,
            titles: [attributes.title.en || Object.values(attributes.title)[0]],
            image,
            status: this.parseStatus(attributes.status),
            author: this.getAuthor(relationships),
            artist: this.getArtist(relationships)
        })
    }

    parseStatus(status: string): number {
        switch (status) {
            case 'ongoing': return 1
            case 'completed': return 0
            case 'hiatus': return 2
            case 'cancelled': return 3
            default: return 0
        }
    }

    getAuthor(relationships: any[]): string {
        for (const rel of relationships) {
            if (rel.type === 'author') {
                return rel.attributes?.name || 'Unknown'
            }
        }
        return 'Unknown'
    }

    getArtist(relationships: any[]): string {
        for (const rel of relationships) {
            if (rel.type === 'artist') {
                return rel.attributes?.name || 'Unknown'
            }
        }
        return 'Unknown'
    }

    parseTags(tags: any[]): any[] {
        return tags.map(tag => createTag({
            id: tag.id,
            label: tag.attributes.name.en
        }))
    }
}
