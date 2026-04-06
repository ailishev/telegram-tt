const { pathname, hostname, href } = window.location;

function getStorageItemSafely(key) {
  try {
    return window.localStorage ? window.localStorage.getItem(key) : null;
  } catch (e) {
    return null;
  }
}

if (pathname.startsWith('/z')) {
  window.location.href = href.replace('/z', '/a');
}

if (
  (hostname === 'weba.telegram.org' || hostname === 'webz.telegram.org') && !getStorageItemSafely('tt-global-state')
) {
  window.location.href = 'https://web.telegram.org/a';
}
