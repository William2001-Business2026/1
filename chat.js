/* Hale Moku player chat.
   A small panel in the bottom-left corner where players talk about the game.
   - Players choose to sign in with Google or carry on as a guest.
   - Everyone shares the "General" room. Anyone can create a private room and
     invite others with its code.
   - Messages are stored and delivered by Supabase (see supabase/migrations).
   The chat is independent of the game: if it is not configured or the service
   is unreachable, the island still works. */
(function () {
  'use strict';

  var cfg = window.HALE_MOKU_CHAT || {};
  if (!cfg.url || !cfg.key) { console.info('[chat] Not configured, chat is hidden. See chat-config.js.'); return; }
  if (!window.supabase || !window.supabase.createClient) { console.warn('[chat] Supabase library missing, chat is hidden.'); return; }

  var GENERAL = '00000000-0000-0000-0000-000000000001';
  var HISTORY = 50, MAX_SHOWN = 200, MAX_LEN = 500;
  var db = window.supabase.createClient(cfg.url, cfg.key);

  var me = null;            // { id, name, guest }
  var rooms = [];           // [{ id, name, is_private, invite_code }]
  var roomId = GENERAL;
  var channel = null;
  var seen = new Set();     // message ids already on screen
  var loadToken = 0;        // guards against a slow room load finishing after a switch

  /* ───────── tiny DOM helper ───────── */
  function h(tag, props, kids) {
    var n = document.createElement(tag), k;
    for (k in (props || {})) {
      if (k === 'class') n.className = props[k];
      else if (k === 'text') n.textContent = props[k];
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), props[k]);
      else n.setAttribute(k, props[k]);
    }
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; }

  /* ───────── build the panel ───────── */
  var root = h('div', { id: 'chat', 'aria-label': 'Player chat' });

  // Shown before the player has chosen how to join.
  var nickIn = h('input', { type: 'text', maxlength: '24', placeholder: 'Nickname (optional)', 'aria-label': 'Guest nickname' });
  var joinView = h('div', {}, [
    h('div', { class: 'c-title', text: 'Talk story' }),
    h('div', { class: 'c-pad' }, [
      h('p', { class: 'c-note', text: 'Chat with other players about the island. Join with Google or as a guest.' }),
      h('button', { class: 'c-google', type: 'button', text: 'Continue with Google', onclick: signInGoogle }),
      h('div', { class: 'c-row' }, [nickIn, h('button', { type: 'button', text: 'Play as guest', onclick: signInGuest })])
    ])
  ]);

  // Shown once signed in.
  var nameEl = h('b');
  var kindEl = h('span');
  var roomSel = h('select', { 'aria-label': 'Chat room', onchange: function () { switchRoom(roomSel.value); } });
  var codeEl = h('span', { class: 'c-code', title: 'Share this code to invite someone' });
  var codeWrap = h('span', {}, [document.createTextNode('Invite code: '), codeEl]);
  var leaveBtn = h('button', { type: 'button', text: 'Leave', onclick: leaveRoom });
  var newNameIn = h('input', { type: 'text', maxlength: '40', placeholder: 'New private room name', 'aria-label': 'New private room name' });
  var codeIn = h('input', { type: 'text', maxlength: '16', placeholder: 'Invite code', 'aria-label': 'Invite code' });
  var roomForm = h('div', { class: 'c-form' }, [
    h('div', { class: 'c-row' }, [newNameIn, h('button', { type: 'button', text: 'Create', onclick: createRoom })]),
    h('div', { class: 'c-row' }, [codeIn, h('button', { type: 'button', text: 'Join', onclick: joinRoom })])
  ]);
  var renameIn = h('input', { type: 'text', maxlength: '24', placeholder: 'Your chat name', 'aria-label': 'Your chat name' });
  var renameForm = h('div', { class: 'c-form' }, [
    h('div', { class: 'c-row' }, [renameIn, h('button', { type: 'button', text: 'Save', onclick: rename })])
  ]);
  var listEl = h('div', { class: 'c-list', role: 'log', 'aria-live': 'polite' });
  var errEl = h('div', { class: 'c-err', role: 'alert' });
  var msgIn = h('input', { type: 'text', maxlength: String(MAX_LEN), placeholder: 'Press Enter to chat', 'aria-label': 'Message', autocomplete: 'off' });
  var roomView = h('div', {}, [
    h('div', { class: 'c-head' }, [
      h('div', { class: 'c-me' }, [nameEl, kindEl,
        h('button', { type: 'button', text: 'Rename', onclick: function () { toggle(renameForm, roomForm); renameIn.value = me ? me.name : ''; } }),
        h('button', { type: 'button', text: 'Sign out', onclick: signOut })]),
      renameForm,
      h('div', { class: 'c-row' }, [roomSel,
        h('button', { type: 'button', text: '+ Private room', onclick: function () { toggle(roomForm, renameForm); } })]),
      roomForm,
      h('div', { class: 'c-tools' }, [codeWrap, leaveBtn])
    ]),
    listEl,
    errEl,
    h('form', { class: 'c-send', onsubmit: function (e) { e.preventDefault(); send(); } }, [msgIn, h('button', { type: 'submit', text: 'Send' })])
  ]);

  root.appendChild(joinView); root.appendChild(roomView);
  document.body.appendChild(root);
  root.classList.add('on');

  function toggle(form, other) { other.classList.remove('on'); form.classList.toggle('on'); var i = form.querySelector('input'); if (form.classList.contains('on') && i) i.focus(); }

  /* ───────── messages on screen ───────── */
  var errTimer = 0;
  function showErr(text) {
    errEl.textContent = text; errEl.classList.add('on');
    clearTimeout(errTimer); errTimer = setTimeout(function () { errEl.classList.remove('on'); }, 6000);
  }
  function explain(error) {
    var m = (error && error.message) || '';
    if (/rate_limit/.test(m)) return 'Easy now. Wait a few seconds before sending more.';
    if (/room_not_found/.test(m)) return 'No private room has that invite code.';
    if (/room_limit/.test(m)) return 'You have created the most private rooms allowed.';
    if (/not_signed_in|JWT|no_profile/.test(m)) return 'Please sign in again to chat.';
    if (/check constraint|violates/.test(m)) return 'That is too short or too long.';
    if (/nonymous sign-ins are disabled/i.test(m)) return 'Guest chat is not switched on yet.';
    if (/provider is not enabled/i.test(m)) return 'Google sign-in is not switched on yet.';
    if (/fetch|network/i.test(m)) return 'Cannot reach the chat right now. Check your connection.';
    return 'Something went wrong. Please try again.';
  }
  function sys(text) { listEl.appendChild(h('div', { class: 'c-sys', text: text })); listEl.scrollTop = listEl.scrollHeight; }
  function addMsg(m) {
    if (seen.has(m.id) || m.room_id !== roomId) return;
    seen.add(m.id);
    var stick = listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight < 40;
    var t = new Date(m.created_at);
    // textContent everywhere: player text is never treated as HTML.
    listEl.appendChild(h('div', { class: 'c-msg' + (me && m.user_id === me.id ? ' me' : '') }, [
      h('b', { text: m.author_name }),
      h('span', { text: m.body }),
      h('time', { datetime: m.created_at, text: isNaN(t) ? '' : t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })
    ]));
    while (listEl.children.length > MAX_SHOWN) listEl.removeChild(listEl.firstChild);
    if (stick) listEl.scrollTop = listEl.scrollHeight;
  }

  /* ───────── signing in and out ───────── */
  function signInGoogle() {
    if (location.protocol === 'file:') { alert('Google sign-in only works on the hosted game, not when the file is opened from your computer. You can still play as a guest.'); return; }
    db.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname } })
      .then(function (r) { if (r.error) alert(explain(r.error)); });
  }
  function signInGuest() {
    var nick = nickIn.value.trim().replace(/\s+/g, ' ');
    pendingNick = nick.length >= 2 ? nick : '';
    db.auth.signInAnonymously().then(function (r) {
      if (r.error) { pendingNick = ''; alert(explain(r.error)); }
    });
  }
  var pendingNick = '';
  function signOut() {
    if (me && me.guest && !confirm('Guest accounts cannot be recovered. Sign out and lose this guest name and its private rooms?')) return;
    db.auth.signOut();
  }

  function onSession(session) {
    var uid = session && session.user ? session.user.id : null;
    if (!uid) { me = null; leaveChannel(); render(); return; }
    if (me && me.id === uid) return;
    me = { id: uid, name: '…', guest: !!session.user.is_anonymous };
    render();
    loadProfile(0);
  }
  // The profile row is created by the database just after sign-up, so retry briefly.
  function loadProfile(attempt) {
    var uid = me && me.id; if (!uid) return;
    db.from('profiles').select('display_name,is_guest').eq('id', uid).maybeSingle().then(function (r) {
      if (!me || me.id !== uid) return;
      if (!r.data) { if (attempt < 5) setTimeout(function () { loadProfile(attempt + 1); }, 600); else showErr(explain(r.error)); return; }
      me.name = r.data.display_name; me.guest = r.data.is_guest;
      render();
      if (pendingNick) { renameIn.value = pendingNick; pendingNick = ''; rename(); }
      loadRooms(store('halemoku-chat-room') || GENERAL);
    });
  }
  function rename() {
    var n = renameIn.value.trim().replace(/\s+/g, ' ');
    if (n.length < 2 || n.length > 24) { showErr('Names are 2 to 24 characters.'); return; }
    db.from('profiles').update({ display_name: n }).eq('id', me.id).select('display_name').maybeSingle().then(function (r) {
      if (r.error || !r.data) { showErr(explain(r.error)); return; }
      me.name = r.data.display_name; renameForm.classList.remove('on'); render();
    });
  }

  /* ───────── rooms ───────── */
  function loadRooms(want) {
    db.from('rooms').select('id,name,is_private,invite_code').order('created_at').then(function (r) {
      if (r.error) { showErr(explain(r.error)); return; }
      rooms = r.data || [];
      switchRoom(rooms.some(function (x) { return x.id === want; }) ? want : GENERAL, true);
    });
  }
  function currentRoom() { return rooms.filter(function (x) { return x.id === roomId; })[0] || null; }
  function leaveChannel() { if (channel) { db.removeChannel(channel); channel = null; } }

  function switchRoom(id, force) {
    if (id === roomId && channel && !force) return;
    roomId = id; store('halemoku-chat-room', id);
    leaveChannel(); seen.clear(); listEl.textContent = '';
    render();
    var token = ++loadToken, loading = true, early = [];
    // Subscribe first so nothing sent while the history loads is missed; duplicates are dropped by id.
    channel = db.channel('room:' + id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'room_id=eq.' + id },
        function (p) { if (loading) early.push(p.new); else addMsg(p.new); })
      .subscribe();
    db.from('messages').select('id,room_id,user_id,author_name,body,created_at').eq('room_id', id)
      .order('created_at', { ascending: false }).limit(HISTORY).then(function (r) {
        if (token !== loadToken) return;
        loading = false;
        if (r.error) showErr(explain(r.error));
        var rows = (r.data || []).slice().reverse().concat(early);
        if (!rows.length && !r.error) sys('No messages yet. Say aloha!');
        rows.forEach(addMsg);
        listEl.scrollTop = listEl.scrollHeight;
      });
  }
  function createRoom() {
    var n = newNameIn.value.trim();
    if (n.length < 2) { showErr('Give the room a name of at least 2 characters.'); return; }
    db.rpc('create_room', { room_name: n }).then(function (r) {
      if (r.error) { showErr(explain(r.error)); return; }
      newNameIn.value = ''; roomForm.classList.remove('on'); loadRooms(r.data.id);
    });
  }
  function joinRoom() {
    var c = codeIn.value.trim();
    if (!c) return;
    db.rpc('join_room', { code: c }).then(function (r) {
      if (r.error) { showErr(explain(r.error)); return; }
      codeIn.value = ''; roomForm.classList.remove('on'); loadRooms(r.data.id);
    });
  }
  function leaveRoom() {
    var r = currentRoom();
    if (!r || !r.is_private || !confirm('Leave "' + r.name + '"? You will need the invite code to come back.')) return;
    db.from('room_members').delete().eq('room_id', r.id).eq('user_id', me.id).then(function (x) {
      if (x.error) { showErr(explain(x.error)); return; }
      loadRooms(GENERAL);
    });
  }

  /* ───────── sending ───────── */
  var sending = false;
  function send() {
    var body = msgIn.value.trim();
    if (!body || sending || !me) { if (!body) msgIn.blur(); return; }
    sending = true;
    db.from('messages').insert({ room_id: roomId, body: body.slice(0, MAX_LEN) })
      .select('id,room_id,user_id,author_name,body,created_at').single().then(function (r) {
        sending = false;
        if (r.error) { showErr(explain(r.error)); return; }
        msgIn.value = ''; addMsg(r.data); listEl.scrollTop = listEl.scrollHeight;
        if (playing()) msgIn.blur();
      });
  }

  /* ───────── drawing ───────── */
  function render() {
    joinView.style.display = me ? 'none' : '';
    roomView.style.display = me ? '' : 'none';
    if (!me) return;
    nameEl.textContent = me.name;
    kindEl.textContent = me.guest ? 'guest' : 'Google';
    roomSel.textContent = '';
    rooms.forEach(function (r) {
      var o = h('option', { value: r.id, text: (r.is_private ? '🔒 ' : '') + r.name });
      if (r.id === roomId) o.selected = true;
      roomSel.appendChild(o);
    });
    var r = currentRoom(), priv = !!(r && r.is_private);
    codeWrap.style.display = leaveBtn.style.display = priv ? '' : 'none';
    codeEl.textContent = priv ? r.invite_code : '';
  }

  /* ───────── living alongside the game ─────────
     The game listens for keys on the window. Keys typed inside the chat must not
     reach it, or typing "w" would walk the player. Key-up is allowed through so a
     movement key held when chat opens is still released. */
  var menuEl = document.getElementById('menu'), hudEl = document.getElementById('hud');
  function playing() { return !!menuEl && menuEl.classList.contains('hidden'); }
  function syncMode() {
    var p = playing();
    root.classList.toggle('play', p);
    // Photo mode hides the game's interface during play, so hide the chat with it.
    root.classList.toggle('hide', p && !!hudEl && hudEl.style.opacity === '0');
  }
  if (window.MutationObserver) {
    var mo = new MutationObserver(syncMode);
    if (menuEl) mo.observe(menuEl, { attributes: true, attributeFilter: ['class'] });
    if (hudEl) mo.observe(hudEl, { attributes: true, attributeFilter: ['style'] });
  }
  syncMode();

  root.addEventListener('keydown', function (e) {
    e.stopPropagation();
    if (e.key === 'Escape' && document.activeElement) document.activeElement.blur();
  });
  root.addEventListener('wheel', function (e) { e.stopPropagation(); }, { passive: true });
  root.addEventListener('mousedown', function (e) { e.stopPropagation(); });
  msgIn.addEventListener('focus', function () { root.classList.add('typing'); msgIn.placeholder = 'Type a message'; });
  msgIn.addEventListener('blur', function () { root.classList.remove('typing'); msgIn.placeholder = 'Press Enter to chat'; });
  // Enter, pressed while playing, moves the keyboard into the chat box.
  window.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || e.repeat || !me || !playing() || root.classList.contains('hide')) return;
    var a = document.activeElement;
    if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT')) return;
    e.preventDefault(); msgIn.focus();
  });

  /* ───────── start ───────── */
  db.auth.onAuthStateChange(function (event, session) {
    // Defer: Supabase asks that no other Supabase calls run inside this callback.
    setTimeout(function () { onSession(session); }, 0);
  });
  render();
})();
