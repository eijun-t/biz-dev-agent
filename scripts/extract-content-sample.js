/**
 * JSONファイルから主要なコンテンツを抽出して読みやすく表示
 */

const fs = require('fs');
const path = require('path');

// JSONファイルを読み込み
const dataPath = '/Users/eijuntei/Desktop/workspace/biz-dev-agent/data/scraped/scraped_data_2025-07-21T14-29-44.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('📋 Scraped Content Sample Display');
console.log('=================================\n');

console.log(`📊 Extraction Time: ${new Date(data.extraction_time).toLocaleString()}\n`);

// Reddit データのコンテンツを表示
if (data.sources.reddit) {
    console.log('💬 REDDIT POSTS - Content Sample:');
    console.log('----------------------------------\n');
    
    data.sources.reddit.forEach((post, index) => {
        console.log(`📝 ${index + 1}. ${post.title}`);
        console.log(`🔗 URL: ${post.url}`);
        console.log(`📅 Date: ${new Date(post.publishedDate).toLocaleDateString()}`);
        console.log(`⭐ Relevance Score: ${post.relevanceScore}/10`);
        console.log(`👥 r/${post.metadata.subreddit} | ${post.metadata.score} upvotes | ${post.metadata.num_comments} comments`);
        
        if (post.content && post.content.length > 50) {
            console.log('📖 Content Preview:');
            console.log(post.content.substring(0, 500) + '...\n');
        } else {
            console.log('📖 Content Preview:');
            console.log(post.snippet + '\n');
        }
        
        console.log('─'.repeat(80) + '\n');
    });
}

// arXiv データのコンテンツを表示
if (data.sources.arxiv) {
    console.log('\n📚 ARXIV PAPERS - Abstract Sample:');
    console.log('-----------------------------------\n');
    
    data.sources.arxiv.forEach((paper, index) => {
        console.log(`📚 ${index + 1}. ${paper.title}`);
        console.log(`🔗 URL: ${paper.url}`);
        console.log(`📅 Date: ${new Date(paper.publishedDate).toLocaleDateString()}`);
        console.log(`⭐ Relevance Score: ${paper.relevanceScore}/10`);
        console.log(`👥 Authors: ${paper.metadata.authors ? paper.metadata.authors.slice(0, 3).join(', ') : 'N/A'}`);
        console.log(`🏷️ Category: ${paper.metadata.category || 'N/A'}`);
        
        console.log('📖 Abstract:');
        console.log(paper.content.substring(0, 600) + '...\n');
        
        console.log('─'.repeat(80) + '\n');
    });
}

// 統計情報
console.log('\n📊 SUMMARY STATISTICS:');
console.log('======================');

const totalItems = (data.sources.reddit?.length || 0) + (data.sources.arxiv?.length || 0) + (data.sources.yahoo_news?.length || 0);
const highRelevance = [];
const mediumRelevance = [];
const lowRelevance = [];

// 全アイテムを関連度で分類
Object.values(data.sources).forEach(sourceItems => {
    if (Array.isArray(sourceItems)) {
        sourceItems.forEach(item => {
            if (item.relevanceScore >= 7) highRelevance.push(item);
            else if (item.relevanceScore >= 4) mediumRelevance.push(item);
            else lowRelevance.push(item);
        });
    }
});

console.log(`📊 Total Items: ${totalItems}`);
console.log(`🔥 High Relevance (7-10): ${highRelevance.length} items`);
console.log(`⚠️ Medium Relevance (4-6): ${mediumRelevance.length} items`);
console.log(`📄 Low Relevance (0-3): ${lowRelevance.length} items`);

console.log('\n🎯 TOP RELEVANT ITEMS:');
console.log('======================');

highRelevance.concat(mediumRelevance).slice(0, 5).forEach((item, index) => {
    console.log(`${index + 1}. [${item.source}] ${item.title.substring(0, 60)}...`);
    console.log(`   Score: ${item.relevanceScore}/10 | ${item.url}`);
});

// 日本関連のコンテンツを特別に抽出
console.log('\n🇯🇵 JAPAN-RELATED CONTENT:');
console.log('============================');

const japanRelated = [];
Object.values(data.sources).forEach(sourceItems => {
    if (Array.isArray(sourceItems)) {
        sourceItems.forEach(item => {
            const text = (item.title + ' ' + item.content).toLowerCase();
            if (text.includes('japan') || text.includes('japanese') || text.includes('tokyo') || text.includes('日本')) {
                japanRelated.push(item);
            }
        });
    }
});

japanRelated.forEach((item, index) => {
    console.log(`${index + 1}. [${item.source}] ${item.title}`);
    console.log(`   Score: ${item.relevanceScore}/10`);
    console.log(`   Preview: ${item.snippet?.substring(0, 100) || item.content.substring(0, 100)}...`);
    console.log('');
});

console.log(`\n✨ Found ${japanRelated.length} Japan-related items out of ${totalItems} total items`);
console.log('💡 This data is ready for Enhanced Researcher Agent analysis!');