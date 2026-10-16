const api = globalThis.browser ?? globalThis.chrome;
const $ = (id) => document.getElementById(id);

async function refresh() {
  const { connected } = await api.runtime.sendMessage({ type: 'status' });
  $('status').textContent =
    connected === true ? 'Connected to your account.' : connected === false ? 'Not connected yet.' : 'Can’t reach Tholafind right now.';
  $('connect').hidden = connected !== false;
  $('disconnect').hidden = connected !== true;
}
$('snip').addEventListener('click', async () => { await api.runtime.sendMessage({ type: 'start-snip' }); window.close(); });
$('connect').addEventListener('click', async () => { await api.runtime.sendMessage({ type: 'open-connect' }); window.close(); });
$('disconnect').addEventListener('click', async () => { await api.runtime.sendMessage({ type: 'disconnect' }); refresh(); });
refresh();
