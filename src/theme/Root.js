import React, {useEffect} from 'react';

function normalizeLocalePath(pathname) {
  if (!pathname || pathname === '/') {
    return pathname;
  }

  // Collapse repeated locale prefixes such as /zh/zh/docs/... or /en/en/...
  return pathname
    .replace(/^(\/zh)+(?=\/)/, '/zh')
    .replace(/^(\/en)+(?=\/)/, '/en');
}

export default function Root({children}) {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const {pathname, search, hash} = window.location;
    const normalized = normalizeLocalePath(pathname);

    if (normalized !== pathname) {
      window.history.replaceState({}, '', `${normalized}${search}${hash}`);
    }
  }, []);

  return <>{children}</>;
}
