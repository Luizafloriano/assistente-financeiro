
const btnAdicionar = document.getElementById("btn-adicionar");
const modal = document.getElementById("modal");
const btnCancelar = document.getElementById("btn-cancelar");
const formulario = document.getElementById("form-movimentacao");
const descricao = document.getElementById("descricao");
const valor = document.getElementById("valor");
const data = document.getElementById("data");
const recorrente = document.getElementById("recorrente");
const listaMovimentacoes = document.getElementById("lista-movimentacoes");
const seletorMes = document.getElementById("seletor-mes");
const seletorAno = document.getElementById("seletor-ano");
const valorSaldo = document.getElementById("valor-saldo");
const valorReceitas = document.getElementById("valor-receitas");
const valorDespesas = document.getElementById("valor-despesas");
const graficoReceitasDespesas = document.getElementById("grafico-receitas-despesas");
const legendaReceitasDespesas = document.getElementById("legenda-receitas-despesas");
const graficoCategorias = document.getElementById("grafico-categorias");
const legendaCategorias = document.getElementById("legenda-categorias");
const comparacaoSaldo = document.getElementById("comparacao-saldo");
const valorGuardado = document.getElementById("valor-guardado");

let movimentacoes = JSON.parse(localStorage.getItem("movimentacoes")) || [];

movimentacoes.forEach((item, indice) => {
    if (!item.id) {
        item.id = Date.now() + indice;
    }
});

let idEmEdicao = null;

function fecharModal() {
    modal.classList.remove("ativo");
    formulario.reset();
    atualizarCategorias();
    idEmEdicao = null;
    document.getElementById("modal-titulo").textContent = "Nova movimentação";
}


function abrirEdicao(id) {
    const item = movimentacoes.find((mov) => mov.id === id);

    idEmEdicao = id;

    tipo.value = item.tipo;
    atualizarCategorias();

    descricao.value = item.descricao;
    valor.value = item.valor;
    categoria.value = item.categoria;
    data.value = item.data;
    recorrente.checked = item.recorrente;

    document.getElementById("modal-titulo").textContent = "Editar movimentação";
    modal.classList.add("ativo");
}

localStorage.setItem("movimentacoes", JSON.stringify(movimentacoes));

