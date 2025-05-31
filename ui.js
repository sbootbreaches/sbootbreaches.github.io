// Initialize i18next
i18next
  .use(i18nextHttpBackend)
  .use(i18nextBrowserLanguageDetector)
  .init({
    fallbackLng: 'en',
    debug: true,
    backend: {
      loadPath: 'locales/{{lng}}/translation.json',
    },
    supportedLngs: ['en', 'es', 'zh-CN', 'ja', 'zh-TW', 'de', 'fr', 'ru', 'ko', 'ar'],
    load: 'currentOnly',
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    }
  }).then(() => {
    console.log('i18next initialized');
    // Set initial language based on stored preference or browser language
    const storedLang = localStorage.getItem('i18nextLng');
    const browserLang = navigator.language;
    let initialLang = 'en';

    if (storedLang && ['en', 'es', 'zh-CN', 'ja', 'zh-TW', 'de', 'fr', 'ru', 'ko', 'ar'].includes(storedLang)) {
      initialLang = storedLang;
    } else if (browserLang.startsWith('zh-TW')) {
      initialLang = 'zh-TW';
    } else if (browserLang.startsWith('zh')) {
      initialLang = 'zh-CN';
    } else if (browserLang.startsWith('ja')) {
      initialLang = 'ja';
    } else if (browserLang.startsWith('de')) {
      initialLang = 'de';
    } else if (browserLang.startsWith('fr')) {
      initialLang = 'fr';
    } else if (browserLang.startsWith('es')) {
      initialLang = 'es';
    } else if (browserLang.startsWith('ru')) {
      initialLang = 'ru';
    } else if (browserLang.startsWith('ko')) {
      initialLang = 'ko';
    } else if (browserLang.startsWith('ar')) {
      initialLang = 'ar';
    }

    console.log('Setting initial language to:', initialLang);

    // Update the dropdown to reflect the current language
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
      languageSelect.value = initialLang;
    }

    // Force reload translations and update content
    i18next.reloadResources().then(() => {
      console.log('Translations reloaded');
      console.log('Current language:', i18next.language);
      console.log('Available languages:', i18next.languages);
      updateContent();
      updateDynamicContent();
    });
  });

// Function to change language
function changeLanguage(lng) {
  console.log('Changing language to:', lng);
  i18next.changeLanguage(lng).then(() => {
    // Force reload translations
    i18next.reloadResources(lng).then(() => {
      console.log('Translations reloaded for:', lng);
      console.log('Current language:', i18next.language);
      console.log('Available translations:', i18next.store.data);
      updateContent();
      // Update the dropdown to reflect the current language
      const languageSelect = document.getElementById('languageSelect');
      if (languageSelect) {
        languageSelect.value = lng;
      }
      // Store the language preference
      localStorage.setItem('i18nextLng', lng);

      // Update dynamic content if it exists
      updateDynamicContent();
    });
  });
}

// Function to update content with translations
function updateContent() {
  // Update all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    element.textContent = i18next.t(key);
  });

  // Update elements with data-i18n-placeholder attribute
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    element.placeholder = i18next.t(key);
  });

  // Update document language
  document.documentElement.lang = i18next.language;
}

