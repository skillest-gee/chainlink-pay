// utils/walletDetection.ts
export const detectWalletInstalled = (deepLink: string, timeout = 2000): Promise<boolean> => {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.src = deepLink;
    iframe.style.display = 'none';
    
    let timer: NodeJS.Timeout;
    
    const cleanup = () => {
      window.removeEventListener('blur', onBlur);
      clearTimeout(timer);
      document.body.removeChild(iframe);
    };
    
    const onBlur = () => {
      cleanup();
      resolve(true);
    };
    
    const onTimeout = () => {
      cleanup();
      resolve(false);
    };
    
    window.addEventListener('blur', onBlur);
    timer = setTimeout(onTimeout, timeout);
    
    document.body.appendChild(iframe);
  });
};

export const detectDeviceType = (): 'ios' | 'android' | 'desktop' => {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios';
  } else if (/android/.test(userAgent)) {
    return 'android';
  } else {
    return 'desktop';
  }
};

export const getWalletStoreUrl = (walletId: string, deviceType: 'ios' | 'android' | 'desktop'): string => {
  const walletUrls = {
    xverse: {
      ios: 'https://apps.apple.com/app/xverse-bitcoin-wallet/id1552060055',
      android: 'https://play.google.com/store/apps/details?id=com.secretkeylabs.xverse'
    },
    leather: {
      ios: 'https://apps.apple.com/app/leather-stacks-wallet/id1643605783',
      android: 'https://play.google.com/store/apps/details?id=com.leatherwallet.app'
    },
    unisat: {
      ios: 'https://apps.apple.com/app/unisat-wallet/id1635447349',
      android: 'https://play.google.com/store/apps/details?id=io.unisat.app'
    },
    okx: {
      ios: 'https://apps.apple.com/app/okx-buy-bitcoin-eth-crypto/id1327268470',
      android: 'https://play.google.com/store/apps/details?id=com.okinc.okex.gp'
    }
  };

  if (deviceType === 'desktop') {
    // For desktop, default to iOS store
    return walletUrls[walletId as keyof typeof walletUrls]?.ios || '';
  }

  return walletUrls[walletId as keyof typeof walletUrls]?.[deviceType] || '';
};
