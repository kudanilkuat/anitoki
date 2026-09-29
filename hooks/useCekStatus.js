/**
 * hooks/useCekStatus.js
 * Hook shared untuk tombol "Cek Status Pembayaran".
 * Menangani: loading state, cooldown countdown, dan disable otomatis setelah klik.
 */

import { useState, useRef, useCallback } from 'react';

export function useCekStatus({ userUid, onSuccess, onNotYet, onError } = {}) {
  const [loading, setLoading]     = useState(false);
  const [cooldown, setCooldown]   = useState(0); // detik tersisa
  const timerRef                  = useRef(null);

  const startCooldown = useCallback((seconds = 3) => {
    setCooldown(seconds);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const check = useCallback(async (orderId) => {
    if (!orderId || loading || cooldown > 0) return;

    setLoading(true);
    try {
      const res  = await fetch('/api/payments/check-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userUid}`,
        },
        body: JSON.stringify({ orderId }),
      });

      const json = await res.json();

      if (res.status === 429) {
        // Server rate-limited — pakai retryAfter dari server
        startCooldown(json.retryAfter || 3);
        return;
      }

      // Mulai cooldown klien setelah setiap request sukses
      startCooldown(3);

      if (json.approved) {
        onSuccess?.(json);
      } else {
        onNotYet?.(json);
      }
    } catch (err) {
      onError?.(err);
      startCooldown(3);
    } finally {
      setLoading(false);
    }
  }, [userUid, loading, cooldown, startCooldown, onSuccess, onNotYet, onError]);

  const isDisabled = loading || cooldown > 0;

  const buttonLabel = (defaultLabel = 'Cek Status Pembayaran') => {
    if (loading)    return null; // tampilkan spinner
    if (cooldown > 0) return `Coba lagi dalam ${cooldown}s`;
    return defaultLabel;
  };

  return { check, loading, cooldown, isDisabled, buttonLabel };
}
