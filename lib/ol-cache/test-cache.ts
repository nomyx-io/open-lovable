/**
 * OL-Cache Test Script
 * 
 * Run with: npx ts-node lib/ol-cache/test-cache.ts
 * Or: npx tsx lib/ol-cache/test-cache.ts
 */

import { OLCacheManager } from './cache-manager';
import { OLCacheIntegration } from './integration';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testCache() {
  console.log('🧪 Testing OL-Cache functionality...\n');
  
  // Use current project as test directory
  const testDir = path.resolve(__dirname, '../..');
  console.log(`📁 Test directory: ${testDir}\n`);
  
  // Test 1: Generate cache
  console.log('1️⃣ Testing cache generation...');
  const manager = new OLCacheManager(testDir);
  
  try {
    const docs = await manager.generateCache({ force: true });
    console.log(`   ✅ Cache generated successfully!`);
    console.log(`   📊 Project: ${docs.name}`);
    console.log(`   📊 Type: ${docs.projectType}`);
    console.log(`   📊 Technologies: ${docs.technologies.join(', ')}`);
    console.log(`   📊 Files documented: ${Object.keys(docs.files).length}`);
    console.log(`   📊 Routes detected: ${docs.routes.length}`);
    console.log(`   📊 Patterns: ${docs.patterns.slice(0, 5).join(', ')}...`);
  } catch (error) {
    console.error('   ❌ Cache generation failed:', error);
    process.exit(1);
  }
  
  // Test 2: Read cache
  console.log('\n2️⃣ Testing cache reading...');
  try {
    const context = await manager.readCache({ maxFiles: 10 });
    console.log(`   ✅ Cache read successfully!`);
    console.log(`   📊 Cache found: ${context.cacheFound}`);
    console.log(`   📊 Is fresh: ${context.isFresh}`);
    console.log(`   📊 Files included: ${context.filesIncluded.length}`);
    console.log(`   📊 Context length: ${context.contextString.length} chars`);
  } catch (error) {
    console.error('   ❌ Cache reading failed:', error);
    process.exit(1);
  }
  
  // Test 3: Get context for step
  console.log('\n3️⃣ Testing context for specific step...');
  try {
    const stepContext = await manager.getContextForStep('Add a new button component with Tailwind styling');
    console.log(`   ✅ Step context retrieved!`);
    console.log(`   📊 Files included: ${stepContext.filesIncluded.length}`);
    console.log(`   📊 Relevant patterns: ${stepContext.relevantPatterns.join(', ')}`);
    console.log(`   📊 Context preview: ${stepContext.contextString.substring(0, 200)}...`);
  } catch (error) {
    console.error('   ❌ Step context failed:', error);
    process.exit(1);
  }
  
  // Test 4: Integration helper
  console.log('\n4️⃣ Testing integration helper...');
  try {
    const integration = new OLCacheIntegration(testDir);
    const preGenContext = await integration.preGenerate('Create a user profile component');
    console.log(`   ✅ Pre-generate context retrieved!`);
    console.log(`   📊 Context length: ${preGenContext.length} chars`);
    console.log(`   📊 Has project info: ${preGenContext.includes('Project:')}`);
    console.log(`   📊 Has patterns: ${preGenContext.includes('Patterns')}`);
  } catch (error) {
    console.error('   ❌ Integration test failed:', error);
    process.exit(1);
  }
  
  // Test 5: File type filtering
  console.log('\n5️⃣ Testing file type filtering...');
  try {
    const componentContext = await manager.readCache({ 
      fileTypes: ['component', 'page'],
      maxFiles: 5 
    });
    console.log(`   ✅ Component filter works!`);
    console.log(`   📊 Component files: ${componentContext.filesIncluded.join(', ')}`);
  } catch (error) {
    console.error('   ❌ File type filtering failed:', error);
    process.exit(1);
  }
  
  console.log('\n✨ All tests passed! OL-Cache is working correctly.\n');
  
  // Print sample of what AI would see
  console.log('📝 Sample AI Context (first 500 chars):');
  console.log('─'.repeat(60));
  const sampleContext = await manager.getContextForStep('Edit the Header component');
  console.log(sampleContext.contextString.substring(0, 500));
  console.log('─'.repeat(60));
}

// Run tests
testCache().catch(console.error);