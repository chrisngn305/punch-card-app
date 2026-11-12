// Minimal DOM patcher: renders markup into `root` by updating the existing
// nodes in place, so focus, caret position and scroll survive re-renders.
export function morph(root, markup) {
  const tpl = document.createElement('template');
  tpl.innerHTML = markup;
  patchChildren(root, tpl.content);
}

function patchChildren(parent, next) {
  const cur = Array.from(parent.childNodes), nxt = Array.from(next.childNodes);
  nxt.forEach((n, i) => {
    const c = cur[i];
    if (!c) parent.appendChild(n);
    else if (c.nodeType === n.nodeType && c.nodeName === n.nodeName) patchNode(c, n);
    else parent.replaceChild(n, c);
  });
  for (let i = nxt.length; i < cur.length; i++) cur[i].remove();
}

function patchNode(c, n) {
  if (c.nodeType !== Node.ELEMENT_NODE) {
    if (c.nodeValue !== n.nodeValue) c.nodeValue = n.nodeValue;
    return;
  }
  for (const { name } of Array.from(c.attributes)) if (!n.hasAttribute(name)) c.removeAttribute(name);
  for (const { name, value } of Array.from(n.attributes)) if (c.getAttribute(name) !== value) c.setAttribute(name, value);
  patchChildren(c, n);
  syncFormState(c, n);
}

// Attributes only set defaults; the live value/checked/selected state lives in properties.
function syncFormState(c, n) {
  if (c.tagName === 'INPUT') {
    if (c.type === 'checkbox') { c.checked = n.hasAttribute('checked'); return; }
    const v = n.getAttribute('value') ?? '';
    // Don't fight the user mid-typing in a number field ("1." vs "1").
    if (c.type === 'number' && c === document.activeElement && Number(c.value) === Number(v)) return;
    if (c.value !== v) c.value = v;
  } else if (c.tagName === 'SELECT') {
    const o = Array.from(c.options).find(o => o.hasAttribute('selected'));
    if (o && !o.selected) o.selected = true;
  }
}
