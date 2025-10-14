// Mobile Wallet Connection Utility
// Handles proper deep linking and post-installation redirect for mobile devices

import { showConnect } from '@stacks/connect';
import { UserSession, AppConfig } from '@stacks/auth';
import { appDetails, STACKS_NETWORK_KEY } from '../config/stacksConfig';

// Mobile detection utility
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// iOS detection
export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

// Android detection
export const isAndroid = (): boolean => {
  return /Android/.test(navigator.userAgent);
};

// Wallet app detection
export const detectWalletApps = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = isMobileDevice();
  
  return {
    isMobile,
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    hasXverse: !!(window as any).XverseProvider || !!(window as any).xverse,
    hasLeather: !!(window as any).LeatherProvider || !!(window as any).leather || !!(window as any).hiro,
    userAgent
  };
};

// Mobile wallet deep linking
export const openWalletApp = (walletType: 'xverse' | 'leather'): Promise<boolean> => {
  return new Promise((resolve) => {
    const deepLinks = {
      xverse: 'xverse://',
      leather: 'leather://'
    };
    
    const appStoreUrls = {
      xverse: {
        ios: 'https://apps.apple.com/app/xverse-bitcoin-wallet/id1552060055',
        android: 'https://play.google.com/store/apps/details?id=com.secretkeylabs.xverse'
      },
      leather: {
        ios: 'https://apps.apple.com/app/leather-stacks-wallet/id1643605783',
        android: 'https://play.google.com/store/apps/details?id=com.leatherwallet.app'
      }
    };
    
    const { isIOS: isIOSDevice, isAndroid: isAndroidDevice } = detectWalletApps();
    
    // Try to open the wallet app
    const deepLink = deepLinks[walletType];
    const appStoreUrl = isIOSDevice ? appStoreUrls[walletType].ios : appStoreUrls[walletType].android;
    
    console.log(`Attempting to open ${walletType} wallet app...`);
    console.log('Deep link:', deepLink);
    console.log('App store URL:', appStoreUrl);
    
    // Create a hidden iframe to attempt deep linking
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = deepLink;
    document.body.appendChild(iframe);
    
    // Set up timeout to detect if app opened
    let appOpened = false;
    const timeout = setTimeout(() => {
      if (!appOpened) {
        console.log('Wallet app not detected, redirecting to app store...');
        window.open(appStoreUrl, '_blank');
        resolve(false);
      }
    }, 2000);
    
    // Listen for page visibility changes (indicates app switch)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        appOpened = true;
        clearTimeout(timeout);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        document.body.removeChild(iframe);
        resolve(true);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up after 5 seconds
    setTimeout(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 5000);
  });
};

// Enhanced mobile wallet connection
export const connectMobileWallet = async (
  userSession: UserSession,
  walletType?: 'xverse' | 'leather'
): Promise<boolean> => {
  const { isMobile, hasXverse, hasLeather } = detectWalletApps();
  
  if (!isMobile) {
    console.log('Not a mobile device, using standard connection');
    return false;
  }
  
  console.log('Mobile device detected, using mobile wallet connection');
  console.log('Available wallets:', { hasXverse, hasLeather });
  
  // If no wallet type specified, try to detect available wallets
  if (!walletType) {
    if (hasXverse) walletType = 'xverse';
    else if (hasLeather) walletType = 'leather';
    else {
      console.log('No wallet apps detected, showing wallet selection');
      return false;
    }
  }
  
  try {
    // If wallet is already available, use standard connection
    if ((walletType === 'xverse' && hasXverse) || (walletType === 'leather' && hasLeather)) {
      console.log(`Using existing ${walletType} wallet connection`);
      return false; // Let standard connection handle it
    }
    
    // Try to open wallet app
    const appOpened = await openWalletApp(walletType);
    
    if (appOpened) {
      console.log('Wallet app opened successfully');
      // Wait a moment for the app to load, then try connection
      setTimeout(() => {
        showConnect({
          userSession,
          appDetails,
          redirectTo: window.location.origin,
          onFinish: () => {
            console.log('Mobile wallet connection completed');
            // Reload the page to ensure proper state
            window.location.reload();
          },
          onCancel: () => {
            console.log('Mobile wallet connection cancelled');
          }
        });
      }, 1000);
      
      return true;
    } else {
      console.log('Wallet app not available, user needs to install it');
      return false;
    }
  } catch (error) {
    console.error('Mobile wallet connection error:', error);
    return false;
  }
};

// Handle post-installation redirect
export const handlePostInstallRedirect = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const walletInstalled = urlParams.get('wallet_installed');
  const walletType = urlParams.get('wallet_type');
  
  if (walletInstalled === 'true' && walletType) {
    console.log(`Wallet ${walletType} was just installed, attempting connection...`);
    
    // Clean up URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('wallet_installed');
    newUrl.searchParams.delete('wallet_type');
    window.history.replaceState({}, '', newUrl.toString());
    
    // Attempt connection after a short delay
    setTimeout(() => {
      const userSession = new UserSession({ appConfig: new AppConfig(['store_write', 'publish_data']) });
      
      showConnect({
        userSession,
        appDetails,
        redirectTo: window.location.origin,
        onFinish: () => {
          console.log('Post-install wallet connection completed');
          window.location.reload();
        },
        onCancel: () => {
          console.log('Post-install wallet connection cancelled');
        }
      });
    }, 2000);
  }
};

// Mobile-specific wallet connection with proper error handling
export const mobileWalletConnect = async (
  userSession: UserSession,
  onSuccess?: (address: string) => void,
  onError?: (error: string) => void
): Promise<void> => {
  const { isMobile, hasXverse, hasLeather } = detectWalletApps();
  
  if (!isMobile) {
    // Use standard connection for desktop
    showConnect({
      userSession,
      appDetails,
      onFinish: () => {
        const userData = userSession.loadUserData();
        const address = (userData as any)?.profile?.stxAddress?.[STACKS_NETWORK_KEY];
        if (address && onSuccess) onSuccess(address);
      },
      onCancel: () => {
        if (onError) onError('Connection cancelled');
      }
    });
    return;
  }
  
  // Mobile-specific connection flow
  try {
    console.log('Starting mobile wallet connection...');
    
    // Check if we have wallet apps available
    if (!hasXverse && !hasLeather) {
      console.log('No wallet apps detected, showing installation guide');
      if (onError) onError('Please install a Stacks wallet app first');
      return;
    }
    
    // Use the first available wallet
    const walletType = hasXverse ? 'xverse' : 'leather';
    console.log(`Using ${walletType} wallet for mobile connection`);
    
    // Attempt mobile connection
    const mobileConnectionUsed = await connectMobileWallet(userSession, walletType);
    
    if (!mobileConnectionUsed) {
      // Fall back to standard connection
      showConnect({
        userSession,
        appDetails,
        redirectTo: window.location.origin,
        onFinish: () => {
          const userData = userSession.loadUserData();
          const address = (userData as any)?.profile?.stxAddress?.[STACKS_NETWORK_KEY];
          if (address && onSuccess) onSuccess(address);
        },
        onCancel: () => {
          if (onError) onError('Connection cancelled');
        }
      });
    }
  } catch (error) {
    console.error('Mobile wallet connection failed:', error);
    if (onError) onError('Mobile wallet connection failed');
  }
};
