import React, { useEffect } from 'react';

interface AdBannerProps {
  adSlot?: string;
  adFormat?: 'auto' | 'horizontal' | 'rectangle' | 'vertical';
  className?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({
  adSlot = '1234567890',
  adFormat = 'auto',
  className = ''
}) => {
  useEffect(() => {
    try {
      // @ts-ignore
      if (window.adsbygoogle && window.adsbygoogle.loaded !== true) {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.log('AdSense error:', error);
    }
  }, []);

  return (
    <div className={`ad-banner ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-9843547738315944"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdBanner;
