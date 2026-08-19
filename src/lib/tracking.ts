/**
 * Universal Multi-Platform Pixel & Analytics Tracking Dispatcher
 * Supports:
 * 1. Facebook Pixel (Meta)
 * 2. TikTok Pixel
 * 3. Google Tag Manager (GTM) / Google Analytics 4
 * 4. Microsoft Clarity
 */

export interface TrackingConfig {
  facebook?: string;
  tiktok?: string;
  gtm?: string;
  clarity?: string;
  ga4?: string;
}

export interface TrackingItem {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  category?: string;
}

// 1. Initialize Tracking Scripts in DOM
export function initTrackingScripts(tracking?: TrackingConfig): () => void {
  if (!tracking) return () => {};

  const cleanupFns: (() => void)[] = [];

  // GTM Container
  if (tracking.gtm && tracking.gtm.trim()) {
    const gtmId = tracking.gtm.trim();
    if (!document.getElementById(`gtm-script-${gtmId}`)) {
      const gtmScript = document.createElement('script');
      gtmScript.id = `gtm-script-${gtmId}`;
      gtmScript.innerHTML = `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${gtmId}');
      `;
      document.head.appendChild(gtmScript);
      cleanupFns.push(() => {
        const el = document.getElementById(`gtm-script-${gtmId}`);
        if (el) el.remove();
      });
    }
  }

  // Facebook Pixel
  if (tracking.facebook && tracking.facebook.trim()) {
    const fbId = tracking.facebook.trim();
    if (!document.getElementById(`fb-pixel-${fbId}`)) {
      const fbScript = document.createElement('script');
      fbScript.id = `fb-pixel-${fbId}`;
      fbScript.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${fbId}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(fbScript);
      cleanupFns.push(() => {
        const el = document.getElementById(`fb-pixel-${fbId}`);
        if (el) el.remove();
      });
    }
  }

  // TikTok Pixel
  if (tracking.tiktok && tracking.tiktok.trim()) {
    const ttId = tracking.tiktok.trim();
    if (!document.getElementById(`tt-pixel-${ttId}`)) {
      const ttScript = document.createElement('script');
      ttScript.id = `tt-pixel-${ttId}`;
      ttScript.innerHTML = `
        !function (w, d, t) {
          w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var o="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=o,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var a=document.createElement("script");a.type="text/javascript",a.async=!0,a.src=o;var c=document.getElementsByTagName("script")[0];c.parentNode.insertBefore(a,c)};
          ttq.load('${ttId}');
          ttq.page();
        }(window, document, 'ttq');
      `;
      document.head.appendChild(ttScript);
      cleanupFns.push(() => {
        const el = document.getElementById(`tt-pixel-${ttId}`);
        if (el) el.remove();
      });
    }
  }

  // Microsoft Clarity
  if (tracking.clarity && tracking.clarity.trim()) {
    const clarityId = tracking.clarity.trim();
    if (!document.getElementById(`clarity-script-${clarityId}`)) {
      const clarityScript = document.createElement('script');
      clarityScript.id = `clarity-script-${clarityId}`;
      clarityScript.innerHTML = `
        (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${clarityId}");
      `;
      document.head.appendChild(clarityScript);
      cleanupFns.push(() => {
        const el = document.getElementById(`clarity-script-${clarityId}`);
        if (el) el.remove();
      });
    }
  }

  return () => {
    cleanupFns.forEach(fn => {
      try { fn(); } catch (e) {}
    });
  };
}

// 2. Track Event Dispatchers

export function trackPageView(title?: string) {
  try {
    const w = window as any;
    if (w.fbq) w.fbq('track', 'PageView');
    if (w.ttq) w.ttq.page();
    if (w.dataLayer) {
      w.dataLayer.push({
        event: 'page_view',
        page_title: title || document.title
      });
    }
    if (typeof w.clarity === 'function') {
      w.clarity('event', 'page_view');
    }
  } catch (e) {
    console.warn('Tracking PageView error:', e);
  }
}

export function trackViewContent(item: TrackingItem, currency: string = 'BDT') {
  try {
    const w = window as any;
    const value = item.price;

    // Facebook
    if (w.fbq) {
      w.fbq('track', 'ViewContent', {
        content_name: item.name,
        content_ids: [item.id],
        content_type: 'product',
        value: value,
        currency: currency
      });
    }

    // TikTok
    if (w.ttq) {
      w.ttq.track('ViewContent', {
        content_id: item.id,
        content_type: 'product',
        content_name: item.name,
        quantity: 1,
        price: item.price,
        value: value,
        currency: currency
      });
    }

    // GTM / GA4
    if (w.dataLayer) {
      w.dataLayer.push({
        event: 'view_item',
        ecommerce: {
          currency: currency,
          value: value,
          items: [{
            item_id: item.id,
            item_name: item.name,
            price: item.price,
            quantity: 1
          }]
        }
      });
    }

    // Microsoft Clarity
    if (typeof w.clarity === 'function') {
      w.clarity('event', 'view_content');
      w.clarity('set', 'viewed_product', item.name);
    }
  } catch (e) {
    console.warn('Tracking ViewContent error:', e);
  }
}