function formatarPercentual(parte, total) {
    if (total === 0) {
        return "0,0%";
    }

    const percentual = (parte / total) * 100;

    return percentual.toFixed(1).replace(".", ",") + "%";
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

function lerMetas() {
    return JSON.parse(localStorage.getItem("metas")) || [];
}

function guardadoNoMes(mes, ano) {
    const mesesSelecionado = ano * 12 + mes;
    let total = 0;

    lerMetas().forEach((meta) => {
        (meta.depositos || []).forEach((deposito) => {
            if (!deposito.data) {
                return;
            }

            const [anoDeposito, mesDeposito] = deposito.data.split("-");
            const mesesDoDeposito = Number(anoDeposito) * 12 + (Number(mesDeposito) - 1);

            if (mesesDoDeposito === mesesSelecionado) {
                total += deposito.valor;
            }
        });
    });

    return Math.round(total * 100) / 100;
}

function atualizarGraficoReceitasDespesas() {
    const mesSelecionado = Number(seletorMes.value);
    const anoSelecionado = Number(seletorAno.value);

    const movimentacoesFiltradas = movimentacoes.filter((item) => {
        return apareceNoMes(item, mesSelecionado, anoSelecionado);
    });

    let receitas = 0;
    let despesas = 0;

    movimentacoesFiltradas.forEach((item) => {
        if (item.tipo === "receita") {
            receitas += item.valor;
        } else if (item.tipo === "despesa") {
            despesas += item.valor;
        }
    });

    const total = receitas + despesas;

    if (total === 0) {
        graficoReceitasDespesas.style.background = "var(--cor-borda)";
    } else {
        const percentualReceitas = (receitas / total) * 100;

        graficoReceitasDespesas.style.background =
            `conic-gradient(
                var(--cor-receita) 0% ${percentualReceitas}%,
                var(--cor-despesa) ${percentualReceitas}% 100%
            )`;
    }

    legendaReceitasDespesas.innerHTML = "";

    if (total === 0) {
    const vazio = document.createElement("li");
    vazio.classList.add("mensagem-vazia");
    vazio.textContent = "Sem lançamentos neste mês.";
    legendaReceitasDespesas.appendChild(vazio);
    return;
}

    const itens = [
        { nome: "Receitas", valor: receitas, classe: "receita" },
        { nome: "Despesas", valor: despesas, classe: "despesa" }
    ];

    itens.forEach((item) => {
        const li = document.createElement("li");

        li.classList.add(item.classe);

        li.textContent = `${item.nome}: ${item.valor.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        })} (${formatarPercentual(item.valor, total)})`;

        legendaReceitasDespesas.appendChild(li);
    });
}


function atualizarGraficoCategorias() {
    const mesSelecionado = Number(seletorMes.value);
    const anoSelecionado = Number(seletorAno.value);

    const despesasFiltradas = movimentacoes.filter((item) => {
        return (
            item.tipo === "despesa" &&
            apareceNoMes(item, mesSelecionado, anoSelecionado)
        );
    });

    const totaisCategorias = {};

    despesasFiltradas.forEach((item) => {
        if (totaisCategorias[item.categoria]) {
            totaisCategorias[item.categoria] += item.valor;
        } else {
            totaisCategorias[item.categoria] = item.valor;
        }
    });

    const categorias = Object.entries(totaisCategorias);
    const totalDespesas = despesasFiltradas.reduce(
        (total, item) => total + item.valor,
        0
    );

    const cores = [
        "#1D304A",
        "#3985A8",
        "#E5A13A",
        "#B47A5A",
        "#8295A8",
        "#7DB9D6",
        "#C8B88A",
        "#4A5568",
        "#2F5D7C"
    ];

    let inicio = 0;

    if (totalDespesas === 0) {
        graficoCategorias.style.background = "var(--cor-borda)";
    } else {
        const partes = categorias.map(([nome, valor], indice) => {
            const percentual = (valor / totalDespesas) * 100;
            const fim = inicio + percentual;

            const parte = `${cores[indice % cores.length]} ${inicio}% ${fim}%`;

            inicio = fim;

            return parte;
        });

        graficoCategorias.style.background =
            `conic-gradient(${partes.join(", ")})`;
    }

    legendaCategorias.innerHTML = "";

    if (categorias.length === 0) {
    const vazio = document.createElement("li");
    vazio.classList.add("mensagem-vazia");
    vazio.textContent = "Sem despesas neste mês.";
    legendaCategorias.appendChild(vazio);
    return;
}

    categorias.forEach(([nome, valor], indice) => {
        const li = document.createElement("li");

        li.style.setProperty(
            "--cor-categoria",
            cores[indice % cores.length]
        );

        li.textContent = `${nome}: ${valor.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        })} (${formatarPercentual(valor, totalDespesas)})`;

        legendaCategorias.appendChild(li);
    });
}

function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function calcularSaldo(mes, ano) {
    let saldo = 0;
    let quantidade = 0;

    movimentacoes.forEach((item) => {
        if (apareceNoMes(item, mes, ano)) {
            quantidade++;

            if (item.tipo === "receita") {
                saldo += item.valor;
            } else {
                saldo -= item.valor;
            }
        }
    });

    saldo -= guardadoNoMes(mes, ano);

    return { saldo, quantidade };
}

function atualizarResumo() {
    const mesSelecionado = Number(seletorMes.value);
    const anoSelecionado = Number(seletorAno.value);

    const movimentacoesFiltradas = movimentacoes.filter((item) => {
        return apareceNoMes(item, mesSelecionado, anoSelecionado);
    });

    let receitas = 0;
    let despesas = 0;

    movimentacoesFiltradas.forEach((item) => {
        if (item.tipo === "receita") {
            receitas += item.valor;
        } else if (item.tipo === "despesa") {
            despesas += item.valor;
        }
    });

    const guardado = guardadoNoMes(mesSelecionado, anoSelecionado);
    const saldo = Math.round((receitas - despesas - guardado) * 100) / 100;

    valorSaldo.textContent = saldo.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

    valorReceitas.textContent = receitas.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

    valorDespesas.textContent = despesas.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });


        const anterior = calcularSaldo(mesSelecionado - 1, anoSelecionado);

    comparacaoSaldo.classList.remove("positiva", "negativa");

    valorGuardado.textContent = formatarMoeda(guardado);

    if (anterior.quantidade === 0) {
        comparacaoSaldo.textContent = "Sem dados no mês anterior";
        return;
    }

    const nomeAnterior = seletorMes.options[(mesSelecionado + 11) % 12].textContent;
    const diferenca = Math.round((saldo - anterior.saldo) * 100) / 100;

    if (diferenca === 0) {
        comparacaoSaldo.textContent = `Igual a ${nomeAnterior}`;
    } else if (diferenca > 0) {
        comparacaoSaldo.textContent = `${formatarMoeda(diferenca)} a mais que em ${nomeAnterior}`;
        comparacaoSaldo.classList.add("positiva");
    } else {
        comparacaoSaldo.textContent = `${formatarMoeda(Math.abs(diferenca))} a menos que em ${nomeAnterior}`;
        comparacaoSaldo.classList.add("negativa");
    }
}

