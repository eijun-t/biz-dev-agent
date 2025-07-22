/**
 * スクレイピングで抽出したデータの詳細表示スクリプト
 * Enhanced Researcher Agentの実装データを詳細に確認
 */

const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

console.log('📊 Detailed Scraped Data Display');
console.log('==================================\n');

// Yahoo News Japan詳細データ抽出
async function extractYahooNewsData() {
    console.log('📰 Yahoo News Japan - Detailed Data Extraction:');
    console.log('------------------------------------------------');
    
    try {
        const query = 'スマートシティ';
        const encodedQuery = encodeURIComponent(query);
        const searchUrl = `https://news.yahoo.co.jp/search?p=${encodedQuery}&ei=UTF-8`;
        
        console.log(`🔍 Query: "${query}"`);
        console.log(`🌐 URL: ${searchUrl}\n`);
        
        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const html = await response.text();
        const $ = cheerio.load(html);
        const results = [];
        
        // より正確なセレクターでニュース項目を抽出
        const newsItems = $('[class*="newsFeed"] [class*="item"], .sc-gzVnrw, .searchResult li');
        
        console.log(`📊 Found ${newsItems.length} potential news items\n`);
        
        newsItems.slice(0, 10).each((index, element) => {
            const $item = $(element);
            
            // 様々なパターンでタイトルを探す
            const titleSelectors = [
                '[class*="title"] a',
                'h1 a', 'h2 a', 'h3 a', 'h4 a',
                '.newsFeed_item_title a',
                '.sc-AxhCb a',
                'a[href*="/articles/"]'
            ];
            
            let title = '';
            let url = '';
            
            for (const selector of titleSelectors) {
                const titleElement = $item.find(selector).first();
                if (titleElement.length > 0) {
                    title = titleElement.text().trim();
                    url = titleElement.attr('href') || '';
                    break;
                }
            }
            
            // タイトルが見つからない場合、別の方法で探す
            if (!title) {
                title = $item.find('a').first().text().trim();
                url = $item.find('a').first().attr('href') || '';
            }
            
            // スニペット抽出
            const snippetSelectors = [
                '[class*="detail"]',
                '[class*="summary"]', 
                '[class*="excerpt"]',
                'p',
                '.newsFeed_item_detail'
            ];
            
            let snippet = '';
            for (const selector of snippetSelectors) {
                const snippetElement = $item.find(selector).first();
                if (snippetElement.length > 0) {
                    snippet = snippetElement.text().trim();
                    if (snippet.length > 20) break;
                }
            }
            
            // 日付抽出
            const dateSelectors = [
                '[class*="date"]',
                '[class*="time"]',
                'time',
                '.newsFeed_item_date'
            ];
            
            let dateText = '';
            for (const selector of dateSelectors) {
                const dateElement = $item.find(selector).first();
                if (dateElement.length > 0) {
                    dateText = dateElement.text().trim();
                    break;
                }
            }
            
            if (title && title.length > 10) {
                const newsItem = {
                    id: `yahoo_news_${Date.now()}_${index}`,
                    title: title,
                    url: url.startsWith('http') ? url : `https://news.yahoo.co.jp${url}`,
                    snippet: snippet,
                    publishedDate: dateText,
                    extractedAt: new Date().toISOString(),
                    relevanceScore: calculateRelevance(title, snippet, [query]),
                    source: 'Yahoo News Japan'
                };
                
                results.push(newsItem);
                
                console.log(`📰 ${index + 1}. ${title}`);
                console.log(`   🔗 URL: ${newsItem.url}`);
                console.log(`   📅 Date: ${dateText || 'N/A'}`);
                console.log(`   📝 Snippet: ${snippet.substring(0, 100)}${snippet.length > 100 ? '...' : ''}`);
                console.log(`   ⭐ Relevance: ${newsItem.relevanceScore}/10`);
                console.log('');
            }
        });
        
        console.log(`✅ Successfully extracted ${results.length} news articles\n`);
        return results;
        
    } catch (error) {
        console.log(`❌ Yahoo News extraction failed: ${error.message}\n`);
        return [];
    }
}

