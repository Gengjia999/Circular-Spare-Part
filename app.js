const App = (() => {
  const LOG = 'circular_spare_part_querylog_v63';
  const AD = 'circular_spare_part_adimage_v63';
  const PWD = 'circular_spare_part_admin_pwd_v63';

  const defaultPassword = 'admin123';

  // V6.3 data.json 共享数据方案：数据从根目录 data.json 读取
  let data = [];
  let lastBatch = [];

  function $(id) {
    return document.getElementById(id);
  }

  function toast(message) {
    const t = $('toast');
    if (!t) return;
    t.textContent = message;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 1800);
  }

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m]));
  }

  function jsq(s) {
    return String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  }

  function norm(v) {
    return String(v || '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '')
      .replace(/[–—]/g, '-');
  }

  function getJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback;
    } catch {
      return fallback;
    }
  }

  function setJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function logs() {
    return getJson(LOG, []);
  }

  function addLog(input, hit) {
    const l = logs();
    l.unshift({
      time: new Date().toLocaleString('zh-CN'),
      input,
      hit
    });
    setJson(LOG, l.slice(0, 500));
    renderStats();
  }

  function moneyNumber(v) {
    let s = String(v ?? '').trim();
    if (!s) return null;
    s = s.replace(/RMB/ig, '')
      .replace(/,/g, '')
      .replace(/￥|¥/g, '')
      .trim();
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  function formatRMB(v) {
    const n = moneyNumber(v);
    if (n === null) return String(v ?? '');
    return n.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' RMB';
  }

  // 兼容两种字段来源：
  // 1) 当前项目字段：category/model/status/mlfb/listPrice/discountPrice/description
  // 2) 之前版本字段：产品类别/产品型号/产品状态/MLFB/列表价格_含税/标准折扣价格_含税/产品描述
  function normalize(x) {
    x = x || {};
    return {
      category: String(x.category ?? x['产品类别'] ?? '').trim(),
      model: String(x.model ?? x['产品型号'] ?? '').trim(),
      status: String(x.status ?? x['产品状态'] ?? '可供').trim() || '可供',
      mlfb: String(x.mlfb ?? x.MLFB ?? x['MLFB'] ?? '').trim(),
      listPrice: formatRMB(x.listPrice ?? x['列表价格_含税'] ?? ''),
      discountPrice: formatRMB(x.discountPrice ?? x['标准折扣价格_含税'] ?? ''),
      description: String(x.description ?? x['产品描述'] ?? '').trim()
    };
  }

  async function loadData() {
    try {
      const res = await fetch('./data.json?v=' + Date.now());
      if (!res.ok) throw new Error('无法读取 data.json');

      const json = await res.json();
      if (!Array.isArray(json)) throw new Error('data.json 必须是数组格式');

      data = json.map(normalize).filter(x => x.mlfb);
      renderStats();
      renderAdminTable();
    } catch (e) {
      console.error(e);
      data = [];
      renderStats();
      renderAdminTable();
      toast('后台数据加载失败，请检查 data.json');
    }
  }

  function getData() {
    return data.map(normalize).filter(x => x.mlfb);
  }

  function setData(d) {
    data = (d || []).map(normalize).filter(x => x.mlfb);
    renderStats();
    renderAdminTable();
  }

  async function resetBuiltInData() {
    await loadData();
    toast('已重新读取 data.json');
  }

  function find(q) {
    const k = norm(q);
    return getData().find(x =>
      norm(x.mlfb) === k ||
      norm(x.mlfb).replace(/-Z86$/, '') === k.replace(/-Z86$/, '')
    );
  }

  function setMode(mode) {
    const userView = $('userView');
    const adminView = $('adminView');
    if (userView) userView.classList.toggle('hide', mode !== 'user');
    if (adminView) adminView.classList.toggle('hide', mode !== 'admin');
    renderStats();
    if (mode === 'admin') {
      renderAdminTable();
      renderAdPreview();
    }
  }

  function renderAd() {
    const img = localStorage.getItem(AD);
    const defaultHtml = '<strong>Circular Spare Part</strong><span>原厂三审备件 · 官方翻新 · 品质保障</span>';

    ['adContentUser', 'adContentBatch'].forEach(id => {
      const e = $(id);
      if (!e) return;
      e.className = img ? '' : 'ad-default';
      e.innerHTML = img ? `<img src="${img}" alt="广告位图片">` : defaultHtml;
    });
  }

  function renderAdPreview() {
    const p = $('adPreview');
    if (!p) return;
    const img = localStorage.getItem(AD);
    p.innerHTML = img
      ? `<img src="${img}" alt="广告预览">`
      : '暂无广告图片，用户端将显示默认广告文案';
  }

  function renderResult(x, input) {
    const resultModule = $('resultModule');
    if (resultModule) resultModule.classList.remove('hide');

    if (!x) {
      if ($('matchBadge')) {
        $('matchBadge').className = 'status-badge no';
        $('matchBadge').textContent = '未匹配到 Circular Spare Part';
      }
      if ($('resCategory')) $('resCategory').textContent = '—';
      if ($('resModel')) $('resModel').textContent = '—';
      if ($('resStatus')) $('resStatus').textContent = '—';
      if ($('resMlfb')) $('resMlfb').textContent = input || '—';
      if ($('resListPrice')) $('resListPrice').textContent = '—';
      if ($('resDiscountPrice')) $('resDiscountPrice').textContent = '—';
      if ($('resDescription')) $('resDescription').textContent = '后台清单暂无该 MLFB，请联系管理员维护。';
      return;
    }

    const good = ['可供', '[上新]', '上新'].includes(x.status);
    if ($('matchBadge')) {
      $('matchBadge').className = good ? 'status-badge' : (x.status === '即将停售' ? 'status-badge warn' : 'status-badge no');
      $('matchBadge').textContent = good ? '已匹配 Circular Spare Part' : `已匹配，状态：${x.status}`;
    }

    if ($('resCategory')) $('resCategory').textContent = x.category || '—';
    if ($('resModel')) $('resModel').textContent = x.model || '—';
    if ($('resStatus')) $('resStatus').textContent = x.status || '—';
    if ($('resMlfb')) $('resMlfb').textContent = x.mlfb || '—';
    if ($('resListPrice')) $('resListPrice').textContent = x.listPrice || '—';
    if ($('resDiscountPrice')) $('resDiscountPrice').textContent = x.discountPrice || '—';
    if ($('resDescription')) $('resDescription').textContent = x.description || '—';
  }

  function searchSingle() {
    const input = $('singleInput');
    const v = input ? input.value.trim() : '';
    if (!v) {
      toast('请输入 MLFB');
      return;
    }
    const x = find(v);
    addLog(v, !!x);
    renderResult(x, v);
    toast(x ? '查询成功' : '未查询到匹配备件');
  }

  function enterSearch(e) {
    if (e.key === 'Enter') searchSingle();
  }

  function openBatch() {
    const modal = $('batchModal');
    if (modal) modal.classList.remove('hide');
    if ($('batchInput')) $('batchInput').focus();
    renderAd();
  }

  function closeBatch() {
    const modal = $('batchModal');
    if (modal) modal.classList.add('hide');
  }

  function runBatch() {
    const input = $('batchInput');
    const raw = input ? input.value : '';
    const inputs = raw.split(/[\n,;，；\t]+/).map(x => x.trim()).filter(Boolean);

    if (!inputs.length) {
      toast('请先输入批量查询内容');
      return;
    }

    lastBatch = inputs.map(input => {
      const x = find(input);
      addLog(input, !!x);
      return x
        ? { ...x, input, hit: true }
        : {
            input,
            hit: false,
            category: '—',
            model: '—',
            status: '未匹配',
            mlfb: input,
            listPrice: '—',
            discountPrice: '—',
            description: '后台清单暂无该 MLFB'
          };
    });

    const box = $('batchResult');
    if (box) {
      box.innerHTML = `<table><thead><tr>
        <th>输入MLFB</th><th>匹配状态</th><th>产品类别</th><th>产品型号</th><th>产品状态</th><th>MLFB</th><th>列表价格_含税</th><th>标准折扣价格_含税</th><th>产品描述</th>
      </tr></thead><tbody>${lastBatch.map(r => `<tr>
        <td>${esc(r.input)}</td>
        <td class="${r.hit ? 'hit' : 'miss'}">${r.hit ? '已匹配' : '未匹配'}</td>
        <td>${esc(r.category)}</td>
        <td>${esc(r.model)}</td>
        <td>${esc(r.status)}</td>
        <td>${esc(r.mlfb)}</td>
        <td>${esc(r.listPrice)}</td>
        <td>${esc(r.discountPrice)}</td>
        <td>${esc(r.description)}</td>
      </tr>`).join('')}</tbody></table>`;
    }

    toast(`批量查询完成：${lastBatch.filter(x => x.hit).length}/${lastBatch.length} 条命中`);
  }

  function buildRows(rows, batch = false) {
    const header = batch
      ? ['输入MLFB', '匹配状态', '产品类别', '产品型号', '产品状态', 'MLFB', '列表价格_含税', '标准折扣价格_含税', '产品描述']
      : ['产品类别', '产品型号', '产品状态', 'MLFB', '列表价格_含税', '标准折扣价格_含税', '产品描述'];

    const body = rows.map(r => batch
      ? [r.input, r.hit ? '已匹配' : '未匹配', r.category, r.model, r.status, r.mlfb, r.listPrice, r.discountPrice, r.description]
      : [r.category, r.model, r.status, r.mlfb, r.listPrice, r.discountPrice, r.description]
    );

    return [header, ...body];
  }

  function downloadXLSX(rows, fileName) {
    if (!window.XLSX) {
      toast('Excel库未加载：查询可用，导入/导出需联网加载XLSX库');
      return;
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Circular Spare Part');
    XLSX.writeFile(wb, fileName);
    toast('已导出 Excel');
  }

  function exportBatch() {
    if (!lastBatch.length) {
      toast('请先执行批量查询');
      return;
    }
    downloadXLSX(buildRows(lastBatch, true), 'Circular Spare Part批量查询结果.xlsx');
  }

  function exportFullList() {
    downloadXLSX(buildRows(getData()), 'Circular Spare Part全清单.xlsx');
  }

  function downloadTemplate() {
    downloadXLSX([
      ['产品类别', '产品型号', '产品状态', 'MLFB', '列表价格_含税', '标准折扣价格_含税', '产品描述'],
      ['SIMATIC PLC', 'S7-300', '[上新]', '6ES7314-1AG14-0AB0-Z86', '6769.01', '5802', '【原厂三审】SIMATIC S7-300，CPU 314']
    ], 'CircularSparePart_Import_Template.xlsx');
  }

  // 导出当前后台数据为 data.json；管理员本地维护后，可下载此文件并上传覆盖 GitHub 的 data.json
  function exportDataJson() {
    const blob = new Blob([JSON.stringify(getData(), null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast('已导出 data.json');
  }

  function formatPriceInput(id) {
    const el = $(id);
    if (!el) return;
    const n = moneyNumber(el.value);
    if (n !== null) el.value = formatRMB(n);
  }

  function saveItem() {
    ['fListPrice', 'fDiscountPrice'].forEach(formatPriceInput);

    const item = normalize({
      category: $('fCategory')?.value,
      model: $('fModel')?.value,
      status: $('fStatus')?.value,
      mlfb: $('fMlfb')?.value,
      listPrice: $('fListPrice')?.value,
      discountPrice: $('fDiscountPrice')?.value,
      description: $('fDescription')?.value
    });

    if (!item.mlfb || !item.description) {
      toast('MLFB 和产品描述为必填项');
      return;
    }

    const d = getData();
    const i = d.findIndex(x => norm(x.mlfb) === norm(item.mlfb));
    if (i >= 0) {
      d[i] = item;
      toast('已更新备件');
    } else {
      d.unshift(item);
      toast('已新增备件');
    }
    setData(d);
  }

  function clearForm() {
    ['fCategory', 'fModel', 'fStatus', 'fMlfb', 'fListPrice', 'fDiscountPrice', 'fDescription'].forEach(id => {
      const el = $(id);
      if (el) el.value = '';
    });
  }

  function editItem(mlfb) {
    const x = getData().find(i => norm(i.mlfb) === norm(mlfb));
    if (!x) return;
    if ($('fCategory')) $('fCategory').value = x.category;
    if ($('fModel')) $('fModel').value = x.model;
    if ($('fStatus')) $('fStatus').value = x.status;
    if ($('fMlfb')) $('fMlfb').value = x.mlfb;
    if ($('fListPrice')) $('fListPrice').value = x.listPrice;
    if ($('fDiscountPrice')) $('fDiscountPrice').value = x.discountPrice;
    if ($('fDescription')) $('fDescription').value = x.description;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function deleteItem(mlfb) {
    if (!confirm('确认删除这条备件数据？')) return;
    setData(getData().filter(x => norm(x.mlfb) !== norm(mlfb)));
    toast('已删除');
  }

  function renderAdminTable() {
    const q = norm($('adminSearch')?.value || '');
    let d = getData();
    if (q) {
      d = d.filter(x => norm(`${x.category} ${x.model} ${x.status} ${x.mlfb} ${x.description}`).includes(q));
    }

    const box = $('adminTable');
    if (!box) return;

    box.innerHTML = d.length
      ? `<table><thead><tr>
          <th>产品类别</th><th>产品型号</th><th>产品状态</th><th>MLFB</th><th>列表价格_含税</th><th>标准折扣价格_含税</th><th>产品描述</th><th>操作</th>
        </tr></thead><tbody>${d.map(x => `<tr>
          <td>${esc(x.category)}</td>
          <td>${esc(x.model)}</td>
          <td>${esc(x.status)}</td>
          <td>${esc(x.mlfb)}</td>
          <td>${esc(x.listPrice)}</td>
          <td>${esc(x.discountPrice)}</td>
          <td>${esc(x.description)}</td>
          <td><div class="table-actions">
            <button class="btn btn-secondary table-btn" onclick="App.editItem('${jsq(x.mlfb)}')">编辑</button>
            <button class="btn btn-danger table-btn" onclick="App.deleteItem('${jsq(x.mlfb)}')">删除</button>
          </div></td>
        </tr>`).join('')}</tbody></table>`
      : '<div class="hint">暂无数据</div>';
  }

  function renderStats() {
    if ($('statTotal')) $('statTotal').textContent = getData().length;
    if ($('statQueries')) $('statQueries').textContent = logs().length;
  }

  function headerIndex(header, names) {
    const arr = header.map(x => String(x || '').trim().toLowerCase());
    for (const n of names) {
      const i = arr.indexOf(n.toLowerCase());
      if (i >= 0) return i;
    }
    return -1;
  }

  function importRows(rows) {
    if (!rows || rows.length < 2) {
      toast('Excel中没有可导入的数据');
      return;
    }

    const h = rows[0];
    const ic = headerIndex(h, ['产品类别', 'category']);
    const im = headerIndex(h, ['产品型号', 'model']);
    const is = headerIndex(h, ['产品状态', 'status']);
    const imlfb = headerIndex(h, ['MLFB', 'mlfb']);
    const il = headerIndex(h, ['列表价格_含税', 'listPrice']);
    const id = headerIndex(h, ['标准折扣价格_含税', 'discountPrice']);
    const idesc = headerIndex(h, ['产品描述', 'description']);

    let count = 0;
    const d = getData();

    rows.slice(1).forEach(r => {
      const item = normalize({
        category: ic >= 0 ? r[ic] : '',
        model: im >= 0 ? r[im] : '',
        status: is >= 0 ? r[is] : '',
        mlfb: imlfb >= 0 ? r[imlfb] : '',
        listPrice: il >= 0 ? r[il] : '',
        discountPrice: id >= 0 ? r[id] : '',
        description: idesc >= 0 ? r[idesc] : ''
      });

      if (!item.mlfb || !item.description) return;

      const i = d.findIndex(x => norm(x.mlfb) === norm(item.mlfb));
      if (i >= 0) d[i] = item;
      else d.push(item);
      count++;
    });

    setData(d);
    toast(`导入完成：${count} 条`);
  }

  function importFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const name = file.name.toLowerCase();

    if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      toast('请上传 Excel 文件');
      e.target.value = '';
      return;
    }

    if (!window.XLSX) {
      toast('Excel库未加载：请联网后再导入');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      const wb = XLSX.read(ev.target.result, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      importRows(XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }));
      e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
  }

  function uploadAdImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('请上传图片文件');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      localStorage.setItem(AD, ev.target.result);
      renderAd();
      renderAdPreview();
      toast('广告图片已更新');
    };
    reader.readAsDataURL(file);
  }

  function clearAdImage() {
    localStorage.removeItem(AD);
    renderAd();
    renderAdPreview();
    toast('广告图片已清除');
  }

  function openLogin() {
    const m = $('loginModal');
    if (m) m.classList.remove('hide');
    if ($('adminPwd')) $('adminPwd').focus();
  }

  function closeLogin() {
    const m = $('loginModal');
    if (m) m.classList.add('hide');
    if ($('adminPwd')) $('adminPwd').value = '';
  }

  function adminLogin() {
    if (($('adminPwd')?.value || '') !== (localStorage.getItem(PWD) || defaultPassword)) {
      toast('密码不正确');
      return;
    }
    closeLogin();
    setMode('admin');
  }

  function enterAdmin(e) {
    if (e.key === 'Enter') adminLogin();
  }

  function changePassword() {
    const old = $('oldPwd')?.value || '';
    const np = $('newPwd')?.value || '';
    const cp = $('confirmPwd')?.value || '';

    if (old !== (localStorage.getItem(PWD) || defaultPassword)) {
      toast('当前密码不正确');
      return;
    }
    if (!np || np.length < 4) {
      toast('新密码至少4位');
      return;
    }
    if (np !== cp) {
      toast('两次新密码不一致');
      return;
    }

    localStorage.setItem(PWD, np);
    ['oldPwd', 'newPwd', 'confirmPwd'].forEach(id => {
      const el = $(id);
      if (el) el.value = '';
    });
    toast('管理员密码已修改');
  }

  function init() {
    renderAd();
    loadData();
    setMode('user');
  }

  window.addEventListener('load', init);

  return {
    setMode,
    searchSingle,
    enterSearch,
    openBatch,
    closeBatch,
    runBatch,
    exportBatch,
    exportFullList,
    exportDataJson,
    downloadTemplate,
    saveItem,
    clearForm,
    editItem,
    deleteItem,
    renderAdminTable,
    importFile,
    openLogin,
    closeLogin,
    adminLogin,
    enterAdmin,
    changePassword,
    uploadAdImage,
    clearAdImage,
    formatPriceInput,
    resetBuiltInData,
    loadData
  };
})();
