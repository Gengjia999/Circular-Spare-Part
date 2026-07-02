const App = (() => {

const LOG='circular_spare_part_querylog_v63';
const AD='circular_spare_part_adimage_v63';
const PWD='circular_spare_part_admin_pwd_v63';

const defaultPassword='admin123';

let data = [];
let lastBatch = [];

async function loadData() {
    try {
        const res = await fetch('./data.json?v=' + Date.now());

        if (!res.ok) {
            throw new Error('data.json 不存在');
        }

        data = await res.json();

        renderStats();

        if (typeof renderAdminTable === 'function') {
            renderAdminTable();
        }

        console.log('数据加载成功:', data.length);

    } catch (e) {

        console.error(e);

        data = [];

        toast('后台数据加载失败');
    }
}

function getData() {
    return data
        .map(normalize)
        .filter(x => x.mlfb);
}

function setData(d) {

    data = d.map(normalize);

    renderStats();

    renderAdminTable();
}

async function resetBuiltInData() {

    await loadData();

    toast('已从 data.json 重新加载数据');
}
