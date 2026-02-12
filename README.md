# MangaDex Paperback Extension

A Paperback extension for reading manga from MangaDex using their official API v5.

## Installation in Paperback

### Add This Repository to Paperback

1. Open **Paperback** app on your iOS device
2. Go to **Settings** → **External Sources**
3. Tap the **+** button (top right)
4. Enter this URL:
   ```
   https://oscar2504.github.io/magadex-paperback
   ```
5. Tap **Add**
6. Find **MangaDex** in the sources list and tap **Install**


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

## Troubleshooting

### Extension Won't Load

**Check these:**
- Is the repository **Public**?
- Is **GitHub Pages** enabled in repository settings?
- Did you use the correct URL (`oscar2504.github.io`, not `.com`)?
- Wait 2-3 minutes after first deployment for GitHub Pages to activate

### No Results in Search

- MangaDex API works best with exact or partial title matches
- Try searching with keywords or partial titles
- Check that your internet connection is stable

### Chapters Won't Load
- MangaDex API may be experiencing issues (check https://api.mangadex.org/docs/)
- Try refreshing the chapter list
- Some manga may not have English translations available

Your extension will be available at:
```
https://oscar2504.github.io/magadex-paperback
```

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