export function trackAddToCart(item: TrackingItem, quantity: number = 1, currency: string = 'BDT') {
  try {
    const w = window as any;
    const totalVal = (item.price || 0) * (quantity || 1);

    // Facebook
    if (w.fbq) {
      w.fbq('track', 'AddToCart', {
        content_name: item.name,
        content_ids: [item.id],
        content_type: 'product',
        value: totalVal,
        currency: currency
      });
    }

    // TikTok
    if (w.ttq) {
      w.ttq.track('AddToCart', {
        content_id: item.id,
        content_type: 'product',
        content_name: item.name,
        quantity: quantity,
        price: item.price,
        value: totalVal,
        currency: currency
      });
    }

    // GTM / GA4
    if (w.dataLayer) {
      w.dataLayer.push({
        event: 'add_to_cart',
        ecommerce: {
          currency: currency,
          value: totalVal,
          items: [{
            item_id: item.id,
            item_name: item.name,
            price: item.price,
            quantity: quantity
          }]
        }
      });
    }

    // Microsoft Clarity
    if (typeof w.clarity === 'function') {
      w.clarity('event', 'add_to_cart');
      w.clarity('set', 'last_added_item', item.name);
    }
  } catch (e) {
    console.warn('Tracking AddToCart error:', e);
  }
}

export function trackInitiateCheckout(items: TrackingItem[], totalValue: number, currency: string = 'BDT') {
  try {
    const w = window as any;

    // Facebook
    if (w.fbq) {
      w.fbq('track', 'InitiateCheckout', {
        content_ids: items.map(i => i.id),
        num_items: items.reduce((acc, i) => acc + (i.quantity || 1), 0),
        value: totalValue,
        currency: currency
      });
    }

    // TikTok
    if (w.ttq) {
      w.ttq.track('InitiateCheckout', {
        contents: items.map(i => ({
          content_id: i.id,
          content_name: i.name,
          quantity: i.quantity || 1,
          price: i.price
        })),
        value: totalValue,
        currency: currency
      });
    }

    // GTM / GA4
    if (w.dataLayer) {
      w.dataLayer.push({
        event: 'begin_checkout',
        ecommerce: {
          currency: currency,
          value: totalValue,
          items: items.map(i => ({
            item_id: i.id,
            item_name: i.name,
            price: i.price,
            quantity: i.quantity || 1
          }))
        }
      });
    }

    // Microsoft Clarity
    if (typeof w.clarity === 'function') {
      w.clarity('event', 'initiate_checkout');
      w.clarity('set', 'checkout_total', totalValue);
    }
  } catch (e) {
    console.warn('Tracking InitiateCheckout error:', e);
  }
}

export function trackPurchase(
  orderId: string,
  items: TrackingItem[],
  totalValue: number,
  currency: string = 'BDT',
  customerInfo?: { name?: string; phone?: string; district?: string }
) {
  try {
    const w = window as any;

    // Facebook Pixel
    if (w.fbq) {
      w.fbq('track', 'Purchase', {
        content_name: items.map(i => i.name).join(', '),
        content_ids: items.map(i => i.id),
        content_type: 'product',
        value: totalValue,
        currency: currency,
        order_id: orderId
      });
    }

    // TikTok Pixel
    if (w.ttq) {
      w.ttq.track('PlaceAnOrder', {
        content_id: orderId,
        value: totalValue,
        currency: currency
      });
      w.ttq.track('CompletePayment', {
        content_id: orderId,
        value: totalValue,
        currency: currency
      });
    }

    // GTM / GA4
    if (w.dataLayer) {
      w.dataLayer.push({
        event: 'purchase',
        ecommerce: {
          transaction_id: orderId,
          value: totalValue,
          currency: currency,
          items: items.map(i => ({
            item_id: i.id,
            item_name: i.name,
            price: i.price,
            quantity: i.quantity || 1
          }))
        }
      });
    }

    // Microsoft Clarity
    if (typeof w.clarity === 'function') {
      w.clarity('event', 'purchase');
      w.clarity('set', 'order_id', orderId);
      w.clarity('set', 'purchase_total', totalValue);
      if (customerInfo?.district) {
        w.clarity('set', 'customer_district', customerInfo.district);
      }
    }
  } catch (e) {
    console.warn('Tracking Purchase error:', e);
  }
}
