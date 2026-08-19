import React from 'react';
import { Smartphone } from 'lucide-react';

interface BrandIconProps {
  platform: string;
  size?: number; // Size of the SVG icon itself
  variant?: 'badge' | 'raw'; // 'badge' wraps in rounded brand background container
  badgeSizeClass?: string; // Tailwind class for container e.g. "w-10 h-10 rounded-2xl"
}

export const BrandSvgIcon: React.FC<BrandIconProps> = ({
  platform,
  size = 20,
  variant = 'badge',
  badgeSizeClass
}) => {
  const rawP = (platform || '').toLowerCase().trim();

  // Normalize platform string
  let p = rawP;
  if (rawP.includes('wechat')) p = 'wechat';
  else if (rawP.includes('line')) p = 'line';
  else if (rawP.includes('viber')) p = 'viber';
  else if (rawP.includes('telegram') || rawP === 'tg') p = 'telegram';
  else if (rawP.includes('whatsapp') || rawP === 'wa') p = 'whatsapp';
  else if (rawP.includes('messenger') || rawP === 'msg') p = 'messenger';
  else if (rawP.includes('facebook') || rawP === 'fb') p = 'facebook';
  else if (rawP.includes('instagram') || rawP === 'ig') p = 'instagram';
  else if (rawP.includes('tiktok')) p = 'tiktok';
  else if (rawP.includes('landing') || rawP.includes('lp')) p = 'landing_page';
  else if (rawP.includes('website') || rawP.includes('site') || rawP.includes('web')) p = 'website';
  else if (rawP.includes('dragon') || rawP.includes('doel') || rawP.includes('ai') || rawP.includes('bot')) p = 'dragonbot';
  else if (rawP === 'all' || rawP === 'all_orders') p = 'all';
  else if (rawP.includes('sent')) p = 'sent';
  else if (rawP.includes('received') || rawP.includes('rcvd')) p = 'received';
  else if (rawP.includes('fraud')) p = 'fraud';
  else if (rawP.includes('logistics') || rawP.includes('courier')) p = 'courier';
  else if (rawP.includes('report') || rawP.includes('detailed')) p = 'detailed_reports';

  // SVG paths for each brand
  const renderSvg = () => {
    switch (p) {
      case 'wechat':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} className={variant === 'raw' ? "fill-[#07C160] shrink-0" : "fill-white shrink-0"}>
            <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.291.295a.326.326 0 0 0 .167-.05l1.908-1.099a.69.69 0 0 1 .581-.061c.882.242 1.816.37 2.775.37.307 0 .61-.016.908-.042a5.72 5.72 0 0 1-.225-1.583c0-3.662 3.435-6.632 7.674-6.632.42 0 .83.033 1.233.092C17.525 5.07 13.512 2.188 8.691 2.188zm-2.45 3.978c.552 0 1 .448 1 1s-.448 1-1 1-1-.448-1-1 .448-1 1-1zm4.9 0c.552 0 1 .448 1 1s-.448 1-1 1-1-.448-1-1 .448-1 1-1zm6.98 4.387c-3.555 0-6.437 2.379-6.437 5.313 0 1.633.882 3.1 2.257 4.093.125.09.183.243.149.392l-.301 1.144a.22.22 0 0 0 .036.195.225.225 0 0 0 .181.085c.04 0 .081-.01.118-.031l1.472-.848a.53.53 0 0 1 .447-.047c.66.182 1.359.28 2.078.28 3.555 0 6.437-2.379 6.437-5.313 0-2.934-2.882-5.313-6.437-5.313zm-1.84 3.125c.414 0 .75.336.75.75s-.336.75-.75.75-.75-.336-.75-.75.336-.75.75-.75zm3.68 0c.414 0 .75.336.75.75s-.336.75-.75.75-.75-.336-.75-.75.336-.75.75-.75z"/>
          </svg>
        );

      case 'line':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} className={variant === 'raw' ? "fill-[#06C755] shrink-0" : "fill-white shrink-0"}>
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63h-1.686v1.284h1.686c.349 0 .63.283.63.63 0 .346-.281.629-.63.629h-2.316c-.349 0-.63-.283-.63-.629V8.583c0-.347.281-.63.63-.63h2.316c.349 0 .63.283.63.63 0 .346-.281.63-.63.63h-1.686v1.283h1.686zm-4.632 3.173a.627.627 0 0 1-.63-.629V9.213l-1.848 3.513c-.097.18-.285.294-.488.294-.012 0-.024 0-.036-.001a.56.56 0 0 1-.456-.293l-1.85-3.514v3.208c0 .346-.281.629-.63.629a.627.627 0 0 1-.63-.629V8.583c0-.214.108-.413.288-.528a.633.633 0 0 1 .687.031l2.122 4.032 2.122-4.032a.633.633 0 0 1 .687-.031c.18.115.288.314.288.528v4.453c0 .346-.281.629-.63.629zm-7.616 0a.627.627 0 0 1-.63-.629V8.583c0-.347.282-.63.63-.63s.63.283.63.63v3.824a.627.627 0 0 1-.63.629zm-2.88 0h-.63a.627.627 0 0 1-.63-.629V8.583c0-.347.282-.63.63-.63s.63.283.63.63v4.453c0 .346-.282.629-.63.629zM24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.084.922.258 1.057.592.122.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967C23.068 14.547 24 12.545 24 10.314z"/>
          </svg>
        );

      case 'viber':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} className={variant === 'raw' ? "fill-[#7360F2] shrink-0" : "fill-white shrink-0"}>
            <path d="M19.382 1.838C17.65.657 14.86 0 12.016 0 9.172 0 6.381.657 4.649 1.838 2.215 3.5 1.1 6.136 1.002 9.471c-.085 2.879.623 5.483 2.053 7.534-.149.805-.483 2.115-1.196 3.666-.219.476.241.97.712.791 2.012-.767 3.59-1.282 4.382-1.468 1.562.593 3.255.918 5.063.918 2.844 0 5.635-.657 7.367-1.838 2.434-1.662 3.549-4.298 3.647-7.633.098-3.335-1.017-5.971-3.648-7.633zm-2.023 11.233c-.198.347-1.222.957-1.61.996-.388.038-.857.067-2.613-.679-1.757-.746-3.078-2.09-3.83-3.832-.752-1.742-.71-2.222-.672-2.61.039-.388.649-1.412.996-1.61.347-.198.711-.141.93.072.22.213.722 1.144.786 1.281.065.137.098.298.006.476-.092.178-.231.332-.383.483-.152.151-.321.32-.138.634.183.314.814 1.34 1.897 2.305 1.389 1.237 2.378 1.488 2.692 1.671.314.183.483.014.634-.138.151-.152.305-.291.483-.383.178-.092.339-.059.476.006.137.064 1.068.566 1.281.786.213.22.27.583.072.93z"/>
          </svg>
        );

      case 'telegram':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} className={variant === 'raw' ? "fill-[#0088cc] shrink-0" : "fill-white shrink-0"}>
            <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.501 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.14.121.098.155.231.17.324.015.093.033.304.018.47z"/>
          </svg>
        );

      case 'whatsapp':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} className={variant === 'raw' ? "fill-[#25D366] shrink-0" : "fill-white shrink-0"}>
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          </svg>
        );

      case 'facebook':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} className={variant === 'raw' ? "fill-[#1877F2] shrink-0" : "fill-white shrink-0"}>
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        );

      case 'messenger':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} className={variant === 'raw' ? "fill-[#006AFF] shrink-0" : "fill-white shrink-0"}>
            <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.906 1.455 5.5 3.733 7.185V22l3.415-1.874c.905.251 1.865.39 2.852.39 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.03 11.815l-2.585-2.756-5.044 2.756 5.548-5.89 2.641 2.756 4.988-2.756-5.548 5.89z"/>
          </svg>
        );

      case 'instagram':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} className={variant === 'raw' ? "fill-none stroke-[#ee2a7b] stroke-[2] stroke-linecap-round stroke-linejoin-round shrink-0" : "fill-none stroke-white stroke-[2] stroke-linecap-round stroke-linejoin-round shrink-0"}>
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
        );

      case 'tiktok':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} className="shrink-0 tiktok-svg">
            <path className="tiktok-path-1" fill="#00F2FE" d="M16.6 5.82a5.52 5.52 0 0 1-3.66-2.58V1.5h-3v14.1a3.15 3.15 0 1 1-3.15-3.15c.32 0 .63.05.92.14V9.41a6.15 6.15 0 1 0 5.23 6.09V7.63a8.55 8.55 0 0 0 5.26 1.79v-3.1a5.5 5.5 0 0 1-1.6-.5z"/>
            <path className="tiktok-path-2" fill="#FF0050" d="M16.1 5.32a5.52 5.52 0 0 1-3.66-2.58V1h-3v14.1a3.15 3.15 0 1 1-3.15-3.15c.32 0 .63.05.92.14V8.91a6.15 6.15 0 1 0 5.23 6.09V7.13a8.55 8.55 0 0 0 5.26 1.79v-3.1a5.5 5.5 0 0 1-1.6-.5z"/>
            <path className="tiktok-path-3" fill={variant === 'raw' ? "#1c1e21" : "#FFFFFF"} d="M16.35 5.57a5.52 5.52 0 0 1-3.66-2.58V1.25h-3v14.1a3.15 3.15 0 1 1-3.15-3.15c.32 0 .63.05.92.14V9.16a6.15 6.15 0 1 0 5.23 6.09V7.38a8.55 8.55 0 0 0 5.26 1.79v-3.1a5.5 5.5 0 0 1-1.6-.5z"/>
          </svg>
        );

      case 'website':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} className={variant === 'raw' ? "fill-[#0284c7] shrink-0" : "fill-white shrink-0"}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
        );

      case 'landing_page':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} className={variant === 'raw' ? "fill-[#8b5cf6] shrink-0" : "fill-white shrink-0"}>
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10zm0-12H5V5h14v2zM7 11h4v4H7zm6 0h4v2h-4zm0 4h4v2h-4z"/>
          </svg>
        );

      case 'all':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} className={variant === 'raw' ? "fill-[#2563eb] shrink-0" : "fill-white shrink-0"}>
            <path d="M4 11h6a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1zm10 0h6a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1zM4 21h6a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1zm10 0h6a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1z"/>
          </svg>
        );

      case 'dragonbot':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} className={variant === 'raw' ? "fill-[#00f2fe] shrink-0" : "fill-white shrink-0"}>
            <path d="M12 2a2 2 0 0 1 2 2c0 .749-.41 1.403-1.022 1.743l1.832 2.87A3.987 3.987 0 0 1 18 8a4 4 0 0 1 4 4v7a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-7a4 4 0 0 1 3.19-3.913l1.832-2.87A2.001 2.001 0 0 1 10 4a2 2 0 0 1 2-2zm-3.5 10a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm7 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM12 16.5a2.5 2.5 0 0 0-2.45 2h4.9a2.5 2.5 0 0 0-2.45-2z"/>
          </svg>
        );

      case 'sent':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} className={variant === 'raw' ? "fill-[#00F2FE] shrink-0" : "fill-white shrink-0"}>
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        );

      case 'received':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} className={variant === 'raw' ? "fill-[#a855f7] shrink-0" : "fill-white shrink-0"}>
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/>
          </svg>
        );

      case 'fraud':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} className={variant === 'raw' ? "fill-[#f43f5e] shrink-0" : "fill-white shrink-0"}>
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 6h2v6h-2V7zm1 10c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
          </svg>
        );

      case 'courier':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} className={variant === 'raw' ? "fill-[#10b981] shrink-0" : "fill-white shrink-0"}>
            <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
          </svg>
        );

      case 'detailed_reports':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} className={variant === 'raw' ? "fill-[#f59e0b] shrink-0" : "fill-white shrink-0"}>
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
          </svg>
        );

      default:
        return <Smartphone size={size} className={variant === 'raw' ? "text-slate-800 dark:text-white shrink-0" : "text-white shrink-0"} />;
    }
  };

  if (variant === 'raw') {
    return renderSvg();
  }

  // Get background style matching brand color
  const getBadgeStyle = (): React.CSSProperties => {
    switch (p) {
      case 'wechat':
        return { backgroundColor: '#07C160' };
      case 'line':
        return { backgroundColor: '#06C755' };
      case 'viber':
        return { backgroundColor: '#7360F2' };
      case 'telegram':
        return { backgroundColor: '#0088cc' };
      case 'whatsapp':
        return { backgroundColor: '#25D366' };
      case 'facebook':
        return { backgroundColor: '#1877F2' };
      case 'messenger':
        return { background: 'linear-gradient(135deg, #006AFF 0%, #A107FF 100%)' };
      case 'instagram':
        return { background: 'linear-gradient(45deg, #f9ce34 0%, #ee2a7b 50%, #6228d7 100%)' };
      case 'tiktok':
        return { backgroundColor: '#000000' };
      case 'website':
        return { background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)' };
      case 'landing_page':
        return { background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)' };
      case 'all':
        return { background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' };
      case 'dragonbot':
        return { background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 50%, #006aff 100%)' };
      case 'sent':
        return { background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)' };
      case 'received':
        return { background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)' };
      case 'fraud':
        return { background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)' };
      case 'courier':
        return { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' };
      case 'detailed_reports':
        return { background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' };
      default:
        return { backgroundColor: '#1e293b' };
    }
  };

  // Get background gradient / color for badge
  const getBgClass = () => {
    switch (p) {
      case 'wechat':
        return 'bg-[#07C160] shadow-emerald-500/20';
      case 'line':
        return 'bg-[#06C755] shadow-green-500/20';
      case 'viber':
        return 'bg-[#7360F2] shadow-indigo-500/20';
      case 'telegram':
        return 'bg-[#0088cc] shadow-sky-500/20';
      case 'whatsapp':
        return 'bg-[#25D366] shadow-green-500/20';
      case 'facebook':
        return 'bg-[#1877F2] shadow-blue-500/20';
      case 'messenger':
        return 'bg-gradient-to-tr from-[#006AFF] via-[#A107FF] to-[#FF5489] shadow-purple-500/20';
      case 'instagram':
        return 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] shadow-pink-500/20';
      case 'tiktok':
        return 'bg-black shadow-zinc-800/30';
      case 'website':
        return 'bg-gradient-to-tr from-[#0284c7] to-[#2563eb] shadow-sky-500/20';
      case 'landing_page':
        return 'bg-gradient-to-tr from-[#8b5cf6] to-[#ec4899] shadow-purple-500/20';
      case 'all':
        return 'bg-gradient-to-tr from-[#3b82f6] to-[#1d4ed8] shadow-blue-500/20';
      case 'dragonbot':
        return 'bg-gradient-to-tr from-[#00F2FE] via-[#4FACFE] to-[#006AFF] shadow-cyan-500/25';
      case 'sent':
        return 'bg-gradient-to-tr from-[#00f2fe] to-[#4facfe] shadow-cyan-500/20';
      case 'received':
        return 'bg-gradient-to-tr from-[#a855f7] to-[#7e22ce] shadow-purple-500/20';
      case 'fraud':
        return 'bg-gradient-to-tr from-[#f43f5e] to-[#e11d48] shadow-rose-500/20';
      case 'courier':
        return 'bg-gradient-to-tr from-[#10b981] to-[#059669] shadow-emerald-500/20';
      case 'detailed_reports':
        return 'bg-gradient-to-tr from-[#f59e0b] to-[#d97706] shadow-amber-500/20';
      default:
        return 'bg-slate-800 shadow-slate-800/20';
    }
  };

  const containerClass = badgeSizeClass || 'w-10 h-10 rounded-2xl';

  return (
    <div 
      style={getBadgeStyle()}
      data-brand={p}
      className={`${containerClass} ${getBgClass()} ${p === 'tiktok' ? 'tiktok-badge-container' : ''} flex items-center justify-center shadow-md shrink-0`}
    >
      {renderSvg()}
    </div>
  );
};

export default BrandSvgIcon;
