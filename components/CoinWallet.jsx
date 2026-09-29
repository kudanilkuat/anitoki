'use client';

import { useState } from 'react';

/**
 * CoinWallet
 * Komponen yang menampilkan saldo koin user dan tombol tukar koin.
 * Ditampilkan di halaman profil dan premium.
 */

const COINS_REQUIRED = 3000;
const REWARD_DAYS    = 7;

export default function CoinWallet({ coins = 0, userUid, onRedeemSuccess }) {
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [confirm, setConfirm]   = useState(false);

  const canRedeem = coins >= COINS_REQUIRED;
  const progress  = Math.min((coins / COINS_REQUIRED) * 100, 100);
  const remaining = Math.max(COINS_REQUIRED - coins, 0);

  const handleRedeem = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res  = await fetch('/api/payments/redeem-coins', {
        method: 'POST',
        headers: { Authorization: `Bearer ${userUid}` },
      });
      const json = await res.json();
      if (json.success) {
        setResult({ type: 'success', text: json.message });
        setConfirm(false);
        onRedeemSuccess?.(json.data);
      } else {
        setResult({ type: 'error', text: json.error || 'Gagal menukar koin.' });
      }
    } catch (err) {
      setResult({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-bg-elevated">
        <div className="w-9 h-9 bg-yellow-500/15 rounded-xl flex items-center justify-center shrink-0">
          <span className="text-lg">🪙</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-bold">Dompet Koin</p>
          <p className="text-text-muted text-[10px]">Kumpulkan {COINS_REQUIRED} koin → {REWARD_DAYS} hari premium gratis</p>
        </div>
        {/* Saldo besar */}
        <div className="text-right shrink-0">
          <p className="text-yellow-400 text-xl font-black tabular-nums">{coins.toLocaleString('id-ID')}</p>
          <p className="text-text-muted text-[10px]">koin</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-text-muted">Progress tukar koin</span>
            <span className={`font-bold ${canRedeem ? 'text-green-400' : 'text-yellow-400'}`}>
              {coins.toLocaleString('id-ID')} / {COINS_REQUIRED.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="w-full h-2.5 bg-bg-elevated rounded-full overflow-hidden border border-border">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                canRedeem
                  ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                  : 'bg-gradient-to-r from-yellow-500 to-amber-400'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {!canRedeem && (
            <p className="text-text-muted text-[10px]">
              Butuh <span className="text-yellow-400 font-bold">{remaining.toLocaleString('id-ID')} koin</span> lagi
              · ≈ {Math.ceil(remaining / 20)} kali pembelian lagi
            </p>
          )}
        </div>

        {/* Info cara dapat koin */}
        <div className="flex items-start gap-2 p-3 bg-yellow-500/5 border border-yellow-500/15 rounded-xl">
          <span className="text-base shrink-0">💡</span>
          <p className="text-text-secondary text-[11px] leading-relaxed">
            Setiap aktivasi paket premium mendapat <span className="text-yellow-400 font-bold">+20 koin</span>.
            Kumpulkan <span className="text-yellow-400 font-bold">{COINS_REQUIRED} koin</span> untuk tukar <span className="text-white font-bold">{REWARD_DAYS} hari premium gratis</span>!
          </p>
        </div>

        {/* Tombol tukar */}
        {canRedeem && !confirm && (
          <button
            onClick={() => setConfirm(true)}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-400 hover:from-yellow-400 hover:to-amber-300 text-gray-900 font-black text-sm shadow-lg shadow-yellow-500/25 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <span>🪙</span>
            Tukar {COINS_REQUIRED.toLocaleString('id-ID')} Koin → {REWARD_DAYS} Hari Premium
          </button>
        )}

        {/* Konfirmasi tukar */}
        {confirm && (
          <div className="space-y-2">
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-center">
              <p className="text-yellow-400 text-xs font-bold">Konfirmasi Penukaran Koin</p>
              <p className="text-text-secondary text-[11px] mt-1">
                <span className="text-white font-bold">{COINS_REQUIRED.toLocaleString('id-ID')} koin</span> akan dikurangi.
                Sisa: <span className="text-white font-bold">{(coins - COINS_REQUIRED).toLocaleString('id-ID')} koin</span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setConfirm(false)}
                className="py-2.5 rounded-xl border border-border text-text-secondary hover:text-white text-xs font-bold transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleRedeem}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-gray-900 text-xs font-black disabled:opacity-60 transition-all"
              >
                {loading ? (
                  <span className="w-3.5 h-3.5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                ) : '✅'}
                {loading ? 'Menukar...' : 'Ya, Tukar!'}
              </button>
            </div>
          </div>
        )}

        {/* Result message */}
        {result && (
          <div className={`text-[11px] px-3 py-2.5 rounded-xl border text-center ${
            result.type === 'success'
              ? 'text-green-400 bg-green-500/10 border-green-500/20'
              : 'text-red-400 bg-red-500/10 border-red-500/20'
          }`}>
            {result.type === 'success' ? '🎉 ' : '❌ '}{result.text}
          </div>
        )}
      </div>
    </div>
  );
}
