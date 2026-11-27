const categoriasDespesa = [
    "Essencial",
    "Alimentação",
    "Delivery",
    "Streaming",
    "Transporte",
    "Saúde",
    "Educação",
    "Lazer",
    "Outros"
];

const movimentacoes = JSON.parse(localStorage.getItem("movimentacoes")) || [];

const nomesMeses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

let limites = JSON.parse(localStorage.getItem("limites")) || {};

const formLimite = document.getElementById("form-limite");
const limiteCategoria = document.getElementById("limite-categoria");
const limiteValor = document.getElementById("limite-valor");
const listaLimites = document.getElementById("lista-limites");
const metasMes = document.getElementById("metas-mes");
const metasAno = document.getElementById("metas-ano");



categoriasDespesa.forEach((nome) => {
    const opcao = document.createElement("option");

    opcao.value = nome;
    opcao.textContent = nome;

    limiteCategoria.appendChild(opcao);
});

nomesMeses.forEach((nome, indice) => {
    const opcao = document.createElement("option");

    opcao.value = indice;
    opcao.textContent = nome;

    metasMes.appendChild(opcao);
});

function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function apareceNoMes(item, mesSelecionado, anoSelecionado) {
    const [anoItem, mesItem] = item.data.split("-");

    const mesesDoItem = Number(anoItem) * 12 + (Number(mesItem) - 1);
    const mesesSelecionado = anoSelecionado * 12 + mesSelecionado;

    if (item.recorrente) {
        if (item.encerradaEm !== undefined && mesesSelecionado >= item.encerradaEm) {
            return false;
        }

        return mesesSelecionado >= mesesDoItem;
    }

    return mesesSelecionado === mesesDoItem;
}

function gastoDaCategoria(categoria, mes, ano) {
    return movimentacoes
        .filter((item) => {
            return (
                item.tipo === "despesa" &&
                item.categoria === categoria &&
                apareceNoMes(item, mes, ano)
            );
        })
        .reduce((total, item) => total + item.valor, 0);
}

function salvarLimites() {
    localStorage.setItem("limites", JSON.stringify(limites));
}

function excluirLimite(categoria) {
    confirmarAcao("Deseja excluir este limite?", () => {
        delete limites[categoria];

        salvarLimites();
        exibirLimites();
    });
}

function exibirLimites() {
    listaLimites.innerHTML = "";

    const mes = Number(metasMes.value);
    const ano = Number(metasAno.value);

    const itens = Object.entries(limites);

    if (itens.length === 0) {
        const vazio = document.createElement("li");
        vazio.classList.add("mensagem-vazia");
        vazio.textContent = "Nenhum limite definido ainda.";
        listaLimites.appendChild(vazio);
        return;
    }

    itens.forEach(([categoria, limite]) => {
        const gasto = gastoDaCategoria(categoria, mes, ano);
        const percentual = (gasto / limite) * 100;

        const li = document.createElement("li");

        const nome = document.createElement("span");
        nome.classList.add("nome-movimentacao");
        nome.textContent = categoria;

        const valorLimite = document.createElement("span");
        valorLimite.classList.add("valor-limite");
        valorLimite.textContent = formatarMoeda(limite);

        const btnExcluir = document.createElement("button");
        btnExcluir.textContent = "Excluir";
        btnExcluir.classList.add("btn-excluir");

        btnExcluir.addEventListener("click", () => {
            excluirLimite(categoria);
        });

        const barra = document.createElement("div");
        barra.classList.add("barra");

        const preenchimento = document.createElement("div");
        preenchimento.classList.add("barra-preenchimento");
        preenchimento.style.width = `${Math.min(percentual, 100)}%`;

        if (percentual > 100) {
            preenchimento.classList.add("estourou");
        } else if (percentual >= 80) {
            preenchimento.classList.add("alerta");
        }

        barra.appendChild(preenchimento);

        const detalhe = document.createElement("span");
        detalhe.classList.add("detalhe-limite");

        if (percentual > 100) {
            detalhe.textContent = `Gasto: ${formatarMoeda(gasto)} — passou ${formatarMoeda(gasto - limite)}`;
        } else {
            detalhe.textContent = `Gasto: ${formatarMoeda(gasto)} (${percentual.toFixed(0)}%)`;
        }

        li.appendChild(nome);
        li.appendChild(valorLimite);
        li.appendChild(btnExcluir);
        li.appendChild(barra);
        li.appendChild(detalhe);

        listaLimites.appendChild(li);
    });
}
formLimite.addEventListener("submit", (event) => {
    event.preventDefault();

    const valor = Number(limiteValor.value);

    if (!Number.isFinite(valor) || valor <= 0) {
        mostrarAviso("Informe um limite válido.");
        return;
    }

    limites[limiteCategoria.value] = valor;

    salvarLimites();
    exibirLimites();


    formLimite.reset();
});

