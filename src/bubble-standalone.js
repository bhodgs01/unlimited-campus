// The Ask + Log-a-ticket bubble for pages that are not the 3D campus (the 2D dashboard).
import { mountBubble } from './ui/bubble.js'

// The dashboard's own Lumi button owns the bottom-right corner (64 px, 24 px in), and the bubble
// sat right on top of it (ticket 378). Here it sits beside Lumi on the same row instead, which also
// leaves Lumi's quick-action menu free to open upward.
const style = document.createElement('style')
style.textContent =
  '.cb-fab{right:100px!important;bottom:30px!important}.cb-panel{bottom:92px!important}' +
  // phones: the chat box and Lumi fill the bottom edge, so the bubble goes top-right, under the
  // header, and its panel drops down from there (ticket 391)
  '@media (max-width:640px){.cb-fab{right:12px!important;bottom:auto!important;top:76px!important;width:44px!important;height:44px!important;font-size:19px!important}' +
  '.cb-panel{bottom:auto!important;top:128px!important;right:12px!important;left:12px!important;width:auto!important;max-height:calc(100dvh - 150px)!important}}'
document.head.appendChild(style)

mountBubble()
