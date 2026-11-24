function mostrarAviso(mensagem) {
    let aviso = document.getElementById("aviso");

    if (!aviso) {
        aviso = document.createElement("div");
        aviso.id = "aviso";
        aviso.classList.add("aviso");
        aviso.setAttribute("role", "alert");
        document.body.appendChild(aviso);
    }

    aviso.textContent = mensagem;
    aviso.classList.add("visivel");

    clearTimeout(aviso.temporizador);

    aviso.temporizador = setTimeout(() => {
        aviso.classList.remove("visivel");
    }, 3500);
}

function confirmarAcao(mensagem, aoConfirmar, rotulo = "Excluir") {
    const fundo = document.createElement("div");
    fundo.classList.add("modal", "ativo");

    const caixa = document.createElement("div");
    caixa.classList.add("modal-conteudo", "modal-confirmacao");

    const texto = document.createElement("p");
    texto.classList.add("texto-confirmacao");
    texto.textContent = mensagem;

    const botoes = document.createElement("div");
    botoes.classList.add("botoes-form");

    const btnCancelar = document.createElement("button");
    btnCancelar.type = "button";
    btnCancelar.classList.add("btn-secundario");
    btnCancelar.textContent = "Cancelar";

    const btnExcluir = document.createElement("button");
    btnExcluir.type = "button";
    btnExcluir.classList.add("btn-perigo");
    btnExcluir.textContent = rotulo;

    btnCancelar.addEventListener("click", () => {
        fundo.remove();
    });

    btnExcluir.addEventListener("click", () => {
        fundo.remove();
        aoConfirmar();
    });

    fundo.addEventListener("click", (event) => {
        if (event.target === fundo) {
            fundo.remove();
        }
    });

    botoes.appendChild(btnCancelar);
    botoes.appendChild(btnExcluir);

    caixa.appendChild(texto);
    caixa.appendChild(botoes);
    fundo.appendChild(caixa);

    document.body.appendChild(fundo);
}