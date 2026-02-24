# Manual de Teste — P&B Camera PoC (Medição)

## Objetivo

Validar que o pipeline de medição via câmera funciona corretamente no browser mobile: captura de frame, carregamento do OpenCV.js, detecção do cartão de referência, segmentação do objeto e exibição das medidas.

---

## Pré-requisitos

| Item | Detalhe |
|------|---------|
| Dispositivo | iPhone ou Android com câmera traseira |
| Browser | Safari (iOS), Chrome ou Brave |
| URL | https://pb-camera-poc.vercel.app |
| Conexão | Wi-Fi (primeiro acesso baixa ~10 MB do OpenCV.js) |
| Cartão de referência | Qualquer cartão de crédito/débito padrão (85,6 × 54 mm) |
| Fundo | **Folha de papel branco A4** (obrigatório) |
| Objeto de teste | Qualquer objeto com altura entre 5–20 cm e cor diferente do branco |

---

## Configuração do ambiente de teste

```
┌─────────────────────────────────────────────┐
│                                             │
│    [  OBJETO  ]     [ CARTÃO ]              │
│                                             │
│         FOLHA BRANCA A4                     │
│                                             │
└─────────────────────────────────────────────┘
              ↑
         câmera (top-down, ~30–40 cm de altura)
```

**Regras obrigatórias:**
1. Fundo **branco e liso** — papel A4, cartolina ou parede branca sem texturas
2. Cartão e objeto **no mesmo plano** (ambos apoiados na folha)
3. Câmera **de cima para baixo** (perpendicular à superfície)
4. Iluminação ambiente **uniforme** — sem sombras fortes, sem flash direto
5. **Não usar** fundos texturizados: madeira, concreto, tecido, granito

---

## Casos de Teste

---

### CT-01 — Carregamento inicial do OpenCV.js

**Objetivo:** Confirmar que o OpenCV.js carrega corretamente na primeira visita.

**Passos:**
1. Abra o browser em modo anônimo/privado
2. Acesse https://pb-camera-poc.vercel.app
3. Toque em **📷 Iniciar Câmera** → conceda permissão
4. Toque em **📏 Medir**
5. Posicione o setup (folha + cartão + objeto)
6. Aguarde os indicadores ficarem verdes
7. Toque em **📏 Fotografar**

**Resultado esperado:**
- Spinner "Analisando…" aparece por 3–15 segundos (download do OpenCV na primeira vez)
- Resultado com Comprimento e Circunferência é exibido
- Campo "Escala do cartão" mostra valor entre **6 e 15 px/mm**

**Resultado inaceitável:**
- Mensagem `OpenCV.js falhou: ...` → reportar com o texto exato do erro
- Spinner nunca some (> 30 segundos) → reportar como travamento

---

### CT-02 — Segunda captura (OpenCV já em cache)

**Objetivo:** Confirmar que o OpenCV.js em cache reduz o tempo de análise.

**Passos:**
1. Após CT-01, toque em **Nova medição**
2. Reposicione setup e toque em **📏 Fotografar** novamente

**Resultado esperado:**
- Spinner some em < 5 segundos (sem download)
- Resultado exibido normalmente

---

### CT-03 — Detecção do cartão

**Objetivo:** Confirmar que o cartão é detectado corretamente.

**Passos:**
1. Use a folha branca como fundo
2. Posicione o cartão **completamente dentro** da zona amarela pontilhada
3. Certifique-se que o cartão está **plano** (não dobrado ou inclinado > 15°)
4. Fotografe

**Resultado esperado:**
- Nenhuma mensagem de erro sobre cartão
- Campo "Escala do cartão" entre **6–15 px/mm**

**Resultado inaceitável:**
- `Cartão de referência não encontrado` → verificar posicionamento e fundo

**Diagnóstico via campo de escala:**

| Valor px/mm | Interpretação |
|-------------|---------------|
| < 4 | Cartão detectado com tamanho incorreto — medidas vão inflar |
| 4–6 | Aceitável para câmera distante |
| 6–15 | ✅ Normal para fotos a 20–40 cm |
| > 15 | Câmera muito próxima do cartão |

---

### CT-04 — Medição de objeto com dimensões conhecidas

**Objetivo:** Validar a precisão das medidas.

**Objeto sugerido:** Régua de 30 cm ou caixa com dimensões conhecidas.

**Passos:**
1. Posicione o objeto com a dimensão longa na vertical (alinhada com zona branca)
2. Posicione o cartão na zona amarela, **no mesmo plano** do objeto
3. Fotografe de cima

**Resultado esperado:**
- Comprimento com erro ≤ ±15% da medida real
- Exemplo: régua de 20 cm → resultado entre 17–23 cm

**Registrar:**
- Medida real do objeto: _____ cm
- Comprimento exibido: _____ cm
- Circunferência exibida: _____ cm
- Escala do cartão: _____ px/mm
- Erro percentual: _____%

---

### CT-05 — Indicadores de validação ao vivo

**Objetivo:** Confirmar que os indicadores orientam corretamente o usuário.

**Passos e resultados esperados:**

| Cenário | Dot Referência | Dot Iluminação | Botão |
|---------|---------------|----------------|-------|
| Câmera inativa | — | — | Oculto |
| Cena escura sem cartão | 🔴 | 🔴 | Desabilitado |
| Cartão branco visível, boa luz | 🟢 | 🟢 | **Ativo** |
| Cartão escuro (ex: Elo preto), boa luz | 🔴 | 🟢 | **Ativo** |
| Boa luz, sem cartão | 🔴 | 🟢 | **Ativo** |