// Reddit詳細データ抽出
async function extractRedditData() {
    console.log('💬 Reddit - Detailed Data Extraction:');
    console.log('--------------------------------------');
    
    try {
        const query = 'smart city japan';
        const encodedQuery = encodeURIComponent(query);
        const apiUrl = `https://www.reddit.com/search.json?q=${encodedQuery}&limit=10&sort=relevance&t=month`;
        
        console.log(`🔍 Query: "${query}"`);
        console.log(`🌐 URL: ${apiUrl}\n`);
        
        const response = await fetch(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        const results = [];
        
        if (data.data && data.data.children) {
            console.log(`📊 Found ${data.data.children.length} Reddit posts\n`);
            
            data.data.children.forEach((item, index) => {
                const post = item.data;
                
                const redditItem = {
                    id: `reddit_${Date.now()}_${index}`,
                    title: post.title,
                    url: `https://www.reddit.com${post.permalink}`,
                    content: post.selftext || '',
                    snippet: (post.selftext || post.title).substring(0, 200),
                    publishedDate: new Date(post.created_utc * 1000).toISOString(),
                    extractedAt: new Date().toISOString(),
                    relevanceScore: calculateRelevance(post.title, post.selftext || '', query.split(' ')),
                    source: 'Reddit',
                    metadata: {
                        subreddit: post.subreddit,
                        score: post.score,
                        num_comments: post.num_comments,
                        author: post.author
                    }
                };
                
                results.push(redditItem);
                
                console.log(`💬 ${index + 1}. ${post.title}`);
                console.log(`   🏷️  r/${post.subreddit} by u/${post.author}`);
                console.log(`   🔗 URL: ${redditItem.url}`);
                console.log(`   📅 Date: ${new Date(post.created_utc * 1000).toLocaleDateString()}`);
                console.log(`   ⬆️  ${post.score} upvotes, ${post.num_comments} comments`);
                console.log(`   📝 Content: ${redditItem.snippet}${post.selftext && post.selftext.length > 200 ? '...' : ''}`);
                console.log(`   ⭐ Relevance: ${redditItem.relevanceScore}/10`);
                console.log('');
            });
        }
        
        console.log(`✅ Successfully extracted ${results.length} Reddit posts\n`);
        return results;
        
    } catch (error) {
        console.log(`❌ Reddit extraction failed: ${error.message}\n`);
        return [];
    }
}

// arXiv詳細データ抽出
async function extractArxivData() {
    console.log('📚 arXiv - Detailed Data Extraction:');
    console.log('------------------------------------');
    
    try {
        const query = 'smart city IoT japan';
        const encodedQuery = encodeURIComponent(query);
        const apiUrl = `http://export.arxiv.org/api/query?search_query=all:${encodedQuery}&start=0&max_results=10&sortBy=submittedDate&sortOrder=descending`;
        
        console.log(`🔍 Query: "${query}"`);
        console.log(`🌐 URL: ${apiUrl}\n`);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const xmlText = await response.text();
        const results = [];
        
        // XMLパース
        const entryRegex = /<entry>(.*?)<\/entry>/gs;
        const entries = xmlText.match(entryRegex) || [];
        
        console.log(`📊 Found ${entries.length} arXiv papers\n`);
        
        entries.forEach((entry, index) => {
            const titleMatch = entry.match(/<title>(.*?)<\/title>/s);
            const summaryMatch = entry.match(/<summary>(.*?)<\/summary>/s);
            const linkMatch = entry.match(/<link.*?href="(.*?)".*?>/);
            const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
            const authorMatches = entry.match(/<name>(.*?)<\/name>/g);
            const categoryMatch = entry.match(/<category.*?term="(.*?)".*?>/);
            
            if (titleMatch && summaryMatch) {
                const title = titleMatch[1].trim().replace(/\s+/g, ' ');
                const summary = summaryMatch[1].trim().replace(/\s+/g, ' ');
                const authors = authorMatches ? authorMatches.map(m => m.replace(/<\/?name>/g, '')) : [];
                
                const arxivItem = {
                    id: `arxiv_${Date.now()}_${index}`,
                    title: title,
                    url: linkMatch ? linkMatch[1] : '',
                    content: summary,
                    snippet: summary.substring(0, 300),
                    publishedDate: publishedMatch ? publishedMatch[1] : '',
                    extractedAt: new Date().toISOString(),
                    relevanceScore: calculateRelevance(title, summary, query.split(' ')),
                    source: 'arXiv',
                    metadata: {
                        authors: authors,
                        category: categoryMatch ? categoryMatch[1] : '',
                        type: 'academic_paper'
                    }
                };
                
                results.push(arxivItem);
                
                console.log(`📚 ${index + 1}. ${title}`);
                console.log(`   👥 Authors: ${authors.slice(0, 3).join(', ')}${authors.length > 3 ? ' et al.' : ''}`);
                console.log(`   🔗 URL: ${arxivItem.url}`);
                console.log(`   📅 Date: ${publishedMatch ? new Date(publishedMatch[1]).toLocaleDateString() : 'N/A'}`);
                console.log(`   🏷️  Category: ${categoryMatch ? categoryMatch[1] : 'N/A'}`);
                console.log(`   📝 Abstract: ${summary.substring(0, 200)}...`);
                console.log(`   ⭐ Relevance: ${arxivItem.relevanceScore}/10`);
                console.log('');
            }
        });
        
        console.log(`✅ Successfully extracted ${results.length} arXiv papers\n`);
        return results;
        
    } catch (error) {
        console.log(`❌ arXiv extraction failed: ${error.message}\n`);
        return [];
    }
}

// 関連性スコア計算（Enhanced Researcher Agentと同じロジック）
function calculateRelevance(title, content, keywords) {
    const text = (title + ' ' + content).toLowerCase();
    let score = 0;
    
    keywords.forEach(keyword => {
        const keywordLower = keyword.toLowerCase();
        if (text.includes(keywordLower)) {
            score += 2;
            // タイトルに含まれている場合は追加ポイント
            if (title.toLowerCase().includes(keywordLower)) {
                score += 1;
            }
        }
    });
    
    return Math.min(score, 10);
}

// JSONファイルに保存
function saveDataToFile(data, filename) {
    const outputDir = path.join(__dirname, '..', 'data', 'scraped');
    
    // ディレクトリが存在しない場合は作成
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const filePath = path.join(outputDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`💾 Data saved to: ${filePath}\n`);
    
    return filePath;
}

// メイン実行
async function displayScrapedData() {
    console.log('🎯 Starting detailed data extraction and display...\n');
    
    const allData = {
        extraction_time: new Date().toISOString(),
        sources: {}
    };
    
    // Yahoo News データ抽出
    const yahooData = await extractYahooNewsData();
    if (yahooData.length > 0) {
        allData.sources.yahoo_news = yahooData;
    }
    
    // Reddit データ抽出
    const redditData = await extractRedditData();
    if (redditData.length > 0) {
        allData.sources.reddit = redditData;
    }
    
    // arXiv データ抽出
    const arxivData = await extractArxivData();
    if (arxivData.length > 0) {
        allData.sources.arxiv = arxivData;
    }
    
    // 統計情報表示
    console.log('📊 Extraction Summary:');
    console.log('======================');
    console.log(`📰 Yahoo News: ${yahooData.length} articles`);
    console.log(`💬 Reddit: ${redditData.length} posts`);
    console.log(`📚 arXiv: ${arxivData.length} papers`);
    console.log(`📊 Total: ${yahooData.length + redditData.length + arxivData.length} items\n`);
    
    // データをファイルに保存
    const filename = `scraped_data_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    const savedPath = saveDataToFile(allData, filename);
    
    // 高関連性アイテムを表示
    const allItems = [...yahooData, ...redditData, ...arxivData];
    const highRelevanceItems = allItems.filter(item => item.relevanceScore >= 6);
    
    if (highRelevanceItems.length > 0) {
        console.log('⭐ High Relevance Items (Score >= 6):');
        console.log('====================================');
        highRelevanceItems.forEach((item, index) => {
            console.log(`${index + 1}. [${item.source}] ${item.title.substring(0, 80)}...`);
            console.log(`   Score: ${item.relevanceScore}/10 | ${item.url}`);
        });
    }
    
    console.log(`\n✨ Complete! All extracted data is saved in: ${savedPath}`);
    console.log('💡 You can now analyze the JSON file to see all scraped data in detail.');
}

// 実行
if (require.main === module) {
    displayScrapedData().catch(error => {
        console.error('Data extraction failed:', error);
        process.exit(1);
    });
}

module.exports = { displayScrapedData };