function excluirMovimentacao(id) {
    confirmarAcao("Deseja excluir esta movimentação?", () => {
        movimentacoes = movimentacoes.filter((item) => item.id !== id);

        localStorage.setItem("movimentacoes", JSON.stringify(movimentacoes));

        exibirMovimentacoes();
        atualizarResumo();
        atualizarGraficoReceitasDespesas();
        atualizarGraficoCategorias();
    });
}

function encerrarRecorrencia(id) {
    const mes = Number(seletorMes.value);
    const ano = Number(seletorAno.value);
    const nomeMes = seletorMes.options[seletorMes.selectedIndex].textContent;

    confirmarAcao(
        `Encerrar a recorrência a partir de ${nomeMes} de ${ano}? Os meses anteriores continuam com o lançamento.`,
        () => {
            const item = movimentacoes.find((mov) => mov.id === id);

            item.encerradaEm = ano * 12 + mes;

            localStorage.setItem("movimentacoes", JSON.stringify(movimentacoes));

            exibirMovimentacoes();
            atualizarResumo();
            atualizarGraficoReceitasDespesas();
            atualizarGraficoCategorias();
        },
        "Encerrar"
    );
}

function exibirMovimentacoes() {
    listaMovimentacoes.innerHTML = "";

    const mesSelecionado = Number(seletorMes.value);
    const anoSelecionado = Number(seletorAno.value);

    const movimentacoesFiltradas = movimentacoes.filter((item) => {
        return apareceNoMes(item, mesSelecionado, anoSelecionado);
    });

    if (movimentacoesFiltradas.length === 0) {
    const vazio = document.createElement("li");
    vazio.classList.add("mensagem-vazia");
    vazio.textContent = "Nenhuma movimentação neste mês.";
    listaMovimentacoes.appendChild(vazio);
    return;
}

    movimentacoesFiltradas.reverse().forEach((item) => {
        const li = document.createElement("li");

        const informacoes = document.createElement("div");
        informacoes.classList.add("info-movimentacao");

        const nome = document.createElement("span");
        nome.classList.add("nome-movimentacao");
        nome.textContent = item.descricao;

        const detalhes = document.createElement("span");
        detalhes.classList.add("detalhes-movimentacao");

        const [ano, mes, dia] = item.data.split("-");
        const dataFormatada = `${dia}/${mes}/${ano}`;

        detalhes.textContent = item.recorrente
            ? `${item.categoria} • ${dataFormatada} • Mensal`
            : `${item.categoria} • ${dataFormatada}`;

        const valorMovimentacao = document.createElement("span");
        valorMovimentacao.classList.add("valor-movimentacao");

        valorMovimentacao.textContent = item.valor.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });

        if (item.tipo === "receita") {
            valorMovimentacao.classList.add("receita");
            valorMovimentacao.textContent = `+ ${valorMovimentacao.textContent}`;
        } else {
            valorMovimentacao.classList.add("despesa");
            valorMovimentacao.textContent = `− ${valorMovimentacao.textContent}`;
        }

        const btnExcluir = document.createElement("button");
        btnExcluir.textContent = "Excluir";
        btnExcluir.classList.add("btn-excluir");

        const btnEditar = document.createElement("button");
        btnEditar.textContent = "Editar";
        btnEditar.classList.add("btn-editar");

        btnEditar.addEventListener("click", () => {
            abrirEdicao(item.id);
        });

        btnExcluir.addEventListener("click", () => {
            excluirMovimentacao(item.id);
        });

        const [anoInicio, mesInicio] = item.data.split("-");
        const mesesDoItem = Number(anoInicio) * 12 + (Number(mesInicio) - 1);
        const mesesSelecionado = anoSelecionado * 12 + mesSelecionado;

        let btnEncerrar = null;

        if (item.recorrente && mesesSelecionado > mesesDoItem) {
            btnEncerrar = document.createElement("button");
            btnEncerrar.textContent = "Encerrar";
            btnEncerrar.classList.add("btn-editar");

            btnEncerrar.addEventListener("click", () => {
                encerrarRecorrencia(item.id);
            });
        }

        informacoes.appendChild(nome);
        informacoes.appendChild(detalhes);

        li.appendChild(informacoes);
        li.appendChild(valorMovimentacao);

        if (btnEncerrar) {
            li.appendChild(btnEncerrar);
        }

        li.appendChild(btnEditar);
        li.appendChild(btnExcluir);


        listaMovimentacoes.appendChild(li);
    });
}


