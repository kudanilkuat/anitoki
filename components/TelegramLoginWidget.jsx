'use client';
import { useEffect, useRef } from 'react';

export default function TelegramLoginWidget({ botName, onAuth, buttonSize = 'large', cornerRadius = 8, requestAccess = 'write', usePic = true }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!botName) return;
    
    // Create script element
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    
    // Set attributes
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', buttonSize);
    script.setAttribute('data-radius', cornerRadius);
    script.setAttribute('data-request-access', requestAccess);
    script.setAttribute('data-userpic', usePic.toString());
    
    // Attach callback to window
    window.TelegramLoginWidgetCallback = (user) => {
      onAuth(user);
    };
    script.setAttribute('data-onauth', 'TelegramLoginWidgetCallback(user)');
    
    // Append script to container
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(script);
    }
    
    return () => {
      delete window.TelegramLoginWidgetCallback;
    };
  }, [botName, onAuth, buttonSize, cornerRadius, requestAccess, usePic]);

  if (!botName) {
    return <div className="text-xs text-red-500 p-2 text-center">Bot Name not configured</div>;
  }

  return (
    <div className="flex justify-center" ref={containerRef}></div>
  );
}
