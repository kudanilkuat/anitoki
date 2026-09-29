/**
 * WijayaPay Payment Gateway Helper
 * Docs: https://docs.wijayapay.com
 *
 * Flow:
 *  1. createPayment()  → POST /api/transaction/create
 *  2. checkPaymentStatus() → GET /api/get-status
 *
 * X-Signature = md5(code_merchant + api_key + ref_id)
 */

import crypto from 'crypto';

const CODE_MERCHANT = process.env.WIJAYAPAY_CODE_MERCHANT;
const API_KEY       = process.env.WIJAYAPAY_API_KEY;
const BASE_URL      = 'https://wijayapay.com/api';

/**
 * Hitung X-Signature untuk request WijayaPay.
 * @param {string} ref_id - ID unik transaksi dari merchant (= orderId kita)
 */
function generateSignature(ref_id) {
  const raw = `${CODE_MERCHANT}${API_KEY}${ref_id}`;
  return crypto.createHash('md5').update(raw).digest('hex');
}

/**
 * Buat transaksi pembayaran baru di WijayaPay.
 *
 * @param {object} opts
 * @param {string} opts.ref_id          - ID unik order dari merchant (orderId)
 * @param {number} opts.amount          - Nominal dalam IDR (integer)
 * @param {string} [opts.payment_method] - Default: 'QRIS'
 * @param {string} [opts.callback_url]  - URL webhook untuk notifikasi paid
 *
 * @returns {object} WijayaPay data — { qr_image, qr_string, trx_reference, expired, ... }
 */
export async function createPayment({
  ref_id,
  amount,
  payment_method = 'QRIS',
  callback_url,
  customer_name,
  customer_email,
  customer_phone,
}) {
  if (!CODE_MERCHANT || !API_KEY) {
    throw new Error('WIJAYAPAY_CODE_MERCHANT / WIJAYAPAY_API_KEY belum dikonfigurasi di .env');
  }

  const signature = generateSignature(ref_id);

  const requestBody = {
    code_merchant:  CODE_MERCHANT,
    api_key:        API_KEY,
    ref_id,
    nominal:        amount,        // ✅ bukan 'amount'
    code_payment:   payment_method, // ✅ bukan 'payment_method'
    callback_url:   callback_url || '',
    customer_name:  customer_name  || 'Customer',
    customer_email: customer_email || '',
    customer_phone: customer_phone || '',
  };

  const res = await fetch(`${BASE_URL}/transaction/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Signature': signature,
    },
    body: JSON.stringify(requestBody),
  });

  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error(`WijayaPay: response bukan JSON (HTTP ${res.status})`);
  }

  if (!json.success) {
    throw new Error(json.message || `WijayaPay: gagal membuat pembayaran (HTTP ${res.status})`);
  }

  return json.data; // { qr_image, qr_string, trx_reference, ref_id, expired, ... }
}

/**
 * Cek status pembayaran berdasarkan ref_id (= orderId kita).
 *
 * @param {string} ref_id - ID order yang dikirim saat createPayment
 * @returns {{ status_pembayaran: 'pending'|'paid'|'expired', data: object }}
 */
export async function checkPaymentStatus(ref_id) {
  if (!CODE_MERCHANT || !API_KEY) {
    throw new Error('WIJAYAPAY_CODE_MERCHANT / WIJAYAPAY_API_KEY belum dikonfigurasi di .env');
  }

  const url = new URL(`${BASE_URL}/get-status`);
  url.searchParams.set('code_merchant', CODE_MERCHANT);
  url.searchParams.set('api_key', API_KEY);
  url.searchParams.set('ref_id', ref_id);

  const res = await fetch(url.toString(), { cache: 'no-store' });

  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error(`WijayaPay: response bukan JSON (HTTP ${res.status})`);
  }

  // { data: {...}, status_pembayaran: 'pending'|'paid'|'expired' }
  return json;
}
