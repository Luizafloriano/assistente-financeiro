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

const formMeta = document.getElementById("form-meta");
const metaNome = document.getElementById("meta-nome");
const metaAlvo = document.getElementById("meta-alvo");
const listaMetas = document.getElementById("lista-metas");

function salvarMetas() {
    localStorage.setItem("metas", JSON.stringify(metas));
}

function excluirMeta(id) {
    confirmarAcao("Deseja excluir esta meta?", () => {
        metas = metas.filter((meta) => meta.id !== id);

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
        const percentual = (meta.guardado / meta.alvo) * 100;

        const li = document.createElement("li");

        const nome = document.createElement("span");
        nome.classList.add("nome-movimentacao");
        nome.textContent = meta.nome;

        const valores = document.createElement("span");
        valores.classList.add("valor-limite");
        valores.textContent =
            `${formatarMoeda(meta.guardado)} de ${formatarMoeda(meta.alvo)}`;

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
                `${percentual.toFixed(0)}% guardado — faltam ${formatarMoeda(meta.alvo - meta.guardado)}`;
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

            meta.guardado = Math.round((meta.guardado + valorGuardado) * 100) / 100;

            salvarMetas();
            exibirMetas();
        });

        li.appendChild(nome);
        li.appendChild(valores);
        li.appendChild(btnExcluir);
        li.appendChild(barra);
        li.appendChild(detalhe);
        li.appendChild(formGuardar);

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
        guardado: 0
    });

    salvarMetas();
    exibirMetas();

    formMeta.reset();
});

exibirMetas();
