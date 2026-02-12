"use strict";
var _Sources = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // MangaDex source exports
  var MangaDex_exports = {};
  __export(MangaDex_exports, {
    MangaDex: () => MangaDex,
    MangaDexInfo: () => MangaDexInfo
  });

  // Constants
  var MANGADEX_API = "https://api.mangadex.org";
  var MANGADEX_COVERS = "https://uploads.mangadex.org/covers";
  
  // Content Rating enum
  var ContentRating = {
    EVERYONE: "EVERYONE",
    MATURE: "MATURE",
    ADULT: "ADULT"
  };
  
  // Source Intents
  var SourceIntents = {
    MANGA_CHAPTERS: 1,
    MANGA_TRACKING: 2,
    HOMEPAGE_SECTIONS: 4,
    COLLECTION_MANAGEMENT: 8,
    CLOUDFLARE_BYPASS_REQUIRED: 16,
    SETTINGS_UI: 32
  };

  // MangaDex Source Info
  var MangaDexInfo = {
    version: "1.0.0",
    name: "MangaDex",
    icon: "icon.png",
    author: "Julian",
    authorWebsite: "https://github.com/oscar2504",
    description: "Extension for reading manga from MangaDex using their official API",
    contentRating: ContentRating.EVERYONE,
    websiteBaseURL: "https://mangadex.org",
    sourceTags: [],
    intents: SourceIntents.MANGA_CHAPTERS | SourceIntents.HOMEPAGE_SECTIONS
  };

  // Helper function to get cover URL
  var getCoverUrl = (mangaId, fileName) => {
    if (!fileName) return "";
    return `${MANGADEX_COVERS}/${mangaId}/${fileName}.512.jpg`;
  };

  // Helper function to parse manga status
  var parseStatus = (status) => {
    switch (status) {
      case "ongoing":
        return "Ongoing";
      case "completed":
        return "Completed";
      case "hiatus":
        return "Hiatus";
      case "cancelled":
        return "Cancelled";
      default:
        return "Unknown";
    }
  };

  // Helper function to get author from relationships
  var getAuthor = (relationships) => {
    for (const rel of relationships) {
      if (rel.type === "author") {
        return rel.attributes?.name || "Unknown";
      }
    }
    return "Unknown";
  };

  // Helper function to get artist from relationships
  var getArtist = (relationships) => {
    for (const rel of relationships) {
      if (rel.type === "artist") {
        return rel.attributes?.name || "Unknown";
      }
    }
    return "Unknown";
  };

  // Helper function to get cover filename from relationships
  var getCoverFileName = (relationships) => {
    for (const rel of relationships) {
      if (rel.type === "cover_art") {
        return rel.attributes?.fileName || "";
      }
    }
    return "";
  };

  // Parse manga details from API response
  var parseMangaDetails = (json, mangaId) => {
    const data = json.data;
    const attributes = data.attributes;
    const relationships = data.relationships || [];

    const coverFileName = getCoverFileName(relationships);
    const image = getCoverUrl(mangaId, coverFileName);

    // Get title in English or first available
    const title = attributes.title?.en || Object.values(attributes.title || {})[0] || "Unknown Title";

    // Get description
    const desc = attributes.description?.en || Object.values(attributes.description || {})[0] || "";

    // Get tags
    const tags = [];
    if (attributes.tags) {
      for (const tag of attributes.tags) {
        const tagName = tag.attributes?.name?.en || "";
        if (tagName) {
          tags.push(App.createTag({ id: tag.id, label: tagName }));
        }
      }
    }

    return App.createSourceManga({
      id: mangaId,
      mangaInfo: App.createMangaInfo({
        titles: [title],
        image: image,
        status: parseStatus(attributes.status),
        author: getAuthor(relationships),
        artist: getArtist(relationships),
        tags: [App.createTagSection({ id: "0", label: "Genres", tags: tags })],
        desc: desc
      })
    });
  };

  // Parse chapters from API response
  var parseChapters = (json, mangaId) => {
    const chapters = [];
    
    if (!json.data || !Array.isArray(json.data)) {
      return chapters;
    }

    for (const chapter of json.data) {
      const attributes = chapter.attributes;
      const chapterNum = parseFloat(attributes.chapter) || 0;

      // Get scanlation group
      let group = "Unknown";
      if (chapter.relationships) {
        for (const rel of chapter.relationships) {
          if (rel.type === "scanlation_group") {
            group = rel.attributes?.name || "Unknown";
            break;
          }
        }
      }

      const chapterTitle = attributes.title || `Chapter ${chapterNum}`;
      const time = new Date(attributes.publishAt);

      chapters.push(App.createChapter({
        id: chapter.id,
        mangaId: mangaId,
        chapNum: chapterNum,
        name: chapterTitle,
        langCode: "🇬🇧",
        time: time,
        group: group
      }));
    }

    return chapters;
  };

  // Parse chapter details (pages) from API response
  var parseChapterDetails = (json, mangaId, chapterId) => {
    const baseUrl = json.baseUrl;
    const hash = json.chapter.hash;
    const data = json.chapter.data;

    const pages = [];
    for (let i = 0; i < data.length; i++) {
      const pageUrl = `${baseUrl}/data/${hash}/${data[i]}`;
      pages.push(pageUrl);
    }

    return App.createChapterDetails({
      id: chapterId,
      mangaId: mangaId,
      pages: pages
    });
  };

  // Parse search results
  var parseSearchResults = (json) => {
    const results = [];
    
    if (!json.data || !Array.isArray(json.data)) {
      return results;
    }

    for (const manga of json.data) {
      const attributes = manga.attributes;
      const relationships = manga.relationships || [];

      const title = attributes.title?.en || Object.values(attributes.title || {})[0] || "Unknown";
      const coverFileName = getCoverFileName(relationships);
      const image = getCoverUrl(manga.id, coverFileName);

      results.push(App.createPartialSourceManga({
        mangaId: manga.id,
        image: image,
        title: title,
        subtitle: undefined
      }));
    }

    return results;
  };

  // Parse home sections
  var parseHomeSection = (json, sectionId) => {
    const tiles = [];
    
    if (!json.data || !Array.isArray(json.data)) {
      return tiles;
    }

    for (const manga of json.data) {
      const attributes = manga.attributes;
      const relationships = manga.relationships || [];

      const title = attributes.title?.en || Object.values(attributes.title || {})[0] || "Unknown";
      const coverFileName = getCoverFileName(relationships);
      const image = getCoverUrl(manga.id, coverFileName);

      tiles.push(App.createPartialSourceManga({
        mangaId: manga.id,
        image: image,
        title: title,
        subtitle: undefined
      }));
    }

    return tiles;
  };

  // Main MangaDex class
  var MangaDex = class {
    constructor() {
      this.requestManager = App.createRequestManager({
        requestsPerSecond: 5,
        requestTimeout: 20000,
        interceptor: {
          interceptRequest: async (request) => {
            request.headers = {
              ...request.headers ?? {},
              ...{
                "user-agent": await this.requestManager.getDefaultUserAgent(),
                "referer": "https://mangadex.org/"
              }
            };
            return request;
          },
          interceptResponse: async (response) => {
            return response;
          }
        }
      });
    }

    getMangaShareUrl(mangaId) {
      return `https://mangadex.org/title/${mangaId}`;
    }

    async getMangaDetails(mangaId) {
      const request = App.createRequest({
        url: `${MANGADEX_API}/manga/${mangaId}?includes[]=cover_art&includes[]=author&includes[]=artist`,
        method: "GET"
      });

      const response = await this.requestManager.schedule(request, 1);
      const json = JSON.parse(response.data);
      return parseMangaDetails(json, mangaId);
    }

    async getChapters(mangaId) {
      const allChapters = [];
      let offset = 0;
      const limit = 100;

      // Fetch all chapters with pagination
      while (true) {
        const request = App.createRequest({
          url: `${MANGADEX_API}/manga/${mangaId}/feed?limit=${limit}&offset=${offset}&translatedLanguage[]=en&order[chapter]=desc&includes[]=scanlation_group`,
          method: "GET"
        });

        const response = await this.requestManager.schedule(request, 1);
        const json = JSON.parse(response.data);
        
        const chapters = parseChapters(json, mangaId);
        allChapters.push(...chapters);

        // Check if we've fetched all chapters
        if (!json.data || json.data.length < limit) {
          break;
        }

        offset += limit;
      }

      return allChapters;
    }

    async getChapterDetails(mangaId, chapterId) {
      const request = App.createRequest({
        url: `${MANGADEX_API}/at-home/server/${chapterId}`,
        method: "GET"
      });

      const response = await this.requestManager.schedule(request, 1);
      const json = JSON.parse(response.data);
      return parseChapterDetails(json, mangaId, chapterId);
    }

    async getHomePageSections(sectionCallback) {
      // Popular manga section
      const popularRequest = App.createRequest({
        url: `${MANGADEX_API}/manga?limit=20&includes[]=cover_art&order[followedCount]=desc&contentRating[]=safe&contentRating[]=suggestive&hasAvailableChapters=true`,
        method: "GET"
      });

      const popularResponse = await this.requestManager.schedule(popularRequest, 1);
      const popularJson = JSON.parse(popularResponse.data);
      const popularTiles = parseHomeSection(popularJson, "popular");

      sectionCallback(App.createHomeSection({
        id: "popular",
        title: "Popular Manga",
        items: popularTiles,
        type: "singleRowNormal"
      }));

      // Recently updated section
      const recentRequest = App.createRequest({
        url: `${MANGADEX_API}/manga?limit=20&includes[]=cover_art&order[latestUploadedChapter]=desc&contentRating[]=safe&contentRating[]=suggestive&hasAvailableChapters=true`,
        method: "GET"
      });

      const recentResponse = await this.requestManager.schedule(recentRequest, 1);
      const recentJson = JSON.parse(recentResponse.data);
      const recentTiles = parseHomeSection(recentJson, "recent");

      sectionCallback(App.createHomeSection({
        id: "recent",
        title: "Recently Updated",
        items: recentTiles,
        type: "singleRowNormal"
      }));
    }

    async getViewMoreItems(homepageSectionId, metadata) {
      const page = metadata?.page ?? 0;
      const limit = 20;
      const offset = page * limit;

      let url = "";
      if (homepageSectionId === "popular") {
        url = `${MANGADEX_API}/manga?limit=${limit}&offset=${offset}&includes[]=cover_art&order[followedCount]=desc&contentRating[]=safe&contentRating[]=suggestive&hasAvailableChapters=true`;
      } else if (homepageSectionId === "recent") {
        url = `${MANGADEX_API}/manga?limit=${limit}&offset=${offset}&includes[]=cover_art&order[latestUploadedChapter]=desc&contentRating[]=safe&contentRating[]=suggestive&hasAvailableChapters=true`;
      } else {
        throw new Error(`Invalid homepageSectionId: ${homepageSectionId}`);
      }

      const request = App.createRequest({
        url: url,
        method: "GET"
      });

      const response = await this.requestManager.schedule(request, 1);
      const json = JSON.parse(response.data);
      const tiles = parseHomeSection(json, homepageSectionId);

      // Check if there are more results
      const hasMore = json.data && json.data.length === limit;
      
      return App.createPagedResults({
        results: tiles,
        metadata: hasMore ? { page: page + 1 } : undefined
      });
    }

    async getSearchResults(query, metadata) {
      const page = metadata?.page ?? 0;
      const limit = 20;
      const offset = page * limit;

      const searchTitle = query?.title || "";
      const encodedTitle = encodeURIComponent(searchTitle);

      const request = App.createRequest({
        url: `${MANGADEX_API}/manga?limit=${limit}&offset=${offset}&title=${encodedTitle}&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive&hasAvailableChapters=true`,
        method: "GET"
      });

      const response = await this.requestManager.schedule(request, 1);
      const json = JSON.parse(response.data);
      const results = parseSearchResults(json);

      // Check if there are more results
      const hasMore = json.data && json.data.length === limit;

      return App.createPagedResults({
        results: results,
        metadata: hasMore ? { page: page + 1 } : undefined
      });
    }

    async getSearchTags() {
      const request = App.createRequest({
        url: `${MANGADEX_API}/manga/tag`,
        method: "GET"
      });

      const response = await this.requestManager.schedule(request, 1);
      const json = JSON.parse(response.data);

      const tags = [];
      if (json.data && Array.isArray(json.data)) {
        for (const tag of json.data) {
          const tagName = tag.attributes?.name?.en || "";
          if (tagName) {
            tags.push(App.createTag({ id: tag.id, label: tagName }));
          }
        }
      }

      return [App.createTagSection({ id: "0", label: "Genres", tags: tags })];
    }
  };

  return __toCommonJS(MangaDex_exports);
})();

this.Sources = _Sources;
if (typeof exports === 'object' && typeof module !== 'undefined') {
  module.exports.Sources = this.Sources;
}
