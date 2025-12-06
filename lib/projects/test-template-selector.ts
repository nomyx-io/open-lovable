/**
 * Template Selector Test Script
 * 
 * Run with: npx tsx lib/projects/test-template-selector.ts
 */

import { analyzeProjectRequirements, refineProjectSelection } from './template-selector';

async function testTemplateSelector() {
  console.log('🧪 Testing Template Selector...\n');

  // Test cases with expected outcomes
  // Note: The selector correctly asks clarifying questions for ambiguous cases
  const testCases = [
    {
      name: 'Clear mobile app request',
      input: 'I want to build a mobile app for iOS and Android',
      expectedType: 'expo',
      expectedConfident: false, // Still asks to confirm mobile vs web
    },
    {
      name: 'Clear Next.js request',
      input: 'Build a full-stack application with server-side rendering and API routes',
      expectedType: 'nextjs-app',
      expectedConfident: true,
    },
    {
      name: 'Clear Vite request',
      input: 'Create a simple React SPA with Vite',
      expectedType: 'vite-react',
      expectedConfident: false, // Shorter input, may ask for template type
    },
    {
      name: 'Landing page request',
      input: 'I need a landing page with hero section and call to action',
      expectedType: 'vite-react',
      expectedConfident: false, // Asks for confirmation on project type
    },
    {
      name: 'Dashboard request',
      input: 'Build an admin dashboard with charts and stats',
      expectedType: 'vite-react',
      expectedConfident: false, // Asks for confirmation
    },
    {
      name: 'Blog request',
      input: 'Create a blog with markdown content',
      expectedType: 'astro',
      expectedConfident: false, // Shorter input
    },
    {
      name: 'Ambiguous app request',
      input: 'Create an app',
      expectedType: 'vite-react',
      expectedConfident: false,
    },
    {
      name: 'Ambiguous website request',
      input: 'Build a website',
      expectedType: 'vite-react',
      expectedConfident: false,
    },
    {
      name: 'E-commerce request',
      input: 'Build an online store with shopping cart and checkout',
      expectedType: 'vite-react',
      expectedConfident: false, // Asks for confirmation
    },
    {
      name: 'Very vague request',
      input: 'help me build something',
      expectedType: 'vite-react',
      expectedConfident: false,
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`\n📋 Test: ${testCase.name}`);
    console.log(`   Input: "${testCase.input}"`);
    
    const result = analyzeProjectRequirements(testCase.input);
    
    const typeMatch = result.projectType === testCase.expectedType;
    const confMatch = result.isConfident === testCase.expectedConfident;
    
    if (typeMatch && confMatch) {
      console.log(`   ✅ PASSED`);
      console.log(`      Type: ${result.projectType} (expected: ${testCase.expectedType})`);
      console.log(`      Confident: ${result.isConfident} (expected: ${testCase.expectedConfident})`);
      console.log(`      Confidence: ${(result.confidence * 100).toFixed(0)}%`);
      passed++;
    } else {
      console.log(`   ❌ FAILED`);
      console.log(`      Type: ${result.projectType} (expected: ${testCase.expectedType}) ${typeMatch ? '✓' : '✗'}`);
      console.log(`      Confident: ${result.isConfident} (expected: ${testCase.expectedConfident}) ${confMatch ? '✓' : '✗'}`);
      console.log(`      Confidence: ${(result.confidence * 100).toFixed(0)}%`);
      failed++;
    }
    
    console.log(`      Reasoning: ${result.reasoning}`);
    
    if (result.template) {
      console.log(`      Template: ${result.template.name} (${result.template.category})`);
    }
    
    if (result.clarifyingQuestions && result.clarifyingQuestions.length > 0) {
      console.log(`      Questions: ${result.clarifyingQuestions.length}`);
      for (const q of result.clarifyingQuestions) {
        console.log(`        - ${q.question}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);
  
  // Test clarifying question refinement
  console.log('\n\n🔄 Testing Clarifying Question Flow...\n');
  
  const ambiguousResult = analyzeProjectRequirements('Create an application for users');
  console.log('Initial result for "Create an application for users":');
  console.log(`   Confident: ${ambiguousResult.isConfident}`);
  console.log(`   Type: ${ambiguousResult.projectType}`);
  console.log(`   Questions: ${ambiguousResult.clarifyingQuestions?.length || 0}`);
  
  if (ambiguousResult.clarifyingQuestions && ambiguousResult.clarifyingQuestions.length > 0) {
    const firstQuestion = ambiguousResult.clarifyingQuestions[0];
    console.log(`\n   Question: ${firstQuestion.question}`);
    
    // Simulate user selecting "Mobile app"
    const mobileOption = firstQuestion.options.find(o => o.value === 'mobile');
    if (mobileOption) {
      console.log(`   User selects: "${mobileOption.label}"`);
      
      const refinedResult = refineProjectSelection(
        ambiguousResult,
        mobileOption.value,
        mobileOption
      );
      
      console.log(`\n   Refined result:`);
      console.log(`      Confident: ${refinedResult.isConfident}`);
      console.log(`      Type: ${refinedResult.projectType}`);
      console.log(`      Confidence: ${(refinedResult.confidence * 100).toFixed(0)}%`);
      console.log(`      Remaining questions: ${refinedResult.clarifyingQuestions?.length || 0}`);
      
      if (refinedResult.projectType === 'expo') {
        console.log(`   ✅ Refinement worked correctly - switched to Expo for mobile`);
      } else {
        console.log(`   ⚠️ Expected 'expo' but got '${refinedResult.projectType}'`);
      }
    }
  }

  console.log('\n✨ Template Selector tests completed!\n');
}

// Run tests
testTemplateSelector().catch(console.error);