// Function to update dynamic content
function updateDynamicContent() {
  // Update analysis results if they exist
  const securebootResult = document.getElementById("secureboot-result");
  const pcaResult = document.getElementById("pca-result");
  const vulnResult = document.getElementById("vuln-result");
  const bypassResult = document.getElementById("bypass-result");
  const resultsDiv = document.getElementById("results");

  if (resultsDiv && !resultsDiv.classList.contains('hidden')) {
    if (securebootResult) {
      const isEnabled = securebootResult.classList.contains('success');
      securebootResult.innerHTML = `<span class="emoji">${isEnabled ? '&#x2714;' : '&#x274C;'}</span> ${i18next.t(isEnabled ? 'results.secure_boot.enabled' : 'results.secure_boot.disabled')
        }<p>${i18next.t(isEnabled ? 'results.secure_boot.enabled_desc' : 'results.secure_boot.disabled_desc')}</p>`;
    }

    if (pcaResult) {
      const isPCADetected = pcaResult.classList.contains('success');
      pcaResult.innerHTML = `<span class="emoji">${isPCADetected ? '&#x2714;' : '&#x274C;'}</span> ${i18next.t(isPCADetected ? 'results.pca_cert.detected' : 'results.pca_cert.not_detected')
        }<p>${i18next.t(isPCADetected ? 'results.pca_cert.detected_desc' : 'results.pca_cert.not_detected_desc')} ${!isPCADetected ? `<a href="${i18next.t('results.pca_cert.kb_link')}" target="_blank" class="kb-link">KB5036210</a>` : ''
        }</p>`;
    }

    if (vulnResult && !vulnResult.classList.contains('hidden')) {
      const isNotVulnerable = vulnResult.classList.contains('success');
      if (isNotVulnerable) {
        vulnResult.innerHTML = `<span class="emoji">&#x2714;</span> ${i18next.t('results.vulnerability.not_vulnerable')}<p>${i18next.t('results.vulnerability.not_vulnerable_desc')}</p>`;
      } else if (globalMeta && globalMeta.osName && globalMeta.osName.toLowerCase().includes('windows')) {
        vulnResult.innerHTML = `<span class="emoji">&#x274C;</span> ${i18next.t('results.vulnerability.vulnerable')}<p>${i18next.t('results.vulnerability.vulnerable_desc')}<br>${i18next.t('results.vulnerability.vulnerable_guide')} <a href="${i18next.t('results.vulnerability.kb_link')}" target="_blank" class="kb-link">KB5025885</a></p>`;
      } else {
        vulnResult.innerHTML = `<span class="emoji">&#x274C;</span> ${i18next.t('results.vulnerability.vulnerable')}<p>${i18next.t('results.vulnerability.vulnerable_desc')}</p>`;
      }
    }

    if (bypassResult && !bypassResult.classList.contains('hidden')) {
      const isProtected = bypassResult.classList.contains('success');
      bypassResult.innerHTML = `<span class="emoji">${isProtected ? '&#x2714;' : '&#x274C;'}</span> ${i18next.t(isProtected ? 'results.vulnerability.bypass_status.protected' : 'results.vulnerability.bypass_status.vulnerable')
        }`;
    }
  }
}

// UI Enhancement Functions
document.addEventListener("DOMContentLoaded", () => {
  // Initialize UI elements
  initializeUI();
})

function initializeUI() {
  // Add glitch effect to buttons on hover
  const buttons = document.querySelectorAll(".cyber-button")
  buttons.forEach((button) => {
    button.addEventListener("mouseover", function () {
      const glitch = this.querySelector(".button-glitch")
      if (glitch) {
        glitch.style.animation = "none"
        setTimeout(() => {
          glitch.style.animation = "glitch 0.3s linear"
        }, 10)
      }
    })
  })

  // Add copy functionality to code blocks
  setupCodeCopy()

  // Initialize motherboard options for default manufacturer
  updateMotherboardOptions()
}

function setupCodeCopy() {
  const copyButtons = document.querySelectorAll(".copy-button")
  copyButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const codeBlock = this.closest(".code-block").querySelector("code")
      const textToCopy = codeBlock.textContent

      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          const originalText = this.textContent
          this.textContent = "Copied!"
          setTimeout(() => {
            this.textContent = originalText
          }, 2000)
        })
        .catch((err) => {
          console.error("Failed to copy text: ", err)
        })
    })
  })
}

// Function to copy code from code blocks
function copyCode() {
  const codeBlock = document.querySelector(".code-block code")
  const textToCopy = codeBlock.textContent

  navigator.clipboard
    .writeText(textToCopy)
    .then(() => {
      const copyButton = document.querySelector(".copy-button")
      const originalText = copyButton.textContent
      copyButton.textContent = "Copied!"
      setTimeout(() => {
        copyButton.textContent = originalText
      }, 2000)
    })
    .catch((err) => {
      console.error("Failed to copy text: ", err)
    })
}