exibirLimites();

metasMes.addEventListener("change", exibirLimites);
metasAno.addEventListener("change", exibirLimites);

let metas = JSON.parse(localStorage.getItem("metas")) || [];

function dataDeHoje() {
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    return `${hoje.getFullYear()}-${mes}-${dia}`;
}

function totalGuardado(meta) {
    return meta.depositos.reduce((total, deposito) => total + deposito.valor, 0);
}

function saldoDisponivelHoje() {
    const hoje = new Date();
    const mes = hoje.getMonth();
    const ano = hoje.getFullYear();
    const mesesAtual = ano * 12 + mes;

    let saldo = 0;

    movimentacoes.forEach((item) => {
        if (apareceNoMes(item, mes, ano)) {
            saldo += item.tipo === "receita" ? item.valor : -item.valor;
        }
    });

    metas.forEach((meta) => {
        meta.depositos.forEach((deposito) => {
            if (!deposito.data) {
                return;
            }

            const [anoDeposito, mesDeposito] = deposito.data.split("-");
            const mesesDoDeposito = Number(anoDeposito) * 12 + (Number(mesDeposito) - 1);

            if (mesesDoDeposito === mesesAtual) {
                saldo -= deposito.valor;
            }
        });
    });

    return Math.round(saldo * 100) / 100;
}


metas.forEach((meta) => {
    if (!Array.isArray(meta.depositos)) {
        meta.depositos = [];

        if (meta.guardado > 0) {
            meta.depositos.push({ id: Date.now(), valor: meta.guardado, data: null });
        }

        delete meta.guardado;
    }
});

localStorage.setItem("metas", JSON.stringify(metas));

const formMeta = document.getElementById("form-meta");
const metaNome = document.getElementById("meta-nome");
const metaAlvo = document.getElementById("meta-alvo");
const listaMetas = document.getElementById("lista-metas");

function salvarMetas() {
    localStorage.setItem("metas", JSON.stringify(metas));
}

function excluirMeta(id) {
    const meta = metas.find((item) => item.id === id);
    const guardado = totalGuardado(meta);

    const mensagem = guardado > 0
        ? `Esta meta tem ${formatarMoeda(guardado)} guardados. Excluir devolve esse valor ao saldo dos meses em que foi depositado. Para devolver só ao mês atual, resgate antes. Excluir mesmo assim?`
        : "Deseja excluir esta meta?";

    confirmarAcao(mensagem, () => {
        metas = metas.filter((item) => item.id !== id);

        salvarMetas();
        exibirMetas();
    });
}