exibirMovimentacoes();
atualizarResumo();
atualizarGraficoReceitasDespesas();
atualizarGraficoCategorias();


seletorMes.addEventListener("change", atualizarResumo);
seletorAno.addEventListener("change", atualizarResumo);
seletorMes.addEventListener("change", atualizarGraficoReceitasDespesas);
seletorAno.addEventListener("change", atualizarGraficoReceitasDespesas);
seletorMes.addEventListener("change", atualizarGraficoCategorias);
seletorAno.addEventListener("change", atualizarGraficoCategorias);
seletorMes.addEventListener("change", exibirMovimentacoes);
seletorAno.addEventListener("change", exibirMovimentacoes);


btnAdicionar.addEventListener("click", () => {
    modal.classList.add("ativo");
});

btnCancelar.addEventListener("click", () => {
    fecharModal();
});


const tipo = document.getElementById("tipo");
const categoria = document.getElementById("categoria");

const categorias = {
    despesa: [
        "Essencial",
        "Alimentação",
        "Delivery",
        "Streaming",
        "Transporte",
        "Saúde",
        "Educação",
        "Lazer",
        "Outros"
    ],

    receita: [
        "Salário",
        "Bolsa",
        "Freelance",
        "Investimentos",
        "Outros"
    ]
};

function atualizarCategorias() {
    categoria.innerHTML = "";

    categorias[tipo.value].forEach((item) => {
        const opcao = document.createElement("option");

        opcao.value = item;
        opcao.textContent = item;

        categoria.appendChild(opcao);
    });
}

tipo.addEventListener("change", atualizarCategorias);

atualizarCategorias();


formulario.addEventListener("submit", (event) => {
    event.preventDefault();


    const movimentacao = {
        id: Date.now(),
        tipo: tipo.value,
        descricao: descricao.value.trim(),
        valor: Number(valor.value),
        categoria: categoria.value,
        data: data.value,
        recorrente: recorrente.checked
    };

    if (
        movimentacao.descricao === "" ||
        !Number.isFinite(movimentacao.valor) ||
        movimentacao.valor <= 0 ||
        movimentacao.data === ""
    ) {
        mostrarAviso("Preencha todos os campos corretamente.");
        return;
    }

    if (idEmEdicao === null) {
        movimentacoes.push(movimentacao);
    } else {
        const indice = movimentacoes.findIndex((mov) => mov.id === idEmEdicao);

        if (movimentacoes[indice].encerradaEm !== undefined && movimentacao.recorrente) {
            movimentacao.encerradaEm = movimentacoes[indice].encerradaEm;
        }

        movimentacao.id = idEmEdicao;
        movimentacoes[indice] = movimentacao;
    }

    localStorage.setItem("movimentacoes", JSON.stringify(movimentacoes));

    exibirMovimentacoes();
    atualizarResumo();
    atualizarGraficoReceitasDespesas();
    atualizarGraficoCategorias();

    fecharModal();
});