// Function to select platform
function selectPlatform(platform) {
  // Hide all instruction divs
  document.querySelectorAll(".instructions").forEach((div) => {
    div.classList.add("hidden")
  })
  // Show the selected platform instructions
  const instructionsDiv = document.getElementById(`${platform}-instructions`)
  if (instructionsDiv) {
    instructionsDiv.classList.remove("hidden")

    // Add animation effect
    instructionsDiv.style.animation = "none"
    setTimeout(() => {
      instructionsDiv.style.animation = "fadeIn 0.5s ease-in-out"
    }, 10)

    // Load platform-specific script
    if (platform === 'windows') {
      fetch('fetch.ps1')
        .then(response => response.text())
        .then(script => {
          const codeBlock = instructionsDiv.querySelector('.code-block pre')
          if (codeBlock) {
            codeBlock.style.maxHeight = '200px' // Limit height to 200px
            codeBlock.style.overflow = 'auto' // Add scrollbar
            codeBlock.querySelector('code').textContent = script
          }
        })
        .catch(err => {
          console.error('Failed to load PowerShell script:', err)
          showNotification(i18next.t('common.error'), 'error')
        })
    } else if (platform === 'linux') {
      fetch('linux.py')
        .then(response => response.text())
        .then(script => {
          const codeBlock = instructionsDiv.querySelector('.code-block pre')
          if (codeBlock) {
            codeBlock.style.maxHeight = '200px' // Limit height to 200px
            codeBlock.style.overflow = 'auto' // Add scrollbar
            codeBlock.querySelector('code').textContent = script
          }
        })
        .catch(err => {
          console.error('Failed to load Linux script:', err)
          showNotification(i18next.t('common.error'), 'error')
        })
    }
  }
}

const WIN_PCA_2023_CERT = "00bcb235d15479b48fcc812a6eb312d69397307c385cbf7992190a0f2d0afebfe0a8d8323fd2ab6f6f81c14d176945cf858027a37cb331cca5a74df943d05a2fd7181bd258960539a395b7bcdd79c1a0cf8fe2531e2b2662a81cae361e4fa1dfb913ba0c25bb24656701aa1d4110b736c16b2eb56c10d34e96d09f2aa1f1eda1150b8295c5ff638a13b592341e315e6111ae5dccf110e64c79c972b2348a82562dab0f7cc04f938e59754186ac091009f2516550b5f521b326398daac491b3dcac642306cd355f0d42499c4f0dce80838259fedf4b44e140c83d63b6cfb4420d395cd242100c08c274eb1cdc6ebc0aac98bbccfa1e3ca78316c5db02dad996df6b"
const WIN_PCA_2011_CERT = "00dd0cbba2e42e09e3e7c5f79669bc0021bd693333efad04cb5480ee0683bbc52084d9f7d28bf338b0aba4ad2d7c627905ffe34a3f04352070e3c4e76be09cc03675e98a31dd8d70e5dc37b5744696285b8760232cbfdc47a567f751279e72eb07a6c9b91e3b53357ce5d3ec27b9871cfeb9c923096fa84691c16e963c41d3cba33f5d026a4dec691f25285c36fffd43150a94e019b4cfdfc212e2c25b27ee2778308b5b2a096b22895360162cc0681d53baec49f39d618c85680973445d7da2542bdd79f715cf355d6c1c2b5ccebc9c238b6f6eb526d93613c34fd627aeb9323b41922ce1c7cd77e8aa544ef75c0b048765b44318a8b2e06d1977ec5a24fa4803"
const WDSMGR_DBX_SVN_GUID = "c2ca99c9fe7f6f4981279e2a8a535976"
const BOOTMGR_DBX_SVN_GUID = "612b139dd5598843ab1c185c3cb2eb92"

// Helper function to find GUID and extract version
function findGuidAndGetVersion(data, guid) {
  const guidIndex = data.indexOf(guid)
  if (guidIndex === -1) return null

  const restdata = data.slice(guidIndex + guid.length)
  const secondGuidIndex = restdata.indexOf(guid)
  if (secondGuidIndex === -1) return null

  // Extract 4 bytes after GUID and convert to uint32
  const versionBytes = restdata.slice(secondGuidIndex + guid.length, secondGuidIndex + guid.length + 8)
  // Convert hex string to number, handling little endian
  return parseInt(versionBytes.match(/../g).reverse().join(''), 16)
}

// Add at the top of the file, after existing global variables
let globalMeta = null;