> ⚠️ O indicador "Referência" (dot verde/vermelho) é orientativo — detecta cartões claros/brancos. Cartões escuros mostram vermelho mesmo presentes. **O botão ativa sempre que há iluminação suficiente.**

---

### CT-06 — Overlay sobre o preview da câmera

**Objetivo:** Confirmar que o overlay de guias é visível sobre o vídeo.

**Passos:**
1. Inicie a câmera e toque em **📏 Medir**

**Resultado esperado:**
- Retângulo branco pontilhado (zona "OBJETO") visível no lado esquerdo
- Retângulo amarelo pontilhado (zona "CARTÃO") visível no lado direito
- Dots de status (Referência/Iluminação) no canto superior direito
- Barra de feedback verde/escura na parte inferior

---

### CT-07 — Erro de cartão não encontrado

**Objetivo:** Confirmar que a mensagem de erro é clara quando o cartão não está presente.

**Passos:**
1. Fotografe uma cena **sem nenhum cartão**

**Resultado esperado:**
- Mensagem: `Cartão de referência não encontrado. Posicione o cartão na zona indicada.`
- Botão **Tentar novamente** disponível
- Toque em Tentar novamente → volta ao estado idle

---

### CT-08 — Erro de objeto não detectado

**Objetivo:** Confirmar que a mensagem de erro é clara quando o objeto não é detectado.

**Passos:**
1. Fotografe apenas o cartão sobre fundo branco (sem objeto)

**Resultado esperado:**
- Mensagem: `Objeto não detectado. Use fundo claro e certifique-se de que o objeto está visível.`

---

### CT-09 — Botão "Nova medição"

**Objetivo:** Confirmar que o fluxo de reset funciona.

**Passos:**
1. Conclua uma medição com resultado
2. Toque em **Nova medição**

**Resultado esperado:**
- Volta ao overlay da câmera com guias
- Estado idle restaurado
- Botão Fotografar disponível após validação

---

### CT-10 — Compatibilidade de browsers

Executar CT-01 + CT-04 em cada browser:

| Browser | Versão | CT-01 ✓/✗ | CT-04 ✓/✗ | Observações |
|---------|--------|-----------|-----------|-------------|
| Safari (iOS) | | | | |
| Chrome (iOS/Android) | | | | |
| Brave (iOS/Android) | | | | |
| Firefox (Android) | | | | |

---

### CT-11 — Aviso de objeto visto de cima

**Objetivo:** Confirmar que o app detecta e avisa quando um objeto cilíndrico é fotografado de cima (projeção circular).

**Passos:**
1. Posicione uma garrafa **em pé** dentro da zona branca + cartão na zona amarela
2. Fotografe de cima

**Resultado esperado:**
- Comprimento ≈ Diâmetro da tampa (ambos próximos)
- Card amarelo aparece: "O objeto parece visto de cima…"

**Validação do caminho correto:**
1. Deite a garrafa de lado e fotografe novamente
2. Confirmar: Comprimento = comprimento real ±15%; aviso **não aparece**

---

## Condições que invalidam o teste

Não reportar como bug se:

- ❌ Fundo texturizado (madeira, concreto, tecido, granito)
- ❌ Cartão e objeto em planos diferentes (cartão na parede, objeto na mesa)
- ❌ Câmera inclinada > 20° (não perpendicular ao objeto)
- ❌ Iluminação com sombras fortes ou contra-luz
- ❌ Objeto branco ou de cor muito próxima ao fundo
- ❌ Cartão cortado pela borda do frame

---

## O que reportar como bug

Reportar como bug se, com ambiente correto (fundo branco, mesmo plano, boa luz):

- OpenCV.js não carrega após 30 segundos
- Erro de JavaScript visível na tela (`script.onerror`, `TypeError`, etc.)
- Botão Fotografar nunca ativa mesmo com iluminação adequada
- Overlay não aparece sobre o vídeo
- App trava/congela sem mostrar resultado ou erro
- Escala do cartão exibe valor < 2 ou > 30 px/mm com cartão corretamente posicionado
- Erro > 30% entre medida real e medida exibida com setup correto

---

## Limitações conhecidas do PoC

| Limitação | Impacto | Workaround |
|-----------|---------|------------|
| Cartões escuros → dot "Referência" fica vermelho | Indicador visual falso negativo | Ignorar o dot, o botão ainda ativa |
| Objeto e cartão em planos diferentes → escala incorreta | Medidas infladas/defladas | Colocar ambos sobre a mesma superfície plana |
| Fundo texturizado confunde detecção do cartão | `Cartão não encontrado` | Usar folha branca |
| Primeiro carregamento do OpenCV.js demora ~10s | UX lenta | Normal, ocorre só uma vez |
| Processamento bloqueia UI por ~2-5s | Freeze breve | Esperado para PoC (main thread) |
| Objetos cilíndricos altos fotografados de cima → projeção 2D mostra só a tampa | Comprimento ≈ Diâmetro (ambos ≈ diâmetro da tampa); medida do comprimento real impossível nessa vista | App exibe aviso amarelo — **Deitar o objeto de lado** sobre a folha |
| Dot "Referência" pode ficar verde sobre papel branco sem cartão | Falso positivo visual (brilho do papel ativa heurística) | Ignorar dot; o pipeline valida corretamente no momento da captura |
| CT-08: pipeline pode retornar medição para sombras ou ruído de fundo | Medida espúria sem objeto real | Garantir que um objeto escuro claro esteja presente na zona OBJETO antes de fotografar |
| CT-09: instabilidade em medições repetidas na mesma sessão | Possível acumulação de memória do OpenCV.js | Recarregar a página se os resultados ficarem inconsistentes |
