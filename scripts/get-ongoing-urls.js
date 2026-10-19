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

async function getOngoingUrls() {
    let currentPage = 1;
    let hasNext = true;
    const animeUrls = new Set();

    while (hasNext) {
        const pageUrl = currentPage === 1
            ? 'https://otakudesu.blog/ongoing-anime/'
            : `https://otakudesu.blog/ongoing-anime/page/${currentPage}/`;

        console.log(`Fetching page ${currentPage}: ${pageUrl}...`);
        try {
            const html = await fetchHtml(pageUrl);
            const $ = cheerio.load(html);

            let pageItemsCount = 0;

            // In Otakudesu ongoing anime, items are typically inside .venz ul li or .rapi ul li or .venauto
            // Let's inspect all anime links under .venz / .venauto / .detpost / .thumb
            $('.venz ul li, .venauto ul li, .rapi ul li').each((_, el) => {
                const link = $(el).find('h2.jdlfl a, .thumb a, .detpost a').first().attr('href')
                    || $(el).find('a').first().attr('href');
                const title = $(el).find('h2.jdlfl, .jdlfl, h2').text().trim();

                if (link && link.includes('/anime/')) {
                    // Check if onepiece
                    const isOnePiece = /one[\s-]?piece/i.test(link) || /one[\s-]?piece/i.test(title);
                    if (isOnePiece) {
                        console.log(`  [SKIP One Piece] ${title || link}`);
                    } else {
                        animeUrls.add(link.trim());
                        pageItemsCount++;
                    }
                }
            });

            console.log(`  Found ${pageItemsCount} anime on page ${currentPage}`);

            // Check pagination
            const nextButton = $('.pagination .next, .pagenavx .next, a.next');
            if (nextButton.length > 0 && nextButton.attr('href')) {
                currentPage++;
            } else {
                // Also check page numbers in pagination
                const pageLinks = $('.pagination a, .pagenavx a').map((_, a) => $(a).attr('href')).get();
                const nextPageUrl = `https://otakudesu.blog/ongoing-anime/page/${currentPage + 1}/`;
                const hasNextPageLink = pageLinks.some(href => href && href.includes(`/page/${currentPage + 1}/`));
                if (hasNextPageLink) {
                    currentPage++;
                } else {
                    hasNext = false;
                }
            }

            // Safety limit
            if (currentPage > 1) break;
        } catch (err) {
            console.error(`Error on page ${currentPage}:`, err.message);
            hasNext = false;
        }
    }

    const urlList = Array.from(animeUrls);
    console.log(`\nTotal ongoing anime URLs collected (excluding One Piece): ${urlList.length}`);

    // Save to url.txt in workspace root
    const outPath = path.resolve(__dirname, '../url.txt');
    fs.writeFileSync(outPath, urlList.join('\n') + '\n', 'utf8');
    console.log(`Saved to ${outPath}`);
    return urlList;
}

getOngoingUrls().catch(console.error);