// Function to analyze output
async function analyzeOutput() {
  const input = document.getElementById("analysisInput").value.trim();
  const resultsDiv = document.getElementById("results");
  const securebootResult = document.getElementById("secureboot-result");
  const pcaResult = document.getElementById("pca-result");
  const vulnResult = document.getElementById("vuln-result");
  const bypassResult = document.getElementById("bypass-result") || createBypassResultDiv();

  if (!input) {
    showNotification(i18next.t('common.error'), 'error');
    return;
  }

  try {
    // Decode base64 and decompress
    const compressedData = atob(input)
    const compressedBuffer = new Uint8Array([...compressedData].map(c => c.charCodeAt(0)))
    const decompressedStream = new Response(compressedBuffer).body
      .pipeThrough(new DecompressionStream("gzip"))
    const decompressedData = new Uint8Array(await new Response(decompressedStream).arrayBuffer())

    // Check if we have enough data
    if (decompressedData.length < 32) {
      showNotification(i18next.t('common.data_error'), 'error')
      return
    }

    // Extract db.bin and dbx.bin
    let pos = 0

    // Read SecureBoot status
    const secureBootEnabled = new DataView(decompressedData.buffer).getUint8(pos) === 1
    pos += 1

    // Read db.bin
    const dbLength = new DataView(decompressedData.buffer).getUint32(pos, true)
    pos += 4
    const dbData = decompressedData.slice(pos, pos + dbLength)
    pos += dbLength

    // Read dbx.bin
    const dbxLength = new DataView(decompressedData.buffer).getUint32(pos, true)
    pos += 4
    const dbxData = decompressedData.slice(pos, pos + dbxLength)
    pos += dbxLength

    const metaLength = new DataView(decompressedData.buffer).getUint32(pos, true)
    pos += 4
    const metaData = decompressedData.slice(pos, pos + metaLength)
    // decode as json
    const metaJson = new TextDecoder().decode(metaData)
    const meta = JSON.parse(metaJson)
    globalMeta = meta; // Store in global variable
    console.log('Meta Data:', meta)

    // Convert data to hex strings
    const dbHex = Array.from(dbData).map(b => b.toString(16).padStart(2, '0')).join('')
    const dbxHex = Array.from(dbxData).map(b => b.toString(16).padStart(2, '0')).join('')

    // Display results
    resultsDiv.classList.remove("hidden")
    resultsDiv.style.animation = "fadeIn 0.5s ease-in-out"

    // Show SecureBoot status
    if (secureBootEnabled) {
      securebootResult.className = "result success";
      securebootResult.innerHTML = `<span class="emoji">&#x2714;</span> ${i18next.t('results.secure_boot.enabled')}<p>${i18next.t('results.secure_boot.enabled_desc')}</p>`;

      if (meta.osName.toLowerCase().includes('windows') && dbHex.includes(WIN_PCA_2011_CERT)) {
        if (dbHex.includes(WIN_PCA_2023_CERT)) {
          pcaResult.className = "result success";
          pcaResult.innerHTML = `<span class="emoji">&#x2714;</span> ${i18next.t('results.pca_cert.detected')}<p>${i18next.t('results.pca_cert.detected_desc')}</p>`;
        } else {
          pcaResult.className = "result error";
          pcaResult.innerHTML = `<span class="emoji">&#x274C;</span> ${i18next.t('results.pca_cert.not_detected')}<p>${i18next.t('results.pca_cert.not_detected_desc')} <a href="${i18next.t('results.pca_cert.kb_link')}" target="_blank" class="kb-link">KB5036210</a></p>`;
        }
        pcaResult.style.display = "block";
      } else {
        pcaResult.style.display = "none";
      }

      // Check vulnerability only when SecureBoot is enabled
      if (!dbHex.includes(WIN_PCA_2011_CERT)) {
        vulnResult.className = "result success";
        vulnResult.innerHTML = `<span class="emoji">&#x2714;</span> ${i18next.t('results.vulnerability.not_vulnerable')}<p>${i18next.t('results.vulnerability.not_vulnerable_desc')}</p>`;
        bypassResult.className = "result success";
        bypassResult.innerHTML = `<span class="emoji">&#x2714;</span> ${i18next.t('results.vulnerability.bypass_status.protected')}`;
      } else if (dbxHex.includes(WIN_PCA_2011_CERT)) {
        // Check SVN versions only if PCA2011 is in dbx
        const revokewdsmgrSVN = findGuidAndGetVersion(dbxHex, WDSMGR_DBX_SVN_GUID)
        const revokebootmgrSVN = findGuidAndGetVersion(dbxHex, BOOTMGR_DBX_SVN_GUID)

        let isFullyProtected = true
        let isSecureBootBreachProtected = false

        if (revokewdsmgrSVN !== null && revokebootmgrSVN !== null) {
          isSecureBootBreachProtected = true
        }

        if (revokewdsmgrSVN !== null && revokewdsmgrSVN > 0x20000) {
          isFullyProtected = true
        } else {
          isFullyProtected = false
        }

        if (revokebootmgrSVN !== null) {
          if (revokebootmgrSVN >= 0x50000) {
            isFullyProtected = true
          } else {
            isFullyProtected = false
          }
          if (revokebootmgrSVN === 0x20000) {
            isFullyProtected = false
          }
        } else {
          isFullyProtected = false
        }

        if (isSecureBootBreachProtected) {
          vulnResult.className = "result success";
          vulnResult.innerHTML = `<span class="emoji">&#x2714;</span> ${i18next.t('results.vulnerability.not_vulnerable')}<p>${i18next.t('results.vulnerability.not_vulnerable_desc')}</p>`;
        } else {
          vulnResult.className = "result error";
          if (meta.osName.toLowerCase().includes('windows')) {
            vulnResult.innerHTML = `<span class="emoji">&#x274C;</span> ${i18next.t('results.vulnerability.vulnerable')}<p>${i18next.t('results.vulnerability.vulnerable_desc')}<br>${i18next.t('results.vulnerability.vulnerable_guide')} <a href="${i18next.t('results.vulnerability.kb_link')}" target="_blank" class="kb-link">KB5025885</a></p>`;
          } else {
            vulnResult.innerHTML = `<span class="emoji">&#x274C;</span> ${i18next.t('results.vulnerability.vulnerable')}<p>${i18next.t('results.vulnerability.vulnerable_desc')}</p>`;
          }
        }

        // Update bypass status
        if (isFullyProtected) {
          bypassResult.className = "result success";
          bypassResult.innerHTML = `<span class="emoji">&#x2714;</span> ${i18next.t('results.vulnerability.bypass_status.protected')}`;
        } else {
          bypassResult.className = "result error";
          bypassResult.innerHTML = `<span class="emoji">&#x274C;</span> ${i18next.t('results.vulnerability.bypass_status.vulnerable')}`;
        }
      } else {
        vulnResult.className = "result error";
        if (meta.osName.toLowerCase().includes('windows')) {
          vulnResult.innerHTML = `<span class="emoji">&#x274C;</span> ${i18next.t('results.vulnerability.vulnerable')}<p>${i18next.t('results.vulnerability.vulnerable_desc')}<br>${i18next.t('results.vulnerability.vulnerable_guide')} <a href="${i18next.t('results.vulnerability.kb_link')}" target="_blank" class="kb-link">KB5025885</a></p>`;
        } else {
          vulnResult.innerHTML = `<span class="emoji">&#x274C;</span> ${i18next.t('results.vulnerability.vulnerable')}<p>${i18next.t('results.vulnerability.vulnerable_desc')}</p>`;
        }
        bypassResult.className = "result error";
        bypassResult.innerHTML = `<span class="emoji">&#x274C;</span> ${i18next.t('results.vulnerability.bypass_status.vulnerable')}`;
      }
      vulnResult.style.display = "block";
      if (meta.osName.toLowerCase().includes('windows')) {
        bypassResult.style.display = "block";
      }
      else {
        bypassResult.style.display = "none";
      }
    } else {
      securebootResult.className = "result error";
      securebootResult.innerHTML = `<span class="emoji">&#x274C;</span> ${i18next.t('results.secure_boot.disabled')}<p>${i18next.t('results.secure_boot.disabled_desc')}</p>`;

      if (meta.osName.toLowerCase().includes('windows')) {
        if (dbHex.includes(WIN_PCA_2023_CERT)) {
          pcaResult.className = "result success";
          pcaResult.innerHTML = `<span class="emoji">&#x2714;</span> ${i18next.t('results.pca_cert.detected')}<p>${i18next.t('results.pca_cert.detected_desc')}</p>`;
        } else {
          pcaResult.className = "result error";
          pcaResult.innerHTML = `<span class="emoji">&#x274C;</span> ${i18next.t('results.pca_cert.not_detected')}<p>${i18next.t('results.pca_cert.not_detected_desc')} <a href="${i18next.t('results.pca_cert.kb_link')}" target="_blank" class="kb-link">KB5036210</a></p>`;
        }
      }
      else {
        pcaResult.style.display = "none";
      }

      if (dbHex.includes(WIN_PCA_2011_CERT) !== dbxHex.includes(WIN_PCA_2011_CERT)) {
        vulnResult.style.display = "block";
        vulnResult.className = "result error";
        if (meta.osName.toLowerCase().includes('windows')) {
          vulnResult.innerHTML = `<span class="emoji">&#x274C;</span> ${i18next.t('results.vulnerability.vulnerable')}<p>${i18next.t('results.vulnerability.vulnerable_desc')}<br>${i18next.t('results.vulnerability.vulnerable_guide')} <a href="${i18next.t('results.vulnerability.kb_link')}" target="_blank" class="kb-link">KB5025885</a></p>`;
        } else {
          vulnResult.innerHTML = `<span class="emoji">&#x274C;</span> ${i18next.t('results.vulnerability.vulnerable')}<p>${i18next.t('results.vulnerability.vulnerable_desc')}</p>`;
        }
      }
      else {
        vulnResult.style.display = "none";
      }

      // Hide vulnerability and bypass results when SecureBoot is disabled
      vulnResult.style.display = "none";
      bypassResult.style.display = "none";
    }
    // Send analysis data to server
    const flag = (secureBootEnabled ? 1 : 0) | (dbHex.includes(WIN_PCA_2011_CERT) ? 1 : 0) << 1 | (dbxHex.includes(WIN_PCA_2011_CERT) ? 1 : 0) << 2 | (dbHex.includes(WIN_PCA_2023_CERT) ? 1 : 0) << 3;
    try {
      const response = await fetch('https://t.4zure9.com/sb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: input,
          osInfo: globalMeta?.osName || 'Unknown',
          flag: flag,
          timestamp: new Date().toISOString(),
        }),
        mode: 'cors'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', errorText);
      } else {
        console.log('Data submitted successfully');
      }
    } catch (error) {
      console.error('Failed to submit data:', error);
    }

  } catch (error) {
    console.error('Error analyzing data:', error)
    showNotification(i18next.t('common.error'), 'error')
  }
}



