<img src="./siemens-logo.png" class="logo" alt="SIEMENS Logo">
    
const App=(()=>{const STORE='circular_spare_part_parts_v63',LOG='circular_spare_part_querylog_v63',AD='circular_spare_part_adimage_v63',PWD='circular_spare_part_admin_pwd_v63';const defaultPassword='admin123';

let data = [];
let lastBatch = [];

async function loadData() {
    try {
        const response =
            await fetch(
                './data.json?v=' + Date.now()
            );

        if (!response.ok) {
            throw new Error(
                '无法读取 data.json'
            );
        }

        data = await response.json();

        renderStats();

        if (typeof renderAdminTable === 'function') {
            renderAdminTable();
        }

    } catch (e) {

        console.error(e);

        data = [];

        alert(
            '后台数据加载失败'
        );
    }
}
       
function $(id){return document.getElementById(id)}function toast(m){const t=$('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)}function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}function jsq(s){return String(s??'').replace(/\\/g,'\\\\').replace(/'/g,"\\'")}function norm(v){return String(v||'').trim().toUpperCase().replace(/\s+/g,'').replace(/[–—]/g,'-')}function getJson(k,f){try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}}function setJson(k,v){localStorage.setItem(k,JSON.stringify(v))}function logs(){return getJson(LOG,[])}function addLog(input,hit){const l=logs();l.unshift({time:new Date().toLocaleString('zh-CN'),input,hit});setJson(LOG,l.slice(0,500));renderStats()}function moneyNumber(v){let s=String(v??'').trim();if(!s)return null;s=s.replace(/RMB/ig,'').replace(/,/g,'').replace(/￥|¥/g,'').trim();const n=Number(s);return Number.isFinite(n)?n:null}function formatRMB(v){const n=moneyNumber(v);if(n===null)return String(v??'');return n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})+' RMB'}function normalize(x){return{category:String(x.category||'').trim(),model:String(x.model||'').trim(),status:String(x.status||'').trim()||'可供',mlfb:String(x.mlfb||'').trim(),listPrice:formatRMB(x.listPrice),discountPrice:formatRMB(x.discountPrice),description:String(x.description||'').trim()}}
         
function getData(){
    return data
        .map(normalize)
        .filter(x=>x.mlfb);
}


function setData(d){

    data = d.map(normalize);

    renderStats();

    renderAdminTable();

}

                

async function resetBuiltInData(){

    await loadData();

    toast('已重新读取 data.json');

}

