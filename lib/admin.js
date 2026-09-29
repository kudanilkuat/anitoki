const envAdmin = (process.env.NEXT_PUBLIC_ADMIN_UIDS || '')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);

export const ADMIN_UIDS = envAdmin.length
  ? envAdmin
  : ['BUkIZguy10hnIG8jAooZoycG7ak1', 'TPuc7EiYeFZcea9HGMe0mwl2ie13'];

export function isAdminUID(uid) {
  return !!uid && ADMIN_UIDS.includes(uid);
}
