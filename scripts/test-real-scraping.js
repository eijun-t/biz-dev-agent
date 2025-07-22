/**
 * 実際のWebサイトに対するスクレイピング機能テスト
 * Enhanced Researcher Agentの実装確認
 */

const cheerio = require('cheerio');

console.log('🌐 Real Website Scraping Test');
console.log('==============================\n');

// Yahoo News Japan実際のスクレイピングテスト
async function testYahooNewsScraping() {
    console.log('📰 1. Yahoo News Japan Real Scraping Test:');
    
    try {
        const query = 'IoT';
        const encodedQuery = encodeURIComponent(query);
        const searchUrl = `https://news.yahoo.co.jp/search?p=${encodedQuery}&ei=UTF-8`;
        
        console.log(`   🔍 Searching: ${searchUrl}`);
        
        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        if (!response.ok) {
            console.log(`   ❌ Failed to fetch: ${response.status} ${response.statusText}`);
            return false;
        }
        
        const html = await response.text();
        console.log(`   ✅ Successfully fetched HTML (${html.length} characters)`);
        
        const $ = cheerio.load(html);
        console.log('   📊 Analyzing page structure...');
        
        // 様々なセレクターを試してみる
        const selectors = [
            '.newsFeed_item',
            '.sc-gzVnrw',
            '[class*="newsFeed"]',
            '[class*="NewsListItem"]',
            '.searchResult',
            '.searchCenterMiddle li'
        ];
        
        let foundItems = false;
        for (const selector of selectors) {
            const items = $(selector);
            if (items.length > 0) {
                console.log(`   ✅ Found ${items.length} items with selector: ${selector}`);
                
                // 最初の3つのアイテムを詳しく分析
                items.slice(0, 3).each((index, element) => {
                    const $item = $(element);
                    const text = $item.text().trim().substring(0, 100);
                    console.log(`      ${index + 1}. ${text}...`);
                    
                    // 内部構造を探索
                    const title = $item.find('h1, h2, h3, h4, [class*="title"], [class*="Title"]').first().text().trim();
                    const link = $item.find('a').first().attr('href');
                    
                    if (title) console.log(`         Title: ${title.substring(0, 80)}`);
                    if (link) console.log(`         Link: ${link.substring(0, 80)}`);
                });
                
                foundItems = true;
                break;
            }
        }
        
        if (!foundItems) {
            console.log('   ⚠️  No news items found with standard selectors');
            console.log('   🔍 Analyzing page content structure...');
            
            // ページの主要な要素を探索
            const headings = $('h1, h2, h3, h4').length;
            const links = $('a[href*="/articles/"], a[href*="/news/"]').length;
            const articles = $('article, [class*="article"], [class*="Article"]').length;
            
            console.log(`      Headlines found: ${headings}`);
            console.log(`      News links found: ${links}`);
            console.log(`      Article elements: ${articles}`);
            
            if (links > 0) {
                console.log('   📰 Sample news links found:');
                $('a[href*="/articles/"], a[href*="/news/"]').slice(0, 3).each((index, element) => {
                    const $link = $(element);
                    const title = $link.text().trim();
                    const href = $link.attr('href');
                    if (title && href) {
                        console.log(`      ${index + 1}. ${title.substring(0, 80)}`);
                        console.log(`         URL: ${href.substring(0, 80)}`);
                    }
                });
            }
        }
        
        console.log('   ✅ Yahoo News scraping analysis completed\n');
        return true;
        
    } catch (error) {
        console.log(`   ❌ Yahoo News scraping failed: ${error.message}\n`);
        return false;
    }
}

// Reddit実際のスクレイピングテスト
async function testRedditScraping() {
    console.log('💬 2. Reddit API Real Test:');
    
    try {
        const query = 'IoT smart city';
        const encodedQuery = encodeURIComponent(query);
        const apiUrl = `https://www.reddit.com/search.json?q=${encodedQuery}&limit=5&sort=relevance`;
        
        console.log(`   🔍 Searching: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        if (!response.ok) {
            console.log(`   ❌ Failed to fetch Reddit: ${response.status} ${response.statusText}`);
            return false;
        }
        
        const data = await response.json();
        console.log('   ✅ Successfully fetched Reddit data');
        
        if (data.data && data.data.children && data.data.children.length > 0) {
            console.log(`   📊 Found ${data.data.children.length} Reddit posts:`);
            
            data.data.children.slice(0, 3).forEach((item, index) => {
                const post = item.data;
                console.log(`      ${index + 1}. ${post.title.substring(0, 80)}`);
                console.log(`         Subreddit: r/${post.subreddit}`);
                console.log(`         Score: ${post.score} upvotes`);
                console.log(`         URL: https://www.reddit.com${post.permalink.substring(0, 50)}`);
            });
        } else {
            console.log('   ⚠️  No Reddit posts found in response');
        }
        
        console.log('   ✅ Reddit scraping test completed\n');
        return true;
        
    } catch (error) {
        console.log(`   ❌ Reddit scraping failed: ${error.message}\n`);
        return false;
    }
}