function find(q){const k=norm(q);return getData().find(x=>norm(x.mlfb)===k||norm(x.mlfb).replace(/-Z86$/,'')===k.replace(/-Z86$/,''))}function setMode(m){$('userView').classList.toggle('hide',m!=='user');$('adminView').classList.toggle('hide',m!=='admin');renderStats();if(m==='admin'){renderAdminTable();renderAdPreview()}}
                
                function renderAd(){const img=localStorage.getItem(AD),html='<strong>Circular Spare Part</strong><span>原厂三审备件 · 官方翻新 · 品质保障</span>';['adContentUser','adContentBatch'].forEach(id=>{const e=$(id);if(!e)return;e.className=img?'':'ad-default';e.innerHTML=img?`<img src="${img}" alt="广告位图片">`:html})}function renderAdPreview(){const p=$('adPreview');if(!p)return;const img=localStorage.getItem(AD);p.innerHTML=img?`<img src="${img}" alt="广告预览">`:'暂无广告图片，用户端将显示默认广告文案'}function renderResult(x,input){$('resultModule').classList.remove('hide');if(!x){$('matchBadge').className='status-badge no';$('matchBadge').textContent='未匹配到 Circular Spare Part';$('resCategory').textContent='—';$('resModel').textContent='—';$('resStatus').textContent='—';$('resMlfb').textContent=input||'—';$('resListPrice').textContent='—';$('resDiscountPrice').textContent='—';$('resDescription').textContent='后台清单暂无该 MLFB，请联系管理员维护。';return}const good=['可供','[上新]','上新'].includes(x.status);$('matchBadge').className=good?'status-badge':(x.status==='即将停售'?'status-badge warn':'status-badge no');$('matchBadge').textContent=good?'已匹配 Circular Spare Part':`已匹配，状态：${x.status}`;$('resCategory').textContent=x.category||'—';$('resModel').textContent=x.model||'—';$('resStatus').textContent=x.status||'—';$('resMlfb').textContent=x.mlfb||'—';$('resListPrice').textContent=x.listPrice||'—';$('resDiscountPrice').textContent=x.discountPrice||'—';$('resDescription').textContent=x.description||'—'}function searchSingle(){const v=$('singleInput').value.trim();if(!v){toast('请输入 MLFB');return}const x=find(v);addLog(v,!!x);renderResult(x,v);toast(x?'查询成功':'未查询到匹配备件')}function enterSearch(e){if(e.key==='Enter')searchSingle()}function openBatch(){$('batchModal').classList.remove('hide');$('batchInput').focus();renderAd()}function closeBatch(){$('batchModal').classList.add('hide')}function runBatch(){const ins=$('batchInput').value.split(/[\n,;，；\t]+/).map(x=>x.trim()).filter(Boolean);if(!ins.length){toast('请先输入批量查询内容');return}lastBatch=ins.map(input=>{const x=find(input);addLog(input,!!x);return x?{...x,input,hit:true}:{input,hit:false,category:'—',model:'—',status:'未匹配',mlfb:input,listPrice:'—',discountPrice:'—',description:'后台清单暂无该 MLFB'}});$('batchResult').innerHTML=`<table><thead><tr><th>输入MLFB</th><th>匹配状态</th><th>产品类别</th><th>产品型号</th><th>产品状态</th><th>MLFB</th><th>列表价格_含税</th><th>标准折扣价格_含税</th><th>产品描述</th></tr></thead><tbody>${lastBatch.map(r=>`<tr><td>${esc(r.input)}</td><td class="${r.hit?'hit':'miss'}">${r.hit?'已匹配':'未匹配'}</td><td>${esc(r.category)}</td><td>${esc(r.model)}</td><td>${esc(r.status)}</td><td>${esc(r.mlfb)}</td><td>${esc(r.listPrice)}</td><td>${esc(r.discountPrice)}</td><td>${esc(r.description)}</td></tr>`).join('')}</tbody></table>`;toast(`批量查询完成：${lastBatch.filter(x=>x.hit).length}/${lastBatch.length} 条命中`)}function rows(rows,batch=false){const h=batch?['输入MLFB','匹配状态','产品类别','产品型号','产品状态','MLFB','列表价格_含税','标准折扣价格_含税','产品描述']:['产品类别','产品型号','产品状态','MLFB','列表价格_含税','标准折扣价格_含税','产品描述'];return[h,...rows.map(r=>batch?[r.input,r.hit?'已匹配':'未匹配',r.category,r.model,r.status,r.mlfb,r.listPrice,r.discountPrice,r.description]:[r.category,r.model,r.status,r.mlfb,r.listPrice,r.discountPrice,r.description])]}function downloadXLSX(r,n){if(!window.XLSX){toast('Excel库未加载：查询可用，导入/导出需联网加载XLSX库');return}const ws=XLSX.utils.aoa_to_sheet(r),wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Circular Spare Part');XLSX.writeFile(wb,n);toast('已导出 Excel')}function exportBatch(){if(!lastBatch.length){toast('请先执行批量查询');return}downloadXLSX(rows(lastBatch,true),'Circular Spare Part批量查询结果.xlsx')}function exportFullList(){downloadXLSX(rows(getData()),'Circular Spare Part全清单.xlsx')}function downloadTemplate(){downloadXLSX([['产品类别','产品型号','产品状态','MLFB','列表价格_含税','标准折扣价格_含税','产品描述'],['SIMATIC PLC','S7-300','[上新]','6ES7314-1AG14-0AB0-Z86','6769.01','5802','【原厂三审】SIMATIC S7-300，CPU 314']],'CircularSparePart_Import_Template.xlsx')}function formatPriceInput(id){const el=$(id),n=moneyNumber(el.value);if(n!==null)el.value=formatRMB(n)}function saveItem(){['fListPrice','fDiscountPrice'].forEach(formatPriceInput);const item=normalize({category:$('fCategory').value,model:$('fModel').value,status:$('fStatus').value,mlfb:$('fMlfb').value,listPrice:$('fListPrice').value,discountPrice:$('fDiscountPrice').value,description:$('fDescription').value});if(!item.mlfb||!item.description){toast('MLFB 和产品描述为必填项');return}const d=getData(),i=d.findIndex(x=>norm(x.mlfb)===norm(item.mlfb));if(i>=0){d[i]=item;toast('已更新备件')}else{d.unshift(item);toast('已新增备件')}setData(d);clearForm()}function clearForm(){['fCategory','fModel','fStatus','fMlfb','fListPrice','fDiscountPrice','fDescription'].forEach(id=>$(id).value='')}function editItem(mlfb){const x=getData().find(i=>norm(i.mlfb)===norm(mlfb));if(!x)return;$('fCategory').value=x.category;$('fModel').value=x.model;$('fStatus').value=x.status;$('fMlfb').value=x.mlfb;$('fListPrice').value=x.listPrice;$('fDiscountPrice').value=x.discountPrice;$('fDescription').value=x.description;window.scrollTo({top:0,behavior:'smooth'})}function deleteItem(mlfb){if(!confirm('确认删除这条备件数据？'))return;setData(getData().filter(x=>norm(x.mlfb)!==norm(mlfb)));toast('已删除')}function renderAdminTable(){const q=norm($('adminSearch')?.value||'');let d=getData();if(q)d=d.filter(x=>norm(`${x.category} ${x.model} ${x.status} ${x.mlfb} ${x.description}`).includes(q));$('adminTable').innerHTML=d.length?`<table><thead><tr><th>产品类别</th><th>产品型号</th><th>产品状态</th><th>MLFB</th><th>列表价格_含税</th><th>标准折扣价格_含税</th><th>产品描述</th><th>操作</th></tr></thead><tbody>${d.map(x=>`<tr><td>${esc(x.category)}</td><td>${esc(x.model)}</td><td>${esc(x.status)}</td><td>${esc(x.mlfb)}</td><td>${esc(x.listPrice)}</td><td>${esc(x.discountPrice)}</td><td>${esc(x.description)}</td><td><div class="table-actions"><button class="btn btn-secondary table-btn" onclick="App.editItem('${jsq(x.mlfb)}')">编辑</button><button class="btn btn-danger table-btn" onclick="App.deleteItem('${jsq(x.mlfb)}')">删除</button></div></td></tr>`).join('')}</tbody></table>`:'<div class="hint">暂无数据</div>'}function renderStats(){$('statTotal').textContent=getData().length;$('statQueries').textContent=logs().length}function headerIndex(h,names){const a=h.map(x=>String(x||'').trim().toLowerCase());for(const n of names){const i=a.indexOf(n.toLowerCase());if(i>=0)return i}return-1}function importRows(rs){if(!rs||rs.length<2){toast('Excel中没有可导入的数据');return}const h=rs[0],ic=headerIndex(h,['产品类别']),im=headerIndex(h,['产品型号']),is=headerIndex(h,['产品状态']),imlfb=headerIndex(h,['mlfb']),il=headerIndex(h,['列表价格_含税']),id=headerIndex(h,['标准折扣价格_含税']),idesc=headerIndex(h,['产品描述']);let count=0;const d=getData();rs.slice(1).forEach(r=>{const item=normalize({category:ic>=0?r[ic]:'',model:im>=0?r[im]:'',status:is>=0?r[is]:'',mlfb:imlfb>=0?r[imlfb]:'',listPrice:il>=0?r[il]:'',discountPrice:id>=0?r[id]:'',description:idesc>=0?r[idesc]:''});if(!item.mlfb||!item.description)return;const i=d.findIndex(x=>norm(x.mlfb)===norm(item.mlfb));if(i>=0)d[i]=item;else d.push(item);count++});setData(d);toast(`导入完成：${count} 条`)}function importFile(e){const f=e.target.files[0];if(!f)return;const name=f.name.toLowerCase();if(!name.endsWith('.xlsx')&&!name.endsWith('.xls')){toast('请上传 Excel 文件');e.target.value='';return}if(!window.XLSX){toast('Excel库未加载：请联网后再导入');e.target.value='';return}const r=new FileReader();r.onload=ev=>{const wb=XLSX.read(ev.target.result,{type:'array'}),ws=wb.Sheets[wb.SheetNames[0]];importRows(XLSX.utils.sheet_to_json(ws,{header:1,defval:''}));e.target.value=''};r.readAsArrayBuffer(f)}function uploadAdImage(e){const f=e.target.files[0];if(!f)return;if(!f.type.startsWith('image/')){toast('请上传图片文件');return}const r=new FileReader();r.onload=ev=>{localStorage.setItem(AD,ev.target.result);renderAd();renderAdPreview();toast('广告图片已更新')};r.readAsDataURL(f)}function clearAdImage(){localStorage.removeItem(AD);renderAd();renderAdPreview();toast('广告图片已清除')}function openLogin(){$('loginModal').classList.remove('hide');$('adminPwd').focus()}function closeLogin(){$('loginModal').classList.add('hide');$('adminPwd').value=''}function adminLogin(){if($('adminPwd').value!==(localStorage.getItem(PWD)||defaultPassword)){toast('密码不正确');return}closeLogin();setMode('admin')}function enterAdmin(e){if(e.key==='Enter')adminLogin()}function changePassword(){const old=$('oldPwd').value,np=$('newPwd').value,cp=$('confirmPwd').value;if(old!==(localStorage.getItem(PWD)||defaultPassword)){toast('当前密码不正确');return}if(!np||np.length<4){toast('新密码至少4位');return}if(np!==cp){toast('两次新密码不一致');return}localStorage.setItem(PWD,np);['oldPwd','newPwd','confirmPwd'].forEach(id=>$(id).value='');toast('管理员密码已修改')}


async function init(){

    renderAd();

    await loadData();

    setMode('user');

}


window.addEventListener('load',init);return{setMode,searchSingle,enterSearch,openBatch,closeBatch,runBatch,exportBatch,exportFullList,downloadTemplate,saveItem,clearForm,editItem,deleteItem,renderAdminTable,importFile,openLogin,closeLogin,adminLogin,enterAdmin,changePassword,uploadAdImage,clearAdImage,formatPriceInput,resetBuiltInData};})();