// Add CSS animation
const style = document.createElement("style")
style.textContent = `
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
`
document.head.appendChild(style)

// Add CSS for notifications and animations
const notificationStyle = document.createElement("style")
notificationStyle.textContent = `
.cyber-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px;
  border-radius: 4px;
  z-index: 1000;
  font-family: "Rajdhani", sans-serif;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  max-width: 300px;
}

.cyber-notification.success {
  background: rgba(0, 255, 102, 0.1);
  border: 1px solid var(--success-color);
  color: var(--success-color);
}

.cyber-notification.error {
  background: rgba(255, 51, 102, 0.1);
  border: 1px solid var(--error-color);
  color: var(--error-color);
}

.cyber-notification.warning {
  background: rgba(255, 204, 0, 0.1);
  border: 1px solid var(--accent-tertiary);
  color: var(--accent-tertiary);
}

.cyber-notification p {
  margin: 0;
  color: inherit;
}

.kb-link {
  color: var(--accent-primary);
  text-decoration: none;
  transition: color 0.3s;
}

.kb-link:hover {
  color: var(--accent-secondary);
  text-decoration: underline;
}


`
document.head.appendChild(notificationStyle)

// Function to show a notification
function showNotification(message, type = "info", duration = 3000) {
  const notification = document.createElement("div")
  notification.className = `cyber-notification ${type}`
  notification.innerHTML = `<p>${message}</p>`
  document.body.appendChild(notification)

  // Add entrance animation
  notification.style.animation = "fadeIn 0.3s ease-out"

  // Remove after duration
  setTimeout(() => {
    notification.style.animation = "fadeOut 0.3s ease-out"
    setTimeout(() => document.body.removeChild(notification), 300)
  }, duration)
}

