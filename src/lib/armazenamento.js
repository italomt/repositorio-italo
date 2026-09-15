// Acesso ao localStorage que nunca derruba a aplicação.
//
// No Safari (iOS incluído) com "Bloquear todos os cookies" ligado, ou em alguns
// modos privados, ler ou escrever no localStorage lança SecurityError em vez de
// devolver null. Como a leitura do cache acontece dentro do carregamento inicial
// da viagem, uma exceção ali interrompia o carregar() antes do setLoading(false)
// e o app ficava preso no esqueleto para sempre.
//
// O cache aqui é só uma conveniência (lembrar a última viagem aberta): perder o
// valor é aceitável, travar o app não é.

export function lerLocal(chave) {
  try {
    return localStorage.getItem(chave)
  } catch {
    return null
  }
}

export function gravarLocal(chave, valor) {
  try {
    localStorage.setItem(chave, valor)
    return true
  } catch {
    return false
  }
}

export function removerLocal(chave) {
  try {
    localStorage.removeItem(chave)
    return true
  } catch {
    return false
  }
}