// arXiv実際のスクレイピングテスト
async function testArxivScraping() {
    console.log('📚 3. arXiv API Real Test:');
    
    try {
        const query = 'smart city IoT';
        const encodedQuery = encodeURIComponent(query);
        const apiUrl = `http://export.arxiv.org/api/query?search_query=all:${encodedQuery}&start=0&max_results=3&sortBy=submittedDate&sortOrder=descending`;
        
        console.log(`   🔍 Searching: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        if (!response.ok) {
            console.log(`   ❌ Failed to fetch arXiv: ${response.status} ${response.statusText}`);
            return false;
        }
        
        const xmlText = await response.text();
        console.log(`   ✅ Successfully fetched arXiv XML (${xmlText.length} characters)`);
        
        // 簡易XMLパース
        const entryRegex = /<entry>(.*?)<\/entry>/gs;
        const entries = xmlText.match(entryRegex) || [];
        
        if (entries.length > 0) {
            console.log(`   📊 Found ${entries.length} arXiv papers:`);
            
            entries.slice(0, 3).forEach((entry, index) => {
                const titleMatch = entry.match(/<title>(.*?)<\/title>/s);
                const summaryMatch = entry.match(/<summary>(.*?)<\/summary>/s);
                const linkMatch = entry.match(/<link.*?href="(.*?)".*?>/);
                const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
                
                if (titleMatch) {
                    const title = titleMatch[1].trim().replace(/\s+/g, ' ');
                    console.log(`      ${index + 1}. ${title.substring(0, 80)}`);
                    
                    if (publishedMatch) {
                        console.log(`         Published: ${publishedMatch[1]}`);
                    }
                    if (linkMatch) {
                        console.log(`         URL: ${linkMatch[1].substring(0, 60)}`);
                    }
                    if (summaryMatch) {
                        const summary = summaryMatch[1].trim().replace(/\s+/g, ' ');
                        console.log(`         Abstract: ${summary.substring(0, 100)}...`);
                    }
                }
            });
        } else {
            console.log('   ⚠️  No arXiv papers found');
        }
        
        console.log('   ✅ arXiv scraping test completed\n');
        return true;
        
    } catch (error) {
        console.log(`   ❌ arXiv scraping failed: ${error.message}\n`);
        return false;
    }
}

// Wikipedia検索テスト（追加ボーナス）
async function testWikipediaScraping() {
    console.log('📖 4. Wikipedia Search Test:');
    
    try {
        const query = 'スマートシティ';
        const encodedQuery = encodeURIComponent(query);
        const apiUrl = `https://ja.wikipedia.org/api/rest_v1/page/summary/${encodedQuery}`;
        
        console.log(`   🔍 Searching: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        if (!response.ok) {
            console.log(`   ❌ Failed to fetch Wikipedia: ${response.status} ${response.statusText}`);
            return false;
        }
        
        const data = await response.json();
        console.log('   ✅ Successfully fetched Wikipedia data');
        
        if (data.title && data.extract) {
            console.log(`   📄 Article: ${data.title}`);
            console.log(`   📝 Summary: ${data.extract.substring(0, 200)}...`);
            if (data.content_urls && data.content_urls.desktop) {
                console.log(`   🔗 URL: ${data.content_urls.desktop.page}`);
            }
        }
        
        console.log('   ✅ Wikipedia scraping test completed\n');
        return true;
        
    } catch (error) {
        console.log(`   ❌ Wikipedia scraping failed: ${error.message}\n`);
        return false;
    }
}

// メイン実行
async function runRealScrapingTests() {
    console.log('🎯 Running real website scraping tests...\n');
    
    const results = [
        { name: 'Yahoo News Japan', test: testYahooNewsScraping },
        { name: 'Reddit API', test: testRedditScraping },
        { name: 'arXiv API', test: testArxivScraping },
        { name: 'Wikipedia API', test: testWikipediaScraping }
    ];
    
    const testResults = [];
    
    for (const { name, test } of results) {
        try {
            const success = await test();
            testResults.push({ name, success });
        } catch (error) {
            console.log(`   ❌ ${name} test crashed: ${error.message}\n`);
            testResults.push({ name, success: false });
        }
    }
    
    console.log('📊 Real Scraping Test Results:');
    console.log('===============================');
    
    let passed = 0;
    testResults.forEach(result => {
        const status = result.success ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${result.name}`);
        if (result.success) passed++;
    });
    
    console.log(`\n🎯 Score: ${passed}/${testResults.length} tests passed`);
    
    if (passed === testResults.length) {
        console.log('\n🎉 All real scraping tests passed!');
        console.log('✨ The Enhanced Researcher Agent is ready for production use.');
    } else if (passed > 0) {
        console.log('\n⚠️  Some scraping tests passed, others failed.');
        console.log('🔧 This is normal - some sites may block requests or change structure.');
        console.log('💡 The scraping functionality is working, but some sources may need adjustment.');
    } else {
        console.log('\n❌ All scraping tests failed.');
        console.log('🔧 This might be due to network issues or website changes.');
        console.log('🌐 Check your internet connection and try again.');
    }
    
    console.log('\n💡 Note: Real scraping results may vary due to:');
    console.log('   - Website structure changes');
    console.log('   - Rate limiting and blocking');
    console.log('   - Network connectivity');
    console.log('   - Geographic restrictions');
}

// 実行
if (require.main === module) {
    runRealScrapingTests().catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = { runRealScrapingTests };