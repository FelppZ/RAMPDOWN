async function uploadToGithub() {
    const token = document.getElementById('gh-token').value;
    const btn = document.getElementById('btn-sync');
    
    if (!token) {
        alert("Por favor, insira o seu Token do GitHub.");
        return;
    }

    // Configurações do seu repositório
    const repo = "felppz/RAMPDOWN"; // ALTERE AQU
    const path = "data.json";
    
    // Organiza os dados atuais para enviar
    const currentData = {
        OATS: { 
            cur: parseFloat(document.getElementById('in-OATS-cur').value) || 0, 
            max: parseFloat(document.getElementById('in-OATS-max').value) || 0 
        },
        SCE: { 
            cur: parseFloat(document.getElementById('in-SCE-cur').value) || 0, 
            max: parseFloat(document.getElementById('in-SCE-max').value) || 0 
        },
        CRIT1: { 
            cur: parseFloat(document.getElementById('in-CRIT1-cur').value) || 0, 
            max: parseFloat(document.getElementById('in-CRIT1-max').value) || 0 
        }
    };

    btn.textContent = "Sincronizando...";
    btn.disabled = true;

    try {
        // 1. Pega o SHA do arquivo atual (necessário para o GitHub aceitar a atualização)
        const getFile = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`);
        const fileData = await getFile.json();
        const sha = fileData.sha;

        // 2. Converte o JSON para Base64 (padrão da API do GitHub)
        const contentBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(currentData, null, 2))));

        // 3. Envia a atualização
        const response = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: "Update KPIs via Dashboard",
                content: contentBase64,
                sha: sha
            })
        });

        if (response.ok) {
            alert("✅ Sincronizado! Todos os monitores serão atualizados em instantes.");
        } else {
            alert("❌ Erro ao sincronizar. Verifique o Token e o caminho do repositório.");
        }
    } catch (err) {
        console.error(err);
        alert("Falha na conexão com o GitHub.");
    } finally {
        btn.textContent = "SINCRONIZAR COM O GITHUB (GLOBAL)";
        btn.disabled = false;
    }
}