function exibirMetas() {
    listaMetas.innerHTML = "";

    if (metas.length === 0) {
        const vazio = document.createElement("li");
        vazio.classList.add("mensagem-vazia");
        vazio.textContent = "Nenhuma meta criada ainda.";
        listaMetas.appendChild(vazio);
        return;
    }

    metas.forEach((meta) => {

        const guardado = totalGuardado(meta);
        const percentual = (guardado / meta.alvo) * 100;

        const li = document.createElement("li");

        const nome = document.createElement("span");
        nome.classList.add("nome-movimentacao");
        nome.textContent = meta.nome;

        const valores = document.createElement("span");
        valores.classList.add("valor-limite");
        valores.textContent =
            `${formatarMoeda(guardado)} de ${formatarMoeda(meta.alvo)}`;

        const btnExcluir = document.createElement("button");
        btnExcluir.textContent = "Excluir";
        btnExcluir.classList.add("btn-excluir");

        btnExcluir.addEventListener("click", () => {
            excluirMeta(meta.id);
        });

        const barra = document.createElement("div");
        barra.classList.add("barra");

        const preenchimento = document.createElement("div");
        preenchimento.classList.add("barra-preenchimento");
        preenchimento.style.width = `${Math.min(percentual, 100)}%`;

        barra.appendChild(preenchimento);

        const detalhe = document.createElement("span");
        detalhe.classList.add("detalhe-limite");

        if (percentual >= 100) {
            detalhe.textContent = "Meta atingida!";
        } else {
            detalhe.textContent =
                `${percentual.toFixed(0)}% guardado — faltam ${formatarMoeda(meta.alvo - guardado)}`;
        }

        const formGuardar = document.createElement("form");
        formGuardar.classList.add("form-linha", "form-guardar");

        const campoValor = document.createElement("input");
        campoValor.type = "number";
        campoValor.step = "0.01";
        campoValor.min = "0.01";
        campoValor.placeholder = "Valor guardado (R$)";
        campoValor.setAttribute("aria-label", "Valor a guardar");

        const btnGuardar = document.createElement("button");
        btnGuardar.type = "submit";
        btnGuardar.textContent = "Guardar";

        formGuardar.appendChild(campoValor);
        formGuardar.appendChild(btnGuardar);

        formGuardar.addEventListener("submit", (event) => {
            event.preventDefault();

            const valorGuardado = Number(campoValor.value);

            if (!Number.isFinite(valorGuardado) || valorGuardado <= 0) {
                mostrarAviso("Informe um valor válido.");
                return;
            }

                        const disponivel = saldoDisponivelHoje();

            if (valorGuardado > disponivel) {
                mostrarAviso(
                    `Saldo insuficiente. Disponível este mês: ${formatarMoeda(Math.max(disponivel, 0))}.`
                );
                return;
            }

            meta.depositos.push({
                id: Date.now(),
                valor: Math.round(valorGuardado * 100) / 100,
                data: dataDeHoje()
            });

            salvarMetas();
            exibirMetas();
        });

                const formResgatar = document.createElement("form");
        formResgatar.classList.add("form-linha", "form-guardar");

        const campoResgate = document.createElement("input");
        campoResgate.type = "number";
        campoResgate.step = "0.01";
        campoResgate.min = "0.01";
        campoResgate.placeholder = "Valor a resgatar (R$)";
        campoResgate.setAttribute("aria-label", "Valor a resgatar");

        const btnResgatar = document.createElement("button");
        btnResgatar.type = "submit";
        btnResgatar.textContent = "Resgatar";

        formResgatar.appendChild(campoResgate);
        formResgatar.appendChild(btnResgatar);

        formResgatar.addEventListener("submit", (event) => {
            event.preventDefault();

            const valorResgate = Number(campoResgate.value);
            const disponivelNaMeta = totalGuardado(meta);

            if (!Number.isFinite(valorResgate) || valorResgate <= 0) {
                mostrarAviso("Informe um valor válido.");
                return;
            }

            if (valorResgate > disponivelNaMeta) {
                mostrarAviso(
                    `Você só tem ${formatarMoeda(disponivelNaMeta)} guardado nesta meta.`
                );
                return;
            }

            meta.depositos.push({
                id: Date.now(),
                valor: -Math.round(valorResgate * 100) / 100,
                data: dataDeHoje()
            });

            salvarMetas();
            exibirMetas();
        });

        li.appendChild(nome);
        li.appendChild(valores);
        li.appendChild(btnExcluir);
        li.appendChild(barra);
        li.appendChild(detalhe);
        li.appendChild(formGuardar);
        if (guardado > 0) {
            li.appendChild(formResgatar);
        }

        listaMetas.appendChild(li);
    });
}

formMeta.addEventListener("submit", (event) => {
    event.preventDefault();

    const nome = metaNome.value.trim();
    const alvo = Number(metaAlvo.value);

    if (nome === "" || !Number.isFinite(alvo) || alvo <= 0) {
        mostrarAviso("Informe o nome e um valor alvo válido.");
        return;
    }

    metas.push({
        id: Date.now(),
        nome: nome,
        alvo: alvo,
        depositos: []
    });

    salvarMetas();
    exibirMetas();

    formMeta.reset();
});

exibirMetas();
