// --- CONFIGURAÇÃO DO REPOSITÓRIO (OBRIGATÓRIO ALTERAR) ---
const REPO_PATH = "felppz/RAMPDOWN"; // Exemplo: "joaosilva/dashboard-kpi"
const FILE_NAME = "data.json";
const kpiList = ['OATS', 'SCE', 'CRIT1'];

/**
 * 1. CARGA INICIAL
 * Busca os dados atuais diretamente do GitHub para preencher os campos ao abrir a página.
 */
async function loadCurrentData() {
    try {
        // O uso do timestamp (?t=...) força o navegador a buscar a versão mais recente sem cache
        const response = await fetch(`https://raw.githubusercontent.com/${REPO_PATH}/main/${FILE_NAME}?t=${new Date().getTime()}`);
        
        if (response.ok) {
            const data = await response.json();
            
            kpiList.forEach(id => {
                if (data[id]) {
                    // Preenche os campos de input
                    document.getElementById(`in-${id}-cur`).value = data[id].cur;
                    document.getElementById(`in-${id}-max`).value = data[id].max;
                }
            });
            
            // Dispara o cálculo visual para atualizar os cards e barras
            liveCalc();
            console.log("Dados globais carregados com sucesso.");
        } else {
            console.warn("Arquivo data.json não encontrado ou repositório privado.");
        }
    } catch (err) {
        console.error("Erro na carga inicial:", err);
    }
}

/**
 * 2. CÁLCULO EM TEMPO REAL
 * Atualiza os cards, porcentagens e cores conforme o usuário digita.
 */
function liveCalc() {
    kpiList.forEach(id => {
        const curInput = document.getElementById(`in-${id}-cur`);
        const maxInput = document.getElementById(`in-${id}-max`);
        
        const cur = parseFloat(curInput.value) || 0;
        const max = parseFloat(maxInput.value) || 0;
        
        // Cálculo da porcentagem
        let percent = max > 0 ? (cur / max) * 100 : 0;
        const displayPercent = percent.toFixed(1);

        // Atualiza os elementos de texto no Dashboard
        document.getElementById(`v-${id}`).textContent = cur;
        document.getElementById(`m-${id}`).textContent = max;
        
        const pBadge = document.getElementById(`p-${id}`);
        pBadge.textContent = displayPercent + "%";
        
        // Atualiza a largura da barra de progresso (limite de 100% visual)
        const bar = document.getElementById(`b-${id}`);
        bar.style.width = (percent > 100 ? 100 : percent) + "%";

        // Lógica Dinâmica de Cores (CSS Variables)
        // Abaixo de 50% = Vermelho | Até 85% = Amarelo | Acima = Verde
        pBadge.style.color = (percent < 50) ? 'var(--low)' : (percent < 85) ? 'var(--mid)' : 'var(--high)';
        bar.className = 'progress-fill ' + (percent < 50 ? 'bg-low' : percent < 85 ? 'bg-mid' : 'bg-high');
    });
}

/**
 * 3. SINCRONIZAÇÃO COM GITHUB (API)
 * Envia os valores atuais para o repositório global.
 */
async function uploadToGithub() {
    const token = document.getElementById('gh-token').value;
    const btn = document.getElementById('btn-sync');

    if (!token) {
        alert("⚠️ Erro: Insira o seu Token do GitHub para sincronizar.");
        return;
    }

    if (REPO_PATH.includes("seu-usuario")) {
        alert("⚠️ Erro: Altere o REPO_PATH no início do script para o seu caminho real.");
        return;
    }

    // Bloqueia o botão para evitar múltiplos cliques
    btn.disabled = true;
    btn.textContent = "CONECTANDO AO GITHUB...";

    // Monta o objeto JSON com os dados atuais da tela
    const payload = {};
    kpiList.forEach(id => {
        payload[id] = {
            cur: parseFloat(document.getElementById(`in-${id}-cur`).value) || 0,
            max: parseFloat(document.getElementById(`in-${id}-max`).value) || 0
        };
    });

    try {
        const getUrl = `https://api.github.com/repos/${REPO_PATH}/contents/${FILE_NAME}`;
        
        // Passo A: Obter o SHA do arquivo atual (necessário para sobrescrever no GitHub)
        const fileRes = await fetch(getUrl, {
            headers: { 'Authorization': `token ${token}` }
        });
        
        if (!fileRes.ok) throw new Error("Arquivo data.json não encontrado no repositório.");
        
        const fileData = await fileRes.json();
        const sha = fileData.sha;

        // Passo B: Converter JSON para Base64 (exigência da API do GitHub)
        const jsonString = JSON.stringify(payload, null, 2);
        const contentBase64 = btoa(unescape(encodeURIComponent(jsonString)));

        // Passo C: Enviar o novo arquivo via método PUT
        const putRes = await fetch(getUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: "Update KPIs via Dashboard Editor",
                content: contentBase64,
                sha: sha
            })
        });

        if (putRes.ok) {
            alert("✅ SUCESSO: Os dados foram salvos e todos os monitores serão atualizados!");
        } else {
            const errData = await putRes.json();
            alert("❌ ERRO DA API: " + errData.message);
        }

    } catch (err) {
        alert("❌ FALHA NA CONEXÃO: " + err.message);
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.textContent = "ATUALIZAR TODOS OS MONITORES (SINCRONIZAR)";
    }
}

// Inicializa a carga dos dados assim que a janela carregar
window.onload = loadCurrentData;
