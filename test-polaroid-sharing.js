/**
 * Automated Tests for Polaroid Frame Sizing and Sharing UX
 * 
 * Run with: node test-polaroid-sharing.js
 */

const fs = require('fs');
const path = require('path');

let testsPassed = 0;
let testsFailed = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    testsPassed++;
    console.log(`✅ ${message}`);
  } else {
    testsFailed++;
    failures.push(message);
    console.error(`❌ ${message}`);
  }
}

function testPolaroidFrameClass() {
  console.log('\n📦 Testing: Polaroid frame CSS class');
  
  const globalsCSS = fs.readFileSync('./app/globals.css', 'utf-8');
  
  assert(globalsCSS.includes('.polaroid-frame'), 'Polaroid frame CSS class exists');
  assert(globalsCSS.includes('@media (max-width: 767px)'), 'Mobile media query exists');
  assert(globalsCSS.includes('width: 450px'), 'Desktop width (450px) defined');
  assert(globalsCSS.includes('min(95vw, 450px)'), 'Mobile responsive width defined');
  assert(globalsCSS.includes('aspect-ratio: 4 / 3'), 'Aspect ratio defined');
}

function testPagesUsePolaroidFrame() {
  console.log('\n📄 Testing: Pages use polaroid-frame class');
  
  const pages = [
    { path: './app/upload/page.tsx', name: 'upload' },
    { path: './app/photoname/page.tsx', name: 'photoname' },
    { path: './app/writepostcard/page.tsx', name: 'writepostcard' },
    { path: './app/preview/page.tsx', name: 'preview' },
  ];
  
  pages.forEach(({ path: pagePath, name }) => {
    const content = fs.readFileSync(pagePath, 'utf-8');
    assert(
      content.includes('polaroid-frame'),
      `${name} page uses polaroid-frame class`
    );
  });
}

function testShareLinkCreation() {
  console.log('\n🔗 Testing: Share link creation');
  
  const previewPage = fs.readFileSync('./app/preview/page.tsx', 'utf-8');
  
  assert(
    previewPage.includes('async function createShareLink'),
    'createShareLink function exists'
  );
  
  // Check it's outside component
  const functionIndex = previewPage.indexOf('async function createShareLink');
  const componentIndex = previewPage.indexOf('export default function PreviewPage');
  assert(
    functionIndex < componentIndex,
    'createShareLink is defined outside component'
  );
  
  assert(
    previewPage.includes("sessionStorage.getItem('share_url')"),
    'Session storage caching implemented'
  );
  
  // Check share status states
  assert(previewPage.includes("'idle'"), 'Share status: idle state');
  assert(previewPage.includes("'creating'"), 'Share status: creating state');
  assert(previewPage.includes("'ready'"), 'Share status: ready state');
  assert(previewPage.includes("'error'"), 'Share status: error state');
}

function testShareButtonStates() {
  console.log('\n🔘 Testing: Share button states');
  
  const previewPage = fs.readFileSync('./app/preview/page.tsx', 'utf-8');
  
  assert(
    previewPage.includes('Preparing…') || previewPage.includes("'Preparing…'"),
    'Share button shows "Preparing…" state'
  );
  
  assert(
    previewPage.includes("disabled={shareStatus === 'creating'"),
    'Share button disabled during creation'
  );
  
  assert(
    previewPage.includes('handleRetry'),
    'Retry functionality implemented'
  );
}

function testToastNotification() {
  console.log('\n🔔 Testing: Toast notification');
  
  const previewPage = fs.readFileSync('./app/preview/page.tsx', 'utf-8');
  
  assert(
    previewPage.includes('toastMessage'),
    'Toast message state exists'
  );
  
  assert(
    previewPage.includes('Copied ✅'),
    'Toast "Copied ✅" message exists'
  );
  
  assert(
    previewPage.includes('setTimeout(() => setToastMessage(null)'),
    'Toast auto-dismiss implemented'
  );
}

