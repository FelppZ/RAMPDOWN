// --- CONFIGURAÇÃO (AJUSTE AQUI) ---
const REPO_PATH = "felppz/RAMPDOWN"; // Ex: "joao/projeto-kpi"
const FILE_NAME = "data.json";
const kpiList = ['OATS', 'SCE', 'CRIT1'];

/**
 * 1. CARGA INICIAL (Híbrida: Local + Nuvem)
 */
async function loadCurrentData() {
    // Primeiro, tenta carregar do navegador (rápido e evita campos vazios)
    const localData = localStorage.getItem('rampdown_backup');
    if (localData) {
        fillFields(JSON.parse(localData));
        console.log("Dados carregados do cache local.");
    }

    // Depois, tenta buscar a versão oficial do GitHub para garantir que está atualizado
    try {
        const response = await fetch(`https://raw.githubusercontent.com/${REPO_PATH}/main/${FILE_NAME}?t=${new Date().getTime()}`);
        if (response.ok) {
            const remoteData = await response.json();
            fillFields(remoteData);
            // Atualiza o backup local com o que veio da nuvem
            localStorage.setItem('rampdown_backup', JSON.stringify(remoteData));
            console.log("Dados sincronizados com o GitHub.");
        }
    } catch (err) {
        console.warn("Não foi possível sincronizar com a nuvem, usando dados locais.");
    }
}

// Função auxiliar para preencher os campos
function fillFields(data) {
    kpiList.forEach(id => {
        if (data[id]) {
            document.getElementById(`in-${id}-cur`).value = data[id].cur;
            document.getElementById(`in-${id}-max`).value = data[id].max;
        }
    });
    liveCalc(); // Atualiza as barras e %
}

/**
 * 2. CÁLCULO EM TEMPO REAL
 */
function liveCalc() {
    kpiList.forEach(id => {
        const cur = parseFloat(document.getElementById(`in-${id}-cur`).value) || 0;
        const max = parseFloat(document.getElementById(`in-${id}-max`).value) || 0;
        
        let percent = max > 0 ? (cur / max) * 100 : 0;
        
        document.getElementById(`v-${id}`).textContent = cur;
        document.getElementById(`m-${id}`).textContent = max;
        document.getElementById(`p-${id}`).textContent = percent.toFixed(1) + "%";
        
        const bar = document.getElementById(`b-${id}`);
        bar.style.width = (percent > 100 ? 100 : percent) + "%";
        bar.className = 'progress-fill ' + (percent < 50 ? 'bg-low' : percent < 85 ? 'bg-mid' : 'bg-high');
        document.getElementById(`p-${id}`).style.color = (percent < 50) ? 'var(--low)' : (percent < 85) ? 'var(--mid)' : 'var(--high)';
    });
}

/**
 * 3. SINCRONIZAR (SALVAR NO GITHUB)
 */
async function uploadToGithub() {
    const token = document.getElementById('gh-token').value;
    const btn = document.getElementById('btn-sync');

    if (!token) return alert("⚠️ Insira o Token do GitHub.");
    
    btn.disabled = true;
    btn.textContent = "SALVANDO...";

    const payload = {};
    kpiList.forEach(id => {
        payload[id] = {
            cur: parseFloat(document.getElementById(`in-${id}-cur`).value) || 0,
            max: parseFloat(document.getElementById(`in-${id}-max`).value) || 0
        };
    });

    // Salva no navegador IMEDIATAMENTE
    localStorage.setItem('rampdown_backup', JSON.stringify(payload));

    try {
        const getUrl = `https://api.github.com/repos/${REPO_PATH}/contents/${FILE_NAME}`;
        const fileRes = await fetch(getUrl, { headers: { 'Authorization': `token ${token}` } });
        
        if (!fileRes.ok) throw new Error("Arquivo não encontrado no GitHub.");
        
        const fileData = await fileRes.json();
        const sha = fileData.sha;
        const contentBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload, null, 2))));

        const putRes = await fetch(getUrl, {
            method: 'PUT',
            headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: "Update KPIs", content: contentBase64, sha: sha })
        });

        if (putRes.ok) {
            alert("✅ Salvo com sucesso no GitHub e no Navegador!");
        } else {
            alert("❌ Erro ao salvar no GitHub, mas os dados foram mantidos neste computador.");
        }
    } catch (err) {
        alert("❌ Falha de conexão: Os dados ficaram salvos apenas neste computador por enquanto.");
    } finally {
        btn.disabled = false;
        btn.textContent = "ATUALIZAR TODOS OS MONITORES (SINCRONIZAR)";
    }
}

window.onload = loadCurrentData;
