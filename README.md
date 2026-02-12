# MangaDex Paperback Extension

A Paperback extension for reading manga from MangaDex using their official API v5.

## Installation in Paperback

### Add This Repository to Paperback

1. Open **Paperback** app on your iOS device
2. Go to **Settings** → **External Sources**
3. Tap the **+** button (top right)
4. Enter this URL:
   ```
   https://oscar2504.github.io/magadex-paperback/0.8
   ```
5. Tap **Add**
6. Find **MangaDex** in the sources list and tap **Install**

### Start Reading!

1. Go to the **Browse** tab
2. Select **MangaDex** from the source dropdown
3. Search for your favorite manga
4. Start reading!

## MangaDex API

This extension uses the official MangaDex API v5:

- **Base URL**: `https://api.mangadex.org`
- **Manga Search**: `/manga` endpoint
- **Chapter List**: `/manga/{id}/feed` endpoint
- **Chapter Pages**: `/at-home/server/{id}` endpoint
- **Images**: MangaDex CDN with original quality

## Technical Details

- **Language**: TypeScript
- **Rate Limit**: 5 requests per second
- **Content Rating**: Everyone
- **Supported Languages**: English

## Support

For issues or questions:
- Check the [MangaDex API status](https://api.mangadex.org/docs/)
- Verify Paperback app is up to date
- Check GitHub repository settings

## License

MIT License - Free to use and modify

## Credits

- **MangaDex** - For their excellent API and platform
- **Paperback** - For the amazing iOS manga reader
- **Developer**: oscar2504

---

**Enjoy reading manga! 📖**