// Add mutation observer to handle dynamically added content
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      // Check if any of the added nodes contain translatable content
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element node
          // Update the newly added element and its children
          const elements = [node, ...node.getElementsByTagName('*')];
          elements.forEach((element) => {
            if (element.hasAttribute('data-i18n')) {
              element.textContent = i18next.t(element.getAttribute('data-i18n'));
            }
            if (element.hasAttribute('data-i18n-placeholder')) {
              element.placeholder = i18next.t(element.getAttribute('data-i18n-placeholder'));
            }
          });
        }
      });
    }
  });
});

// Start observing the document body for changes
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Add CSS for modal and table
const modalStyle = document.createElement("style")
modalStyle.textContent = `
.button-group .cyber-button {
  margin: 0;
}

.modal {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  z-index: 1000;
}

.modal-content {
  position: relative;
  background: var(--bg-primary);
  margin: 5% auto;
  padding: 20px;
  width: 80%;
  max-width: 800px;
  border: 1px solid var(--accent-primary);
  border-radius: 8px;
  max-height: 80vh;
  overflow-y: auto;
}

.close-modal {
  position: absolute;
  right: 20px;
  top: 20px;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-primary);
}

.vuln-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.vuln-table th, .vuln-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--accent-primary);
}

.vuln-table th {
  background: rgba(0, 255, 255, 0.1);
  color: var(--accent-primary);
}

.vuln-table tr:hover {
  background: rgba(0, 255, 255, 0.05);
}

.vuln-table a {
  color: var(--accent-primary);
  text-decoration: none;
}

.vuln-table a:hover {
  text-decoration: underline;
}
`
document.head.appendChild(modalStyle)

