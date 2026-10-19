const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

async function fetchHtml(url) {
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
}

async function getCompleteUrls() {
    let currentPage = 1;
    let hasNext = true;
    const animeUrls = new Set();
    const args = process.argv.slice(2);
    const maxPages = args.find(a => a.startsWith('--max-pages=')) 
        ? parseInt(args.find(a => a.startsWith('--max-pages=')).split('=')[1], 10) 
        : 200; // default can go up to 200 pages

    console.log(`Starting scraper for complete anime (maxPages: ${maxPages})...\n`);

    while (hasNext && currentPage <= maxPages) {
        const pageUrl = currentPage === 1 
            ? 'https://otakudesu.blog/complete-anime/' 
            : `https://otakudesu.blog/complete-anime/page/${currentPage}/`;

        console.log(`Fetching page ${currentPage}: ${pageUrl}...`);
        try {
            const html = await fetchHtml(pageUrl);
            const $ = cheerio.load(html);

            let pageItemsCount = 0;

            // In Otakudesu complete anime, items are in .venz ul li or .venauto ul li or .rapi ul li
            $('.venz ul li, .venauto ul li, .rapi ul li').each((_, el) => {
                const link = $(el).find('h2.jdlfl a, .thumb a, .detpost a').first().attr('href') 
                    || $(el).find('a').first().attr('href');
                const title = $(el).find('h2.jdlfl, .jdlfl, h2').text().trim();

                if (link && link.includes('/anime/')) {
                    // Skip One Piece
                    const isOnePiece = /one[\s-]?piece/i.test(link) || /one[\s-]?piece/i.test(title);
                    if (isOnePiece) {
                        console.log(`  [SKIP One Piece] ${title || link}`);
                    } else {
                        animeUrls.add(link.trim());
                        pageItemsCount++;
                    }
                }
            });

            console.log(`  Found ${pageItemsCount} anime on page ${currentPage} (Total unique so far: ${animeUrls.size})`);

            if (pageItemsCount === 0) {
                console.log('  No anime items found on this page, stopping.');
                hasNext = false;
                break;
            }

            // Check pagination
            const nextButton = $('.pagination .next, .pagenavx .next, a.next');
            if (nextButton.length > 0 && nextButton.attr('href')) {
                currentPage++;
            } else {
                const pageLinks = $('.pagination a, .pagenavx a').map((_, a) => $(a).attr('href')).get();
                const nextPageUrl = `/page/${currentPage + 1}/`;
                const hasNextPageLink = pageLinks.some(href => href && href.includes(nextPageUrl));
                if (hasNextPageLink) {
                    currentPage++;
                } else {
                    hasNext = false;
                }
            }

            // Delay between page requests
            await new Promise(r => setTimeout(r, 600));
        } catch (err) {
            console.error(`Error on page ${currentPage}:`, err.message);
            hasNext = false;
        }
    }

    const urlList = Array.from(animeUrls);
    console.log(`\nTotal complete anime URLs collected: ${urlList.length}`);
    
    // Save to url-complete.txt (and also can save/append to url.txt)
    const outPath = path.resolve(__dirname, '../url-complete.txt');
    fs.writeFileSync(outPath, urlList.join('\n') + '\n', 'utf8');
    console.log(`Saved to ${outPath}`);

    // If --write-url flag is provided, overwrite url.txt
    if (args.includes('--write-url')) {
        const mainUrlPath = path.resolve(__dirname, '../url.txt');
        fs.writeFileSync(mainUrlPath, urlList.join('\n') + '\n', 'utf8');
        console.log(`Also saved to ${mainUrlPath}`);
    }

    return urlList;
}

getCompleteUrls().catch(console.error);
