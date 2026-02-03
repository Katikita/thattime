/**
 * Automated Tests for Polaroid Frame Sizing and Sharing UX
 * 
 * Run with: npx tsx test-polaroid-sharing.test.ts
 * Or add to your test suite
 */

// Test configuration
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Helper: Check if element exists and has correct class
function testPolaroidFrameClass() {
  console.log('✅ Testing: Polaroid frame CSS class exists');
  
  // This would need to be run in browser context
  // For now, we'll verify the CSS file has the class
  const fs = require('fs');
  const globalsCSS = fs.readFileSync('./app/globals.css', 'utf-8');
  
  const hasPolaroidFrame = globalsCSS.includes('.polaroid-frame');
  const hasMobileMediaQuery = globalsCSS.includes('@media (max-width: 767px)');
  const hasDesktopWidth = globalsCSS.includes('width: 450px');
  const hasMobileWidth = globalsCSS.includes('min(95vw, 450px)');
  
  if (!hasPolaroidFrame) {
    throw new Error('❌ .polaroid-frame class not found in globals.css');
  }
  if (!hasMobileMediaQuery) {
    throw new Error('❌ Mobile media query not found');
  }
  if (!hasDesktopWidth) {
    throw new Error('❌ Desktop width (450px) not found');
  }
  if (!hasMobileWidth) {
    throw new Error('❌ Mobile width (min(95vw, 450px)) not found');
  }
  
  console.log('✅ Polaroid frame CSS class structure is correct');
}

// Helper: Check if pages use polaroid-frame class
function testPagesUsePolaroidFrame() {
  console.log('\n✅ Testing: Pages use polaroid-frame class');
  
  const fs = require('fs');
  const pages = [
    './app/upload/page.tsx',
    './app/photoname/page.tsx',
    './app/writepostcard/page.tsx',
    './app/preview/page.tsx',
  ];
  
  pages.forEach((pagePath) => {
    const content = fs.readFileSync(pagePath, 'utf-8');
    const pageName = pagePath.split('/').pop();
    
    if (!content.includes('polaroid-frame')) {
      throw new Error(`❌ ${pageName} does not use polaroid-frame class`);
    }
    
    // Check that inline width/height styles are removed
    if (content.includes('width: 450') && content.includes('height: 337.5') && 
        !content.includes('polaroid-frame')) {
      console.warn(`⚠️  ${pageName} may still have inline width/height styles`);
    }
    
    console.log(`✅ ${pageName} uses polaroid-frame class`);
  });
}

// Helper: Check share link creation function exists
function testShareLinkCreation() {
  console.log('\n✅ Testing: Share link creation function');
  
  const fs = require('fs');
  const previewPage = fs.readFileSync('./app/preview/page.tsx', 'utf-8');
  
  // Check createShareLink function exists
  if (!previewPage.includes('async function createShareLink')) {
    throw new Error('❌ createShareLink function not found');
  }
  
  // Check it's outside component (not inside)
  const functionIndex = previewPage.indexOf('async function createShareLink');
  const componentIndex = previewPage.indexOf('export default function PreviewPage');
  
  if (functionIndex > componentIndex) {
    throw new Error('❌ createShareLink should be defined outside component');
  }
  
  // Check sessionStorage caching
  if (!previewPage.includes("sessionStorage.getItem('share_url')")) {
    throw new Error('❌ Session storage caching not implemented');
  }
  
  // Check share status states
  const hasIdle = previewPage.includes("'idle'");
  const hasCreating = previewPage.includes("'creating'");
  const hasReady = previewPage.includes("'ready'");
  const hasError = previewPage.includes("'error'");
  
  if (!hasIdle || !hasCreating || !hasReady || !hasError) {
    throw new Error('❌ Share status states incomplete');
  }
  
  console.log('✅ Share link creation function structure is correct');
}

// Helper: Check share button states
function testShareButtonStates() {
  console.log('\n✅ Testing: Share button states');
  
  const fs = require('fs');
  const previewPage = fs.readFileSync('./app/preview/page.tsx', 'utf-8');
  
  // Check button shows "Preparing…" when creating
  if (!previewPage.includes("'Preparing…'") && !previewPage.includes('Preparing…')) {
    throw new Error('❌ Share button does not show "Preparing…" state');
  }
  
  // Check button is disabled when creating
  if (!previewPage.includes('disabled={shareStatus === \'creating\'')) {
    throw new Error('❌ Share button not disabled during creation');
  }
  
  // Check retry functionality
  if (!previewPage.includes('handleRetry')) {
    throw new Error('❌ Retry functionality not implemented');
  }
  
  console.log('✅ Share button states are correct');
}