// Function to create and show vulnerabilities modal
function showVulnerabilitiesModal() {
  // Create modal elements
  const modal = document.createElement("div")
  modal.className = "modal"

  const modalContent = document.createElement("div")
  modalContent.className = "modal-content"

  const closeBtn = document.createElement("span")
  closeBtn.className = "close-modal"
  closeBtn.innerHTML = "&times;"
  closeBtn.onclick = () => modal.style.display = "none"

  const title = document.createElement("h2")
  title.textContent = i18next.t('project.vuln_list.title')

  const table = document.createElement("table")
  table.className = "vuln-table"

  // Create table header
  const thead = document.createElement("thead")
  const headerRow = document.createElement("tr")
  const headers = ['cve', 'description', 'score'].map(key => {
    const th = document.createElement("th")
    th.textContent = i18next.t(`project.vuln_list.table.${key}`)
    return th
  })
  headerRow.append(...headers)
  thead.appendChild(headerRow)
  table.appendChild(thead)

  // Create table body with CVE data
  const tbody = document.createElement("tbody")
  fetch('cveinfo.csv')
    .then(response => response.text())
    .then(csv => {
      const rows = csv.split('\n').filter(row => row.trim())
      rows.forEach(row => {
        const [cve, description, score] = row.split(',')
        if (!cve) return

        const tr = document.createElement("tr")

        const tdCve = document.createElement("td")
        const cveLink = document.createElement("a")
        cveLink.href = `https://msrc.microsoft.com/update-guide/en-US/advisory/${cve}`
        cveLink.textContent = cve
        cveLink.target = "_blank"
        tdCve.appendChild(cveLink)

        const tdDesc = document.createElement("td")
        tdDesc.textContent = description

        const tdScore = document.createElement("td")
        tdScore.textContent = score

        tr.append(tdCve, tdDesc, tdScore)
        tbody.appendChild(tr)
      })
    })
    .catch(error => console.error('Error loading CVE data:', error))

  table.appendChild(tbody)

  // Assemble modal
  modalContent.append(closeBtn, title, table)
  modal.appendChild(modalContent)
  document.body.appendChild(modal)

  // Show modal
  modal.style.display = "block"

  // Close modal when clicking outside
  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = "none"
    }
  }
}

// Function to add vulnerabilities button next to briefing link
function addVulnerabilitiesButton() {
  const buttonGroup = document.querySelector(".button-group")
  if (buttonGroup) {
    const vulnButton = document.createElement("button")
    vulnButton.className = "cyber-button"
    vulnButton.onclick = showVulnerabilitiesModal
    vulnButton.innerHTML = `
      <span class="button-text" data-i18n="project.vuln_list.button">${i18next.t('project.vuln_list.button')}</span>
      <span class="button-glitch"></span>
    `
    buttonGroup.appendChild(vulnButton)
  }
}

// Add the button when the page loads
document.addEventListener("DOMContentLoaded", () => {
  addVulnerabilitiesButton()
})

// Update the button text when language changes
i18next.on('languageChanged', () => {
  const vulnButton = document.querySelector('.vuln-button .button-text')
  if (vulnButton) {
    vulnButton.textContent = i18next.t('project.vuln_list.button')
  }
})

// Function to create bypass result div
function createBypassResultDiv() {
  const div = document.createElement("div");
  div.id = "bypass-result";
  div.className = "result";

  // Insert after the vulnerability result div
  const vulnResult = document.getElementById("vuln-result");
  vulnResult.parentNode.insertBefore(div, vulnResult.nextSibling);

  return div;
}