function testClipboardCopy() {
  console.log('\n📋 Testing: Clipboard copy functionality');
  
  const previewPage = fs.readFileSync('./app/preview/page.tsx', 'utf-8');
  
  assert(
    previewPage.includes('navigator.clipboard.writeText'),
    'Clipboard copy implemented'
  );
  
  // Check doShare function structure
  const doShareStart = previewPage.indexOf('const doShare');
  const doShareEnd = previewPage.indexOf('};', doShareStart);
  const doShareFunction = previewPage.substring(doShareStart, doShareEnd);
  
  // Should primarily use clipboard, not navigator.share
  const usesClipboard = doShareFunction.includes('navigator.clipboard.writeText');
  const usesNativeShare = doShareFunction.includes('await navigator.share');
  
  assert(usesClipboard, 'doShare uses clipboard copy');
  
  if (usesNativeShare) {
    console.warn('⚠️  Warning: Native share still in doShare - should use clipboard only');
  }
}

function testDoubleLayerFix() {
  console.log('\n🎨 Testing: Double layer fix');
  
  const previewPage = fs.readFileSync('./app/preview/page.tsx', 'utf-8');
  const writePage = fs.readFileSync('./app/writepostcard/page.tsx', 'utf-8');
  
  const previewHasTransparent = previewPage.includes("background: 'transparent'") ||
                                 previewPage.includes('background: "transparent"');
  const previewHasNoShadow = previewPage.includes("boxShadow: 'none'") ||
                             previewPage.includes('boxShadow: "none"');
  
  assert(
    previewHasTransparent && previewHasNoShadow,
    'Preview page double layer fixed'
  );
  
  const writeHasTransparent = writePage.includes("background: 'transparent'") ||
                              writePage.includes('background: "transparent"');
  const writeHasNoShadow = writePage.includes("boxShadow: 'none'") ||
                           writePage.includes('boxShadow: "none"');
  
  assert(
    writeHasTransparent && writeHasNoShadow,
    'Writepostcard page double layer fixed'
  );
}

function testWrapperFixes() {
  console.log('\n📐 Testing: Wrapper fixes (responsive)');
  
  const uploadPage = fs.readFileSync('./app/upload/page.tsx', 'utf-8');
  const photonamePage = fs.readFileSync('./app/photoname/page.tsx', 'utf-8');
  
  // Check no hard-coded 500px width wrappers
  const uploadHasFixedWidth = uploadPage.includes("width: '500px'") || 
                              uploadPage.includes('width: "500px"');
  assert(!uploadHasFixedWidth, 'Upload page has no fixed 500px wrapper');
  
  const photonameHasFixedWidth = photonamePage.includes("width: '500px'") || 
                                  photonamePage.includes('width: "500px"');
  assert(!photonameHasFixedWidth, 'Photoname page has no fixed 500px wrapper');
  
  // Check responsive wrappers
  assert(uploadPage.includes('w-full'), 'Upload page uses w-full');
  assert(photonamePage.includes('w-full'), 'Photoname page uses w-full');
}

function runAllTests() {
  console.log('🧪 Running Polaroid Frame & Sharing UX Tests');
  console.log('='.repeat(60));
  
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
    console.log(`\n📊 Test Results:`);
    console.log(`   ✅ Passed: ${testsPassed}`);
    console.log(`   ❌ Failed: ${testsFailed}`);
    
    if (failures.length > 0) {
      console.log(`\n❌ Failures:`);
      failures.forEach(f => console.log(`   - ${f}`));
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed!');
      console.log('\n📋 Next steps:');
      console.log('   1. Test manually in browser (see TESTING_CHECKLIST.md)');
      console.log('   2. Test on mobile device or DevTools emulation');
      console.log('   3. Verify sessionStorage caching works');
      console.log('   4. Test clipboard copy functionality');
      console.log('\n🚀 Start dev server: npm run dev');
    }
  } catch (error) {
    console.error('\n❌ Test runner error:', error.message);
    process.exit(1);
  }
}

// Run tests
runAllTests();
