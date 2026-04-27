// --- CONFIGURAÇÃO DO REPOSITÓRIO ---
const REPO_PATH = "felppz/RAMPDOWN"; // COLOQUE SEU USUARIO/REPO AQUI
const FILE_NAME = "data.json";
const kpiList = ['OATS', 'SCE', 'CRIT1'];

// 1. FUNÇÃO PARA CARREGAR OS DADOS LOGO AO ABRIR O EDITOR
async function loadCurrentData() {
    try {
        // Buscamos o arquivo do GitHub Pages (ou da API) para preencher o formulário
        // Usamos um timestamp (?t=...) para evitar que o navegador carregue dados antigos do cache
        const response = await fetch(`https://raw.githubusercontent.com/${REPO_PATH}/main/${FILE_NAME}?t=${new Date().getTime()}`);
        
        if (response.ok) {
            const data = await response.json();
            
            // Preenche os inputs com os valores que estão no GitHub
            kpiList.forEach(id => {
                if (data[id]) {
                    document.getElementById(`in-${id}-cur`).value = data[id].cur;
                    document.getElementById(`in-${id}-max`).value = data[id].max;
                }
            });
            
            // Atualiza a prévia visual (os cards)
            liveCalc();
            console.log("Dados carregados com sucesso.");
        }
    } catch (err) {
        console.warn("Ainda não existem dados no GitHub ou o caminho está incorreto.");
    }
}

// Executa a carga inicial assim que a página termina de carregar
window.onload = loadCurrentData;

// 2. CÁLCULO EM TEMPO REAL (MANTÉM IGUAL)
function liveCalc() {
    kpiList.forEach(id => {
        const cur = parseFloat(document.getElementById(`in-${id}-cur`).value) || 0;
        const max = parseFloat(document.getElementById(`in-${id}-max`).value) || 0;
        
        let percent = max > 0 ? (cur / max) * 100 : 0;
        const displayPercent = percent.toFixed(1);

        document.getElementById(`v-${id}`).textContent = cur;
        document.getElementById(`m-${id}`).textContent = max;
        
        const pBadge = document.getElementById(`p-${id}`);
        pBadge.textContent = displayPercent + "%";
        
        const bar = document.getElementById(`b-${id}`);
        bar.style.width = (percent > 100 ? 100 : percent) + "%";

        pBadge.style.color = (percent < 50) ? 'var(--low)' : (percent < 85) ? 'var(--mid)' : 'var(--high)';
        bar.className = 'progress-fill ' + (percent < 50 ? 'bg-low' : percent < 85 ? 'bg-mid' : 'bg-high');
    });
}

// 3. FUNÇÃO DE SINCRONIZAÇÃO (MANTÉM IGUAL)
async function uploadToGithub() {
    const token = document.getElementById('gh-token').value;
    const btn = document.getElementById('btn-sync');

    if (!token) return alert("Erro: Token do GitHub não inserido.");
    if (REPO_PATH.includes("seu-usuario")) return alert("Erro: Você esqueceu de mudar o REPO_PATH.");

    btn.disabled = true;
    btn.textContent = "CONECTANDO AO GITHUB...";

    const payload = {};
    kpiList.forEach(id => {
        payload[id] = {
            cur: parseFloat(document.getElementById(`in-${id}-cur`).value) || 0,
            max: parseFloat(document.getElementById(`in-${id}-max`).value) || 0
        };
    });

    try {
        const getUrl = `https://api.github.com/repos/${REPO_PATH}/contents/${FILE_NAME}`;
        const fileRes = await fetch(getUrl, {
            headers: { 'Authorization': `token ${token}` }
        });
        
        if (!fileRes.ok) throw new Error("Arquivo data.json não encontrado.");
        
        const fileData = await fileRes.json();
        const sha = fileData.sha;

        const jsonString = JSON.stringify(payload, null, 2);
        const contentBase64 = btoa(unescape(encodeURIComponent(jsonString)));

        const putRes = await fetch(getUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: "Update KPIs",
                content: contentBase64,
                sha: sha
            })
        });

        if (putRes.ok) {
            alert("✅ SUCESSO: Dados sincronizados globalmente!");
        } else {
            const errData = await putRes.json();
            alert("❌ ERRO: " + errData.message);
        }

    } catch (err) {
        alert("❌ FALHA: " + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = "ATUALIZAR TODOS OS MONITORES (SINCRONIZAR)";
    }
}
