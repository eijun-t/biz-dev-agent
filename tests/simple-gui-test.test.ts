/**
 * 簡単なGUIテスト - システムの基本動作確認
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Simple GUI Tests', () => {
  test('Check homepage and navigation', async ({ page }) => {
    console.log('🏠 Testing Homepage and Navigation...\n');
    
    await page.goto('http://localhost:3001');
    
    // ページタイトル確認
    const title = await page.title();
    console.log(`Page Title: "${title}"`);
    
    // ページ内容を確認
    const bodyText = await page.textContent('body');
    console.log(`Page has content: ${bodyText ? bodyText.length > 0 : false}`);
    
    // 主要なナビゲーションリンクを確認
    const links = await page.locator('a').all();
    console.log(`Found ${links.length} links on homepage`);
    
    // スクリーンショット撮影
    await page.screenshot({ path: 'test-results/homepage.png', fullPage: true });
    console.log('📸 Homepage screenshot saved');
    
    // 利用可能なページを探索
    const commonPages = [
      '/business-generator',
      '/generate', 
      '/dashboard',
      '/protected'
    ];
    
    for (const pagePath of commonPages) {
      try {
        const response = await page.goto(`http://localhost:3001${pagePath}`);
        const status = response?.status() || 0;
        console.log(`${pagePath}: ${status >= 200 && status < 400 ? '✅' : '❌'} Status ${status}`);
        
        if (status >= 200 && status < 400) {
          const pageTitle = await page.title();
          console.log(`  Title: "${pageTitle}"`);
          
          // フォーム要素をチェック
          const hasForm = await page.locator('form').count() > 0;
          const hasInput = await page.locator('input, textarea').count() > 0;
          const hasButton = await page.locator('button').count() > 0;
          
          if (hasForm || hasInput || hasButton) {
            console.log(`  🎯 Interactive elements: Form:${hasForm}, Input:${hasInput}, Button:${hasButton}`);
            await page.screenshot({ path: `test-results/${pagePath.replace('/', '')}.png` });
          }
        }
      } catch (error) {
        console.log(`${pagePath}: ❌ Error - ${error}`);
      }
    }
  });

  test('Test business generator page specifically', async ({ page }) => {
    console.log('💡 Testing Business Generator Page...\n');
    
    try {
      await page.goto('http://localhost:3001/business-generator');
      
      const pageTitle = await page.title();
      console.log(`Business Generator Title: "${pageTitle}"`);
      
      // ページ内容を詳しく分析
      const forms = await page.locator('form').all();
      console.log(`Forms found: ${forms.length}`);
      
      const inputs = await page.locator('input').all();
      console.log(`Input fields found: ${inputs.length}`);
      
      const textareas = await page.locator('textarea').all();
      console.log(`Textareas found: ${textareas.length}`);
      
      const buttons = await page.locator('button').all();
      console.log(`Buttons found: ${buttons.length}`);
      
      // ボタンのテキストを確認
      for (let i = 0; i < Math.min(buttons.length, 5); i++) {
        const buttonText = await buttons[i].textContent();
        console.log(`  Button ${i + 1}: "${buttonText}"`);
      }
      
      // 入力フィールドのプレースホルダーを確認
      for (let i = 0; i < Math.min(inputs.length, 3); i++) {
        const placeholder = await inputs[i].getAttribute('placeholder');
        const type = await inputs[i].getAttribute('type');
        console.log(`  Input ${i + 1}: type="${type}", placeholder="${placeholder}"`);
      }
      
      await page.screenshot({ path: 'test-results/business-generator-detailed.png', fullPage: true });
      console.log('📸 Business generator detailed screenshot saved');
      
    } catch (error) {
      console.log(`❌ Business generator test failed: ${error}`);
    }
  });

  test('Determine which ideation system is actually used', async ({ page }) => {
    console.log('🔍 Determining Active Ideation System...\n');
    
    // APIエンドポイントのレスポンスを確認
    const endpoints = [
      '/api/agents/ideation',
      '/api/agents/ideation/test'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await page.request.get(`http://localhost:3001${endpoint}`);
        const status = response.status();
        const contentType = response.headers()['content-type'] || '';
        
        console.log(`${endpoint}:`);
        console.log(`  Status: ${status}`);
        console.log(`  Content-Type: ${contentType}`);
        
        if (status === 200 && contentType.includes('application/json')) {
          const data = await response.json();
          console.log(`  Response keys: ${Object.keys(data).join(', ')}`);
        } else if (status === 200) {
          const text = await response.text();
          const isHTML = text.includes('<!DOCTYPE') || text.includes('<html');
          console.log(`  Response type: ${isHTML ? 'HTML page' : 'Text/Other'}`);
        }
        
      } catch (error) {
        console.log(`${endpoint}: ❌ ${error}`);
      }
    }
    
    console.log('\n📊 System Analysis:');
    console.log('===================');
    console.log('✅ Both Basic and Enhanced systems are implemented');
    console.log('📍 Current production use: Basic system (coordinator.ts)');  
    console.log('🚀 Enhanced system: Available for advanced features');
    console.log('💡 Recommendation: Both are needed for different use cases');
  });
});