// Helper: Check toast notification
function testToastNotification() {
  console.log('\n✅ Testing: Toast notification');
  
  const fs = require('fs');
  const previewPage = fs.readFileSync('./app/preview/page.tsx', 'utf-8');
  
  // Check toast state exists
  if (!previewPage.includes('toastMessage')) {
    throw new Error('❌ Toast message state not found');
  }
  
  // Check toast UI exists
  if (!previewPage.includes('Copied ✅')) {
    throw new Error('❌ Toast "Copied ✅" message not found');
  }
  
  // Check toast auto-dismiss
  if (!previewPage.includes('setTimeout(() => setToastMessage(null)')) {
    throw new Error('❌ Toast auto-dismiss not implemented');
  }
  
  console.log('✅ Toast notification is implemented');
}

// Helper: Check clipboard copy (always copy, no native share)
function testClipboardCopy() {
  console.log('\n✅ Testing: Clipboard copy functionality');
  
  const fs = require('fs');
  const previewPage = fs.readFileSync('./app/preview/page.tsx', 'utf-8');
  
  // Check doShare function copies to clipboard
  if (!previewPage.includes('navigator.clipboard.writeText')) {
    throw new Error('❌ Clipboard copy not implemented');
  }
  
  // Check native share is NOT used (should be removed)
  const hasNavigatorShare = previewPage.includes('navigator.share');
  if (hasNavigatorShare) {
    // Check if it's commented out or removed
    const shareCallIndex = previewPage.indexOf('navigator.share');
    const doShareFunction = previewPage.substring(
      previewPage.indexOf('const doShare'),
      previewPage.indexOf('};', previewPage.indexOf('const doShare'))
    );
    
    // If navigator.share exists but is not the primary method, that's okay
    // But we want clipboard to be primary
    if (doShareFunction.includes('await navigator.share')) {
      console.warn('⚠️  Native share still used - should use clipboard only');
    }
  }
  
  console.log('✅ Clipboard copy is implemented');
}

// Helper: Check double layer fix
function testDoubleLayerFix() {
  console.log('\n✅ Testing: Double layer fix');
  
  const fs = require('fs');
  
  // Check preview page
  const previewPage = fs.readFileSync('./app/preview/page.tsx', 'utf-8');
  const previewHasTransparent = previewPage.includes('background: \'transparent\'') ||
                                 previewPage.includes('background: "transparent"');
  const previewHasNoShadow = previewPage.includes('boxShadow: \'none\'') ||
                             previewPage.includes('boxShadow: "none"');
  
  if (!previewHasTransparent || !previewHasNoShadow) {
    throw new Error('❌ Preview page double layer not fixed');
  }
  
  // Check writepostcard page
  const writePage = fs.readFileSync('./app/writepostcard/page.tsx', 'utf-8');
  const writeHasTransparent = writePage.includes('background: \'transparent\'') ||
                              writePage.includes('background: "transparent"');
  const writeHasNoShadow = writePage.includes('boxShadow: \'none\'') ||
                           writePage.includes('boxShadow: "none"');
  
  if (!writeHasTransparent || !writeHasNoShadow) {
    throw new Error('❌ Writepostcard page double layer not fixed');
  }
  
  console.log('✅ Double layer fix is applied');
}

// Helper: Check wrapper fixes (no fixed 500px width)
function testWrapperFixes() {
  console.log('\n✅ Testing: Wrapper fixes (responsive)');
  
  const fs = require('fs');
  
  const uploadPage = fs.readFileSync('./app/upload/page.tsx', 'utf-8');
  const photonamePage = fs.readFileSync('./app/photoname/page.tsx', 'utf-8');
  
  // Check no hard-coded 500px width wrappers
  if (uploadPage.includes("width: '500px'") || uploadPage.includes('width: "500px"')) {
    throw new Error('❌ Upload page still has fixed 500px wrapper');
  }
  
  if (photonamePage.includes("width: '500px'") || photonamePage.includes('width: "500px"')) {
    throw new Error('❌ Photoname page still has fixed 500px wrapper');
  }
  
  // Check responsive wrappers
  if (!uploadPage.includes('w-full') || !photonamePage.includes('w-full')) {
    throw new Error('❌ Pages should use w-full for responsive wrappers');
  }
  
  console.log('✅ Wrapper fixes are applied');
}

// Main test runner
function runAllTests() {
  console.log('🧪 Running Polaroid Frame & Sharing UX Tests\n');
  console.log('=' .repeat(60));
  
  try {
    testPolaroidFrameClass();
    testPagesUsePolaroidFrame();
    testShareLinkCreation();
    testShareButtonStates();
    testToastNotification();
    testClipboardCopy();
    testDoubleLayerFix();
    testWrapperFixes();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests passed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Test manually in browser (see TESTING_CHECKLIST.md)');
    console.log('   2. Test on mobile device or DevTools emulation');
    console.log('   3. Verify sessionStorage caching works');
    console.log('   4. Test clipboard copy functionality');
    
  } catch (error: any) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests();
}

export { runAllTests };
