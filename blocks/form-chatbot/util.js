/* global DecompressionStream */

export async function decodeAfState(stateToken) {
  const b64 = stateToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const payload = JSON.parse(atob(b64));
  const compressed = Uint8Array.from(atob(payload.afStateGz), (c) => c.charCodeAt(0));

  const ds = new DecompressionStream('gzip');
  const writer = ds.writable.getWriter();
  writer.write(compressed);
  writer.close();

  const buffer = await new Response(ds.readable).arrayBuffer();
  return JSON.parse(new TextDecoder().decode(buffer));